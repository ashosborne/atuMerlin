#!/usr/bin/env python3
"""Additively upsert discovery/<slice>/MANIFEST.yaml Phase A output into inventory/<APP_ID>/APP_MANIFEST.yaml.

Rules (estate-discovery-loop v0.1 / app-manifest schema v1):
- New surfaces/behaviours enter as `candidate` (or `unknown`). Never `accepted`/`documented`.
- Existing rows whose status a human changed (accepted, deferred, rejected, documented, ...) are left untouched.
- `scanned_seeds` grows; `unscanned_hints` shrinks only for seeds actually scanned.
- Never sets status/completeness to anything implying done. No percentages.

Usage: python3 overnight/tools/upsert_app_manifest.py [--app-id atu-merlin] [--updated-by estate-discovery-loop]
"""
import argparse
import datetime as dt
import glob
from pathlib import Path

import yaml

HUMAN_SET = {"accepted", "deferred", "rejected", "documented", "converted", "verified"}

# Callable surfaces per slice. DSPF/PRTF are recorded as evidence on the program surface,
# not as surfaces themselves (a display file is not a callable seam).
SURFACES = {
    "cus-interactive": [
        ("pgm:CUS200", "ATU_SRC/QRPGLESRC/CUS200.PGM.SQLRPGLE", "*PGM SQLRPGLE - Work with Customers (menu opt 2); screen CUS200D", ["ATU_SRC/QDDSSRC/CUS200D.DSPF", "ATU_SRC/QPNLSRC/SAMMNU.MENU:88-91"]),
        ("pgm:CUS250", "ATU_SRC/QRPGLESRC/CUS250.PGM.RPGLE", "*PGM RPGLE - Customer by id (menu opt 8); screen CUS250D", ["ATU_SRC/QDDSSRC/CUS250D.DSPF", "ATU_SRC/QPNLSRC/SAMMNU.MENU:112-115"]),
    ],
    "cus-modules": [
        ("srvpgm:FCUSTOMER", "ATU_SRC/QILESRVSRC/FCUSTOMER.ILESRVPGM", "*SRVPGM MODULE(CUS300 CUS301); exports per FCUSTOMER.BND", ["ATU_SRC/QSRVSRC/FCUSTOMER.BND"]),
        ("mod:CUS300", "ATU_SRC/QRPGLESRC/CUS300.RPGLE", "*MODULE nomain - GetCus* getters, ExistCus, IsCusDeleted", []),
        ("mod:CUS301", "ATU_SRC/QRPGLESRC/CUS301.SQLRPGLE", "*MODULE nomain - SltCustomer selection window; screen CUS301D", ["ATU_SRC/QDDSSRC/CUS301D.DSPF"]),
    ],
    "art-interactive": [
        ("pgm:ART200", "ATU_SRC/QRPGLESRC/ART200.PGM.SQLRPGLE", "*PGM SQLRPGLE - Work with Articles (menu opt 1); screen ART200D", ["ATU_SRC/QDDSSRC/ART200D.DSPF", "ATU_SRC/QPNLSRC/SAMMNU.MENU:84-87"]),
        ("pgm:ART201", "ATU_SRC/QRPGLESRC/ART201.PGM.RPGLE", "*PGM RPGLE - Providers of an article (called by ART200/ART250); screen ART201D", ["ATU_SRC/QDDSSRC/ART201D.DSPF"]),
        ("pgm:ART202", "ATU_SRC/QRPGLESRC/ART202.PGM.RPGLE", "*PGM RPGLE - Articles of a provider (called by PRO200/PRO250); screen ART202D", ["ATU_SRC/QDDSSRC/ART202D.DSPF"]),
        ("pgm:ART250", "ATU_SRC/QRPGLESRC/ART250.PGM.SQLRPGLE", "*PGM SQLRPGLE - Article by id (menu opt 7); screen ART250D", ["ATU_SRC/QDDSSRC/ART250D.DSPF", "ATU_SRC/QPNLSRC/SAMMNU.MENU:108-111"]),
    ],
    "art-modules": [
        ("srvpgm:FARTICLE", "ATU_SRC/QILESRVSRC/FARTICLE.ILESRVPGM", "*SRVPGM MODULE(ART300 ART301) BNDSRVPGM(FFAMILLY); ART302 NOT listed", ["ATU_SRC/QSRVSRC/FARTICLE.BND"]),
        ("mod:ART300", "ATU_SRC/QRPGLESRC/ART300.RPGLE", "*MODULE nomain - GetArt* getters, ExistArt, IsArtDeleted", []),
        ("mod:ART301", "ATU_SRC/QRPGLESRC/ART301.SQLRPGLE", "*MODULE nomain - SltArticle selection window; screen ART301D", ["ATU_SRC/QDDSSRC/ART301D.DSPF"]),
        ("mod:ART302", "ATU_SRC/QRPGLESRC/ART302.SQLRPGLE", "*MODULE nomain - GetArtInfo (ARTIINF); binding into FARTICLE not in source", []),
    ],
    "ord-entry-ord100": [
        ("pgm:ORD100", "ATU_SRC/QRPGLESRC/ORD100.PGM.RPGLE", "*PGM RPGLE - Create customer order; screen ORD100D; needs TMPDETORD override", ["ATU_SRC/QDDSSRC/ORD100D.DSPF"]),
        ("cl:ORD100C", "ATU_SRC/QCLSRC/ORD100C.PGM.CLLE", "*PGM CLLE - stage QTEMP/DETORD then CRTORD CUID(&CUID)", []),
        ("cl:ORD100C2", "ATU_SRC/QCLSRC/ORD100C2.PGM.CLLE", "*PGM CLLE - stage QTEMP/DETORD then CALL ORD100 (menu opt 6)", ["ATU_SRC/QPNLSRC/SAMMNU.MENU:104-107"]),
        ("cmd:CRTORD", "ATU_SRC/QCMDSRC/CRTORD.CMD", "*CMD Create an Order (CUID); PGM binding not in source (inferred ORD100)", []),
    ],
    "ord-entry-ord101": [
        ("pgm:ORD101", "ATU_SRC/QRPGLESRC/ORD101.PGM.RPGLE", "*PGM RPGLE - Maintain lines of an existing order (called by ORD200/ORD201 opt 2); screen ORD101D", ["ATU_SRC/QDDSSRC/ORD101D.DSPF"]),
    ],
    "ord-maintain-ord200": [
        ("pgm:ORD200", "ATU_SRC/QRPGLESRC/ORD200.PGM.SQLRPGLE", "*PGM SQLRPGLE - Orders of one customer (called by CUS200 opt 5); screen ORD200D", ["ATU_SRC/QDDSSRC/ORD200D.DSPF"]),
    ],
    "ord-maintain-ord201": [
        ("pgm:ORD201", "ATU_SRC/QRPGLESRC/ORD201.PGM.SQLRPGLE", "*PGM SQLRPGLE - Work with Customer Orders (menu opt 3); screen ORD201D", ["ATU_SRC/QDDSSRC/ORD201D.DSPF", "ATU_SRC/QPNLSRC/SAMMNU.MENU:92-95"]),
    ],
    "ord-maintain-ord202": [
        ("pgm:ORD202", "ATU_SRC/QRPGLESRC/ORD202.PGM.RPGLE", "*PGM RPGLE - Display order (read-only; called by ORD200/ORD201 opt 5); screen ORD202D", ["ATU_SRC/QDDSSRC/ORD202D.DSPF"]),
    ],
    "ord-print-ord500": [
        ("pgm:ORD500", "ATU_SRC/QRPGLESRC/ORD500.PGM.RPGLE", "*PGM RPGLE - Print order to spool ORD500O then call ORD500C", ["ATU_SRC/QDDSSRC/ORD500O.PRTF"]),
        ("cl:ORD500C", "ATU_SRC/QCLSRC/ORD500C.PGM.CLLE", "*PGM CLLE - CVTSPLPDF spool to IFS PDF (command impl not in tree)", ["ATU_SRC/QCMDSRC/CVTSPLPDF.CMD"]),
    ],
    "ord-trigger-ord700": [
        ("trgpgm:ORD700", "ATU_SRC/QRPGLESRC/ORD700.PGM.RPGLE", "*PGM RPGLE - external trigger program on DETORD maintaining ARTICLE.ARCUSQTY", []),
        ("trg:DETORD.ORD700_DETORD_ARTICLE_*", "ATU_SRC/QTRGSRC/ORD700A.SYSTRG", "ADDPFTRG x3 (*AFTER insert/delete/update) on DETORD -> ORD700; attachment on box inferred", ["ATU_SRC/QTRGSRC/ORD700D.SYSTRG", "ATU_SRC/QTRGSRC/ORD700U.SYSTRG"]),
        ("trg:ORDER.ORD701_Insert_order", "ATU_SRC/QSQLSRC/ORD701.SQLTRG", "SQL AFTER INSERT trigger on ORDER -> CUSTOMER.CULASTORD", []),
    ],
    "ord-batch-ord900": [
        ("pgm:ORD900", "ATU_SRC/QRPGLESRC/ORD900.PGM.RPGLE", "*PGM RPGLE - Reset LASTORDNO to max ORID (menu opt 80)", ["ATU_SRC/QPNLSRC/SAMMNU.MENU:143-146"]),
        ("pgm:ORD901", "ATU_SRC/QRPGLESRC/ORD901.PGM.SQLRPGLE", "*PGM SQLRPGLE - Shift order dates to today; resync years and CULASTORD (menu opt 81)", ["ATU_SRC/QPNLSRC/SAMMNU.MENU:147-150"]),
    ],
}

