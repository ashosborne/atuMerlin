# Cloud Agent trigger contract (atuMerlin)

Branch: `cursor/atu-merlin-estate-discovery`
Repo: `ashosborne/atuMerlin`
Never edit `ATU_SRC/**`. Never push `master` directly. Open/update PR to `master`.

## Fixed automation prompt (paste once into FE Cursor Automations)

```text
On branch cursor/atu-merlin-estate-discovery for ashosborne/atuMerlin:

1. If overnight/stop.txt exists: stop cleanly. Do not start a pack.
2. If overnight/RUN_PACK_A exists and line 1 is not DONE:
   - Read and run operator/atu-merlin-factory-loop/PASTE-estate-discovery-atu-merlin.md
   - Phase A candidates only: no bind, no Phase B, no convert
   - Never edit ATU_SRC/**
   - Write overnight/MORNING_BRIEF.md and other pack outputs
   - Open or update PR to master
   - When finished, rewrite overnight/RUN_PACK_A so line 1 is exactly: DONE
3. Else if overnight/RUN_PACK_B exists and line 1 is not DONE:
   - Read and run operator/atu-merlin-factory-loop/PASTE-document-slices-conveyor-atu-merlin.md
   - Phase B behaviour cards for human-accepted slices only
   - No goldens, no tests, no convert, never edit ATU_SRC/**
   - Open or update PR to master
   - When finished, rewrite overnight/RUN_PACK_B so line 1 is exactly: DONE
4. Else: no-op. Exit without claiming work.
```

## File formats

### `overnight/RUN_PACK_A` (radar)

```text
RUN
reason: <one line>
requested_by: <agent or Ash>
requested_at: <ISO-8601 Europe/London or UTC labelled>
```

After a successful Pack A run, agent sets:

```text
DONE
finished_at: <ISO-8601>
morning_brief: overnight/MORNING_BRIEF.md
```

### `overnight/RUN_PACK_B` (document / Phase B)

Same shape. Only fire after human bind. Pack B must refuse if no accepted undocumenteds.

### `overnight/stop.txt`

Any content. Presence aborts before pack start. Remove to allow runs again.

## Who does what

| Step | Owner |
| --- | --- |
| One-time Cursor Automation on `ash.osborne@cursor.sh` | Ash (FE account) |
| Flip `RUN_PACK_A` / `RUN_PACK_B` via `gh` | Agent Smith (this room) |
| File contract + paste prompts on branch | Migration Engineer |
| Bind list from MORNING_BRIEF | CTO + Migration Engineer |
| Honesty red-pen | Field Engineer |

## Anti-loop

Automation must treat line 1 `DONE` as idle. Do not re-run until someone rewrites line 1 to `RUN`. Delete the file or leave `DONE` after review.