#!/usr/bin/env python3
"""Regenerate inventory/<APP_ID>/COVERAGE.md from APP_MANIFEST.yaml.

COVERAGE.md is a generated glance surface (Field Guide: never hand-edit).
Counts and histograms only — no completion percentages are emitted, by design.

Usage: python3 overnight/tools/gen_coverage.py [inventory/atu-merlin]
"""
import json
import sys
from collections import Counter
from pathlib import Path

import yaml

FORBIDDEN_COUNT_KEYS = ("percent", "pct", "complete", "completion", "progress")
ALLOWED_SURFACE_STATUS = {"candidate", "accepted", "deferred", "rejected", "unknown"}
ALLOWED_BEHAVIOUR_STATUS = {
    "candidate", "accepted", "documented", "converted", "verified",
    "deferred", "rejected", "unknown",
}


def lint(manifest: dict) -> list[str]:
    """Cheap structural checks mirroring app-manifest.schema.json (no jsonschema dep)."""
    problems = []
    required = ["schema_version", "app_id", "status", "completeness", "scanned_seeds",
                "unscanned_hints", "surfaces", "behaviours", "last_updated"]
    for key in required:
        if key not in manifest:
            problems.append(f"missing required key: {key}")
    if manifest.get("schema_version") != 1:
        problems.append("schema_version must be 1")
    if manifest.get("completeness") not in {"incomplete", "bound_incomplete_ok", "complete_bound"}:
        problems.append("completeness enum violation")
    surface_ids = set()
    for s in manifest.get("surfaces", []):
        sid = s.get("surface_id")
        if not sid:
            problems.append("surface without surface_id")
            continue
        if sid in surface_ids:
            problems.append(f"duplicate surface_id {sid}")
        surface_ids.add(sid)
        if s.get("status") not in ALLOWED_SURFACE_STATUS:
            problems.append(f"surface {sid}: bad status {s.get('status')}")
    behaviour_ids = set()
    for b in manifest.get("behaviours", []):
        bid = b.get("behaviour_id")
        if not bid:
            problems.append("behaviour without behaviour_id")
            continue
        if bid in behaviour_ids:
            problems.append(f"duplicate behaviour_id {bid}")
        behaviour_ids.add(bid)
        if b.get("status") not in ALLOWED_BEHAVIOUR_STATUS:
            problems.append(f"behaviour {bid}: bad status {b.get('status')}")
        if b.get("surface_id") not in surface_ids:
            problems.append(f"behaviour {bid}: unknown surface_id {b.get('surface_id')}")
        if b.get("status") == "verified" and b.get("parity") != "GREEN":
            problems.append(f"behaviour {bid}: verified without parity GREEN")
        if b.get("parity") == "WAIVED" and (b.get("parity_green") or b.get("legacy_green")):
            problems.append(f"behaviour {bid}: WAIVED with green flag")
    for key in manifest.get("counts", {}) or {}:
        if any(f in key.lower() for f in FORBIDDEN_COUNT_KEYS):
            problems.append(f"forbidden counts key: {key}")
    return problems


def compute_counts(manifest: dict) -> dict:
    surfaces = manifest.get("surfaces", [])
    behaviours = manifest.get("behaviours", [])
    return {
        "surfaces_total": len(surfaces),
        "surfaces_by_status": dict(sorted(Counter(s["status"] for s in surfaces).items())),
        "behaviours_known": len(behaviours),
        "behaviours_by_status": dict(sorted(Counter(b["status"] for b in behaviours).items())),
        "unscanned_hints": len(manifest.get("unscanned_hints", [])),
        "legacy_green": sum(1 for b in behaviours if b.get("legacy_green")),
        "parity_green": sum(1 for b in behaviours if b.get("parity_green")),
        "parity_waived": sum(1 for b in behaviours if b.get("parity") == "WAIVED"),
    }