# Seeds from CHARTER.yaml INITIAL_SEEDS in queue order; those not scanned stay as unscanned_hints.
ALL_SEEDS = [
    "cus-interactive", "cus-modules", "art-interactive", "art-modules",
    "ord-entry-ord100", "ord-entry-ord101", "ord-maintain-ord200", "ord-maintain-ord201",
    "ord-maintain-ord202", "ord-print-ord500", "ord-trigger-ord700", "ord-batch-ord900",
    "pro-interactive", "pro-modules", "pro-cobol-pro201",
    "fam-maintain", "cou-maintain", "par-maintain", "vat-module", "log-programs", "dat-utils",
    "srvpgm-fcustomer", "srvpgm-farticle", "srvpgm-fprovider", "srvpgm-supporting",
    "menu-cmd-shell", "sql-objects",
]

SEED_HINT_TEXT = {
    "pro-interactive": "seed pro-interactive: PRO200/PRO202/PRO203/PRO250 + PRO200D/201D/202D/250D (PRO200.ILEPGM binds XML srvpgm - source missing)",
    "pro-modules": "seed pro-modules: PRO300/PRO301 + PRO301D (FPROVIDER body)",
    "pro-cobol-pro201": "seed pro-cobol-pro201: QCBLSRC/PRO201.CBL (only COBOL member; menu opt 5)",
    "fam-maintain": "seed fam-maintain: FAM300/FAM301 + FAM301D (FFAMILLY body; SltArtFam used by ART200/ART301)",
    "cou-maintain": "seed cou-maintain: COU200.RPG (OPM RPG, menu opt 21) + COU300/COU301 (FCOUNTRY body; used by CUS200/CUS250)",
    "par-maintain": "seed par-maintain: PAR200 (menu opt 20) + PAR201 CL/ILEPGM (menu opt 83, WRKLNK on PATH) + PAR300 (FPARAMETER getParm*; PATH used by ORD500)",
    "vat-module": "seed vat-module: VAT300 (FVAT: CLCVat/GetVatRate used by ORD100/ORD101/ART250)",
    "log-programs": "seed log-programs: LOG100 (create SAMLOG user space) + LOG300 (AddLogEntry; used by ORD700 delete)",
    "dat-utils": "seed dat-utils: DAT001/DAT002 (external programs behind SQL UDFs ISOTODATE/ISOTODATE40 used by ORD200/ORD201)",
    "srvpgm-fcustomer": "seed srvpgm-fcustomer: FCUSTOMER binding/export view - recommend merging into cus-modules at bind",
    "srvpgm-farticle": "seed srvpgm-farticle: FARTICLE binding/export view - recommend merging into art-modules at bind (ART302 gap)",
    "srvpgm-fprovider": "seed srvpgm-fprovider: FPROVIDER.ILESRVPGM + FPROVIDER.BND (versioned signatures *GEN/*PRV)",
    "srvpgm-supporting": "seed srvpgm-supporting: FFAMILLY/FCOUNTRY/FPARAMETER/FVAT/LOG srvpgms + SAMPLE.BNDDIR (lists XML/ORDER/TXT/XSS srvpgms with no source)",
    "menu-cmd-shell": "seed menu-cmd-shell: SAMMNU.MENU (entry map), SAMHELP.PNLGRP, SAMMSGF.MSGF, CVTSPLPDF.CMD; menu references QM queries CUSQRY/ARTQRY and ADSPUSRSPC not in tree",
    "sql-objects": "seed sql-objects: ART801.SQLPRC (menu opt 82 reconciliation), ARTIINF.TABLE, ARTLSTDAT.VIEW, CUSSEQ.SQLSEQ, ISOTODATE/ISOTODATE4.SQLUDF, ORDERCUS.VIEW",
}

