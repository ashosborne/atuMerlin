## Slice inputs (operator-scoped) — iter 21 (residual run)

SLICE_ID: dat-utils
SLICE_SEED: Date UDFs — SQL functions ISO_Num_To_Date (SPECIFIC ISOTODATE → DAT001) and ISOTODATE40 (SPECIFIC ISOTODATE4 → DAT002) that turn the estate's 8-digit numeric ISO dates into SQL DATEs; ISOTODATE40 maps the sentinel 0 → 1940-01-01 and is used by ORD200 / ORD201 via the ORDERCUS cursor
SEED_ENTRYPOINTS:
  - ATU_SRC/QSQLSRC/ISOTODATE.SQLUDF        (CREATE FUNCTION ISO_Num_To_Date … EXTERNAL NAME DAT001)
  - ATU_SRC/QSQLSRC/ISOTODATE4.SQLUDF       (CREATE FUNCTION ISOTODATE40 … EXTERNAL NAME DAT002)
  - ATU_SRC/QRPGLESRC/DAT001.PGM.RPGLE      (*PGM, PARAMETER STYLE SQL)
  - ATU_SRC/QRPGLESRC/DAT002.PGM.RPGLE      (*PGM, PARAMETER STYLE SQL, special values)
DEPS (not slice members):
  - Callers: ORD200 (ord-maintain-ord200-c01), ORD201 (ord-maintain-ord201-c01) — ISOTODATE40 only
  - The same 0 → 1940-01-01 sentinel is applied in RPG by CUS200 (cus-interactive-c07, documented) and ORD202 (ord-maintain-ord202-c01)
OUT_OF_SCOPE_HINTS:
  - Views / sequences / procedures (sql-objects)
  - The screens that call the UDFs
  - Conversion / tests / bind

Attach: migration-factory/docs/FIELD-GUIDE.md
Prompt: migration-factory/prompts/discovery-agent-v0.2.md
Schema: migration-factory/schemas/discovery-manifest.schema.md
Mode: Phase A map only — STOP for human bind

Size check: 2 PGM (~130 lines) + 2 UDF definitions. Very thin; pure functions — the most characterizable seam in the estate.