def render(manifest: dict, counts: dict, problems: list[str]) -> str:
    behaviours = manifest.get("behaviours", [])
    surfaces = manifest.get("surfaces", [])
    by_slice = Counter(b.get("slice_id") or "(none)" for b in behaviours)
    conf = Counter()
    for b in behaviours:
        note = (b.get("notes") or "")
        if "confidence: observed-in-code" in note:
            conf["observed-in-code"] += 1
        elif "confidence: inferred" in note:
            conf["inferred"] += 1
        elif "confidence: needs-SME" in note:
            conf["needs-SME"] += 1
        else:
            conf["(unlabelled)"] += 1
    surfaces_by_slice = Counter(s.get("slice_id") or "(none)" for s in surfaces)

    out = []
    out.append(f"# COVERAGE — {manifest['app_id']}")
    out.append("")
    out.append("> Generated from `APP_MANIFEST.yaml` by `overnight/tools/gen_coverage.py`. **Do not hand-edit.**")
    out.append("> Counts only. No completion percentage exists or should be derived from this file.")
    out.append("")
    out.append(f"- app status: `{manifest['status']}` · completeness: `{manifest['completeness']}` (human residual gate)")
    out.append(f"- last_updated: `{manifest['last_updated']}` by `{manifest.get('updated_by')}`")
    notes = manifest.get("notes")
    if isinstance(notes, list):
        problems.append("notes must be a string (schema: string|null)")
    parts = [p.strip() for p in str(notes or "").split(" | ") if p.strip()]
    if len(parts) > 1:
        out.append("- notes:")
        out.extend(f"  - {p}" for p in parts)
    else:
        out.append(f"- notes: {notes or '—'}")
    out.append("")
    out.append("## Histogram")
    out.append("")
    out.append("| Metric | Count |")
    out.append("| --- | ---: |")
    out.append(f"| surfaces_total | {counts['surfaces_total']} |")
    for k, v in counts["surfaces_by_status"].items():
        out.append(f"| surfaces `{k}` | {v} |")
    out.append(f"| behaviours_known | {counts['behaviours_known']} |")
    for k, v in counts["behaviours_by_status"].items():
        out.append(f"| behaviours `{k}` | {v} |")
    for k, v in sorted(conf.items()):
        out.append(f"| behaviours confidence `{k}` | {v} |")
    out.append(f"| scanned_seeds | {len(manifest.get('scanned_seeds', []))} |")
    out.append(f"| unscanned_hints | {counts['unscanned_hints']} |")
    out.append(f"| legacy_green | {counts['legacy_green']} |")
    out.append(f"| parity_green | {counts['parity_green']} |")
    out.append(f"| parity_waived | {counts['parity_waived']} |")
    out.append("")
    out.append("## Per slice (counts, not progress — weakest status wins)")
    out.append("")
    out.append("| slice_id | surfaces | behaviours | documented | weakest status |")
    out.append("| --- | ---: | ---: | ---: | --- |")
    order = ["candidate", "unknown", "deferred", "rejected", "accepted", "documented", "converted", "verified"]
    for slice_id in sorted(set(by_slice) | set(surfaces_by_slice)):
        statuses = [b["status"] for b in behaviours if (b.get("slice_id") or "(none)") == slice_id]
        weakest = min(statuses, key=lambda s: order.index(s) if s in order else 99) if statuses else "—"
        documented = sum(1 for s in statuses if s in ("documented", "converted", "verified"))
        out.append(f"| `{slice_id}` | {surfaces_by_slice.get(slice_id, 0)} | {by_slice.get(slice_id, 0)} | {documented} | `{weakest}` |")
    out.append("")
    out.append("## Scanned seeds")
    out.append("")
    for s in manifest.get("scanned_seeds", []):
        out.append(f"- `{s}`")
    out.append("")
    out.append("## Unscanned hints (residual — not a completeness claim)")
    out.append("")
    for h in manifest.get("unscanned_hints", []):
        out.append(f"- {h}")
    out.append("")
    out.append("## Lint")
    out.append("")
    if problems:
        out.append("Problems found (fix APP_MANIFEST, then regenerate):")
        out.extend(f"- {p}" for p in problems)
    else:
        out.append("APP_MANIFEST passed structural lint (schema_version 1, ids unique, enums, anti-greenwash flags).")
    out.append("")
    return "\n".join(out)


def main() -> int:
    inv_dir = Path(sys.argv[1] if len(sys.argv) > 1 else "inventory/atu-merlin")
    manifest_path = inv_dir / "APP_MANIFEST.yaml"
    manifest = yaml.safe_load(manifest_path.read_text())
    problems = lint(manifest)
    counts = compute_counts(manifest)
    (inv_dir / "COVERAGE.md").write_text(render(manifest, counts, problems))
    print(json.dumps({"counts": counts, "problems": problems}, indent=2))
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