STRUCTURAL_HINTS = [
    "blind-spot: XML, ORDER, TXT, XSS *SRVPGM in SAMPLE.BNDDIR have no source under ATU_SRC (PRO200.ILEPGM binds XML; PRO202 /copy qprotosrc,xml missing)",
    "blind-spot: QM query objects CUSQRY, ARTQRY, form CUSQRYFMT (menu opts 12/13) not in tree",
    "blind-spot: CVTSPLPDF processing program and ADSPUSRSPC command not in tree",
    "blind-spot: CMD->PGM bindings (CRTORD) and trigger attachment are compiled-object/ARCAD metadata, not source",
    "unknown-surface: CUSTADRE.PF / ADDRESS.PF (multi-address model) referenced by no program in ATU_SRC",
    "unknown-surface: ARTIPROV link creation - no program found that writes new ARTIPROV rows",
]


def load_yaml(p: Path):
    return yaml.safe_load(p.read_text()) if p.exists() else None


def stub(app_id: str, now: str) -> dict:
    return {
        "schema_version": 1,
        "app_id": app_id,
        "repo": "https://github.com/ashosborne/atuMerlin",
        "status": "in_progress",
        "completeness": "incomplete",
        "scanned_seeds": [],
        "unscanned_hints": [],
        "surfaces": [],
        "behaviours": [],
        "last_updated": now,
        "updated_by": None,
        "notes": None,
    }


