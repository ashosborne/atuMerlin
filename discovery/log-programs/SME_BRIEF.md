# SME_BRIEF — log-programs (Phase A, awaiting human bind)

## What was found

A 73-line application log: `LOG100` creates a **5000-byte user space** `SAMLOG` (one-off, no menu entry, no caller), `LOG300.AddLogEntry` appends `User / Date / Msg` lines to it, and menu opt 84 displays it with a command that is not in the tree. The only in-tree writer is `ORD700` on order-line delete (already documented as `ord-trigger-ord700-c03`). 10 candidates: 6 `observed-in-code`, 4 `inferred` (capacity, install step, reader, concurrency — all runtime properties).

The capacity finding (c04) is the one that matters operationally: with no auto-extend and a 600-byte write per entry, **the log silently stops accepting entries after roughly 4400 bytes**, and because `ORD700` swallows the error nobody is told.

## Ambiguous boundaries

| Question | Recommendation |
| --- | --- |
| Is the log behaviour to preserve? | Recommend **no** — replace with structured logging in the target; keep only the line content (`ORD700:Order Line deleted <id> <line> article : <arid> quantity : <qty>`) if operators rely on it. |
| `LOG100` | Install step, not application behaviour. `reject` as a slice member; move to the ops runbook. |
| Binding of `LOG` into `ORD700` (c08) | Build-owner question already raised by Pack B run 4. Not new. |
| `ADSPUSRSPC` (c09) | Blind spot; the command is outside the allowlist. |

## Recommended bind (recommendation only)

- **accept (as a target-logging requirement, not byte-for-byte):** c03
- **needs-SME:** c04 (confirm failure mode), c06 (who runs `LOG100`), c08 (build owner)
- **reject / fold:** c01, c02, c05, c07, c09, c10

## Open questions

1. Has the log ever filled up on the box (c04)? What did the operators see?
2. Is `SAMLOG` content read by anyone (c09)?
3. Confirm this slice can be `deferred` as a whole in favour of target-side logging.

Did not: bind, deepen Phase B, generate tests, or convert.
