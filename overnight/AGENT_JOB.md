DONE

# PACK B — Document-slices conveyor (atuMerlin) — run 7 after residual bind
# Prefer: cou-maintain FCOUNTRY half only (c07–c12). COU200 (c01–c06, c13) stays deferred.
# Branch: cursor/atu-merlin-estate-discovery. Never master. Never ATU_SRC.
# Cap 1 slice per run. vat-module DONE run 5. dat-utils DONE run 6. cou-maintain FCOUNTRY DONE run 7. CHARACTERIZATION deferred-waived.
# Do not convert. Do not widen atu-merlin-ts-cus-v1.
# Result run 7 (2026-09-08): 6/6 accepted cards c07–c12 written; c01–c06, c13 mirrored deferred; MANIFEST phase B; APP_MANIFEST documented 60->66; COVERAGE 0 lint problems; INDEX row 17 mirrored.
# Phase A correction: COU301/FAM301 F8 divergence is source-only (identical on screen) — see c10 / SME_BRIEF.
# Residual-wave queue EMPTY. Conveyor idle until the next ORD bind wave (ord-entry-ord101, ord-maintain-ord200/201/202, ord-print-ord500).
# Brief: overnight/MORNING_BRIEF.md · cards: discovery/cou-maintain/features/ · sign-off: discovery/cou-maintain/SME_BRIEF.md

You are running a re-runnable document-slices conveyor on atuMerlin.

Job this run: pick one accepted but not-yet-documented slice — prefer cou-maintain FCOUNTRY half only (c07–c12). Do not deepen deferred COU200 (c01–c06, c13). Run Discovery Phase B deepen (behaviour cards from source), update MANIFEST to documented, regenerate COVERAGE, commit on factory branch, stop.

Cap: 1 slice per run.
Branch: cursor/atu-merlin-estate-discovery. Never commit to master. Never edit ATU_SRC/**.
House style: never use pin / pinned / landed.
Non-goals: no Phase A, no conversion, no test-gen/RECORD/goldens. CHARACTERIZATION deferred-waived.

When finished: set line 1 of overnight/AGENT_JOB.md to DONE, commit, push, open/update PR to master.