def pick_surface(slice_id: str, feature: dict, surfaces: list[tuple]) -> str:
    text = " ".join(e.get("locator", "") for e in feature.get("entrypoints", []))
    text += " " + " ".join(ev for e in feature.get("entrypoints", []) for ev in e.get("evidence", []))
    for sid, _loc, _notes, _ev in surfaces:
        obj = sid.split(":", 1)[1].split(".")[0].split("_")[0]
        if obj and obj in text:
            return sid
    return surfaces[0][0]


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--app-id", default="atu-merlin")
    ap.add_argument("--updated-by", default="estate-discovery-loop")
    args = ap.parse_args()

    now = dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    inv = Path(f"inventory/{args.app_id}")
    inv.mkdir(parents=True, exist_ok=True)
    mpath = inv / "APP_MANIFEST.yaml"
    manifest = load_yaml(mpath) or stub(args.app_id, now)

    surf_by_id = {s["surface_id"]: s for s in manifest["surfaces"]}
    beh_by_id = {b["behaviour_id"]: b for b in manifest["behaviours"]}
    added_s = added_b = updated_b = 0

    for path in sorted(glob.glob("discovery/*/MANIFEST.yaml")):
        sm = yaml.safe_load(Path(path).read_text())
        slice_id = sm["slice_id"]
        if sm.get("phase") != "A" and slice_id not in SURFACES:
            continue
        surfaces = SURFACES.get(slice_id, [])
        for sid, loc, notes, evidence in surfaces:
            if sid in surf_by_id:
                existing = surf_by_id[sid]
                for ev in [loc] + evidence:
                    existing.setdefault("discovery_evidence", [])
                    if ev not in existing["discovery_evidence"]:
                        existing["discovery_evidence"].append(ev)
                continue
            row = {
                "surface_id": sid,
                "kind": "other",
                "locator": loc,
                "repo_path": loc.split(":")[0],
                "status": "candidate",
                "slice_id": slice_id,
                "notes": notes,
                "discovery_evidence": [loc] + evidence,
            }
            manifest["surfaces"].append(row)
            surf_by_id[sid] = row
            added_s += 1

        for f in sm.get("features", []):
            bid = f["id"]
            note = f"confidence: {f.get('confidence')}; {f.get('summary', '')}".strip()
            if bid in beh_by_id:
                existing = beh_by_id[bid]
                if existing.get("status") in HUMAN_SET:
                    continue
                if existing.get("notes") != note or existing.get("name") != f.get("name"):
                    existing["notes"] = note
                    existing["name"] = f.get("name")
                    updated_b += 1
                continue
            row = {
                "behaviour_id": bid,
                "surface_id": pick_surface(slice_id, f, surfaces) if surfaces else "unknown",
                "name": f.get("name"),
                "status": "candidate" if f.get("status") == "candidate" else "unknown",
                "slice_id": slice_id,
                "discovery_card": None,
                "traceability": None,
                "pack_id": None,
                "pack_version": None,
                "conversion_prs": [],
                "parity": None,
                "legacy_green": False,
                "parity_green": False,
                "waiver": None,
                "notes": note,
            }
            manifest["behaviours"].append(row)
            beh_by_id[bid] = row
            added_b += 1

        for us in sm.get("unknown_surfaces", []) or []:
            sid = f"unknown:{Path(us['locator']).name}"
            if sid not in surf_by_id:
                row = {
                    "surface_id": sid,
                    "kind": "other",
                    "locator": us["locator"],
                    "repo_path": us["locator"],
                    "status": "unknown",
                    "slice_id": slice_id,
                    "notes": us.get("note"),
                    "discovery_evidence": [us["locator"]],
                }
                manifest["surfaces"].append(row)
                surf_by_id[sid] = row
                added_s += 1

        if slice_id not in manifest["scanned_seeds"]:
            manifest["scanned_seeds"].append(slice_id)

    scanned = set(manifest["scanned_seeds"])
    hints = [h for h in manifest["unscanned_hints"] if not h.startswith("seed ") or h.split(":")[0][5:] not in scanned]
    for seed in ALL_SEEDS:
        if seed in scanned:
            continue
        text = SEED_HINT_TEXT.get(seed, f"seed {seed}")
        if text not in hints:
            hints.append(text)
    for h in STRUCTURAL_HINTS:
        if h not in hints:
            hints.append(h)
    manifest["unscanned_hints"] = hints

    manifest["status"] = "in_progress" if manifest.get("status") in (None, "in_progress") else manifest["status"]
    if manifest.get("completeness") not in ("bound_incomplete_ok", "complete_bound"):
        manifest["completeness"] = "incomplete"
    manifest["last_updated"] = now
    manifest["updated_by"] = args.updated_by
    manifest["notes"] = (
        "estate_scan: partial (see overnight/METHOD_COVERAGE.md). Pack A radar output: candidates only, nothing bound. "
        "Surfaces are callable IBM i objects (PGM/MODULE/SRVPGM/CL/CMD/trigger); DSPF/PRTF are evidence on the owning program. "
        "kind=other for all IBM i surfaces (schema enum is integration-flavoured). Human residual gate required."
    )

    mpath.write_text(yaml.safe_dump(manifest, sort_keys=False, allow_unicode=True, width=200))
    print(f"surfaces +{added_s} (total {len(manifest['surfaces'])}); behaviours +{added_b} ~{updated_b} (total {len(manifest['behaviours'])}); "
          f"scanned_seeds {len(manifest['scanned_seeds'])}; unscanned_hints {len(manifest['unscanned_hints'])}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
