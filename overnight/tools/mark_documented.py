#!/usr/bin/env python3
"""Mirror human-bound / Phase B statuses from discovery/<slice>/MANIFEST.yaml into inventory/<APP_ID>/APP_MANIFEST.yaml.

Status bumps + pointers only (Field Guide "Who writes what": Discovery may move candidate -> accepted / documented).
- behaviour status: accepted | documented | deferred | rejected are copied from the slice MANIFEST; `documented` also sets
  `discovery_card` to the card path. Notes are refreshed with the Phase B summary.
- surface status: candidate -> accepted when the slice `bind_status` is accepted; -> deferred when deferred. `unknown` stays.
- never sets converted / verified / green flags; never adds surfaces or behaviours (that is upsert_app_manifest.py's job).

Usage: python3 overnight/tools/mark_documented.py [--app-id atu-merlin] [--updated-by document-slices-conveyor] [--slice cus-interactive ...]
"""
import argparse
import datetime as dt
import glob
from pathlib import Path

import yaml

MIRRORED = {"accepted", "documented", "deferred", "rejected"}
RANK = {"candidate": 0, "unknown": 0, "accepted": 1, "deferred": 1, "rejected": 1, "documented": 2, "converted": 3, "verified": 4}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--app-id", default="atu-merlin")
    ap.add_argument("--updated-by", default="document-slices-conveyor")
    ap.add_argument("--slice", action="append", default=None, help="limit to these slice ids (default: all)")
    ap.add_argument("--note", default=None, help="one-line note appended to APP_MANIFEST.notes")
    args = ap.parse_args()

    now = dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    mpath = Path(f"inventory/{args.app_id}/APP_MANIFEST.yaml")
    manifest = yaml.safe_load(mpath.read_text())
    beh_by_id = {b["behaviour_id"]: b for b in manifest["behaviours"]}
    bumped_b = bumped_s = cards = 0

    for path in sorted(glob.glob("discovery/*/MANIFEST.yaml")):
        sm = yaml.safe_load(Path(path).read_text())
        slice_id = sm["slice_id"]
        if args.slice and slice_id not in args.slice:
            continue
        slice_dir = Path(path).parent

        for f in sm.get("features", []):
            b = beh_by_id.get(f["id"])
            status = f.get("status")
            if b is None or status not in MIRRORED:
                continue
            # never regress a later-stage status (converted/verified) from a Discovery mirror
            if RANK.get(b.get("status"), 0) > RANK.get(status, 0):
                continue
            if b.get("status") != status:
                b["status"] = status
                bumped_b += 1
            if status == "documented" and f.get("behaviour_doc"):
                card = str(slice_dir / f["behaviour_doc"])
                if b.get("discovery_card") != card:
                    b["discovery_card"] = card
                    cards += 1
            b["name"] = f.get("name", b.get("name"))
            b["notes"] = f"confidence: {f.get('confidence')}; {f.get('summary', '')}".strip()

        bind = sm.get("bind_status")
        for s in manifest["surfaces"]:
            if s.get("slice_id") != slice_id or s.get("status") != "candidate":
                continue
            if bind == "accepted":
                s["status"] = "accepted"
                bumped_s += 1
            elif bind == "deferred":
                s["status"] = "deferred"
                bumped_s += 1

    manifest["last_updated"] = now
    manifest["updated_by"] = args.updated_by
    # app-manifest.schema.json: notes is string|null — keep one string, entries separated by " | "
    notes = manifest.get("notes")
    if isinstance(notes, list):
        notes = " | ".join(str(n) for n in notes)
    if args.note and (not notes or args.note not in notes):
        notes = f"{notes} | {args.note}" if notes else args.note
    manifest["notes"] = notes

    mpath.write_text(yaml.safe_dump(manifest, sort_keys=False, allow_unicode=True, width=200))
    print(f"behaviours status-bumped {bumped_b}; discovery_card set {cards}; surfaces status-bumped {bumped_s}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
