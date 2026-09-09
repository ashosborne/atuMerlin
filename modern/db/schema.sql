-- atuMerlin CUS vertical — Postgres schema (pack atu-merlin-ts-cus-v1@1, data.strategy postgres-greenfield-from-pf)
-- Mapping rules applied: PF -> postgres table, LF -> index/query. Idempotent.

-- CUSSEQ.SQLSEQ: START WITH 1551 INCREMENT BY 1 NO MAXVALUE NO CYCLE (cus-interactive-c02)
CREATE SEQUENCE IF NOT EXISTS cusseq
  AS integer
  START WITH 1551
  INCREMENT BY 1
  NO MAXVALUE
  NO CYCLE;

-- CUSTOMER.PF record format FCUST, field references via SAMREF.PF.
-- Legacy fields are fixed-length CHAR; values are stored right-trimmed here and
-- lengths are enforced so an over-long value cannot enter the table.
CREATE TABLE IF NOT EXISTS customer (
  cuid      integer       PRIMARY KEY CHECK (cuid >= 0 AND cuid <= 99999),  -- CUID 5P 0
  custnm    varchar(30)   NOT NULL DEFAULT '',   -- CUSTNM 30A
  cuphone   varchar(15)   NOT NULL DEFAULT '',   -- CUPHONE (PHONE 15A)
  cuvat     varchar(12)   NOT NULL DEFAULT '',   -- CUVAT (VATNUM 12A)
  cumail    varchar(50)   NOT NULL DEFAULT '',   -- CUMAIL (EMAIL 50A)
  culine1   varchar(50)   NOT NULL DEFAULT '',   -- CULINE1 (ADRLINE 50A)
  culine2   varchar(50)   NOT NULL DEFAULT '',
  culine3   varchar(50)   NOT NULL DEFAULT '',
  cuzip     varchar(10)   NOT NULL DEFAULT '',   -- CUZIP (ZIPCOD 10A)
  cucity    varchar(30)   NOT NULL DEFAULT '',   -- CUCITY (CITY 30A)
  cucoun    varchar(2)    NOT NULL DEFAULT '',   -- CUCOUN (COID 2A)
  culimcre  numeric(9,2)  NOT NULL DEFAULT 0,    -- CULIMCRE 9 2
  cucredit  numeric(9,2)  NOT NULL DEFAULT 0,    -- CUCREDIT 9 2 (never written by CUS)
  culastord integer       NOT NULL DEFAULT 0     -- CULASTORD 8 0, yyyymmdd, 0 = never ordered (c07)
            CHECK (culastord >= 0 AND culastord <= 99999999),
  cucrea    date          NOT NULL,              -- CUCREA L
  cumod     timestamp     NOT NULL,              -- CUMOD Z
  cumodid   varchar(10)   NOT NULL DEFAULT '',   -- CUMODID 10A
  cudel     char(1)       NOT NULL DEFAULT ' '   -- CUDEL (DLCODE 1A) 'X' = deleted; no writer in CUS (c11)
);

-- CUSTOME1.LF: UNIQUE key CUID -> covered by the primary key above.
-- CUSTOME2.LF: keys CUSTNM, CUID -> byte-order index used by the work-with list (c01).
CREATE INDEX IF NOT EXISTS custome2 ON customer (custnm COLLATE "C", cuid);

-- COUNTRY.PF: dependency only (FCOUNTRY.ExistCountry / GetCountryName / SltCountry are
-- consumed by c04, c05, c10). Not a converted slice; no maintenance path here.
CREATE TABLE IF NOT EXISTS country (
  coid    varchar(2)   PRIMARY KEY,             -- COID 2A
  countr  varchar(30)  NOT NULL DEFAULT '',     -- COUNTR 30A
  coiso   varchar(3)   NOT NULL DEFAULT ''      -- COISO 3A
);

-- ============================================================================================
-- atuMerlin ORD vertical — additive ORD objects (pack atu-merlin-ts-ord-v1@1, data.strategy
-- postgres-greenfield-from-pf). Nothing above this line is touched by the ORD pack (forbidden:
-- reshape CUS schema). Idempotent.
--
-- Date lock (pack mapping rule): IBM i blank/never dates (0 / 1940-01-01) are stored as NULL;
-- the sentinel only appears at the boundary. CUSTOMER.CULASTORD keeps the CUS pack's
-- yyyymmdd integer shape, so the ORD701 trigger converts at that boundary.
-- ============================================================================================

-- LASTORDNO.DTAARA: TYPE(*DEC) LEN(6 0) VALUE(60719) holds the LAST number used; ORD100 does
-- IN *LOCK / +1 / OUT (ord-entry-ord100-c07), so the first modern order is 60720. ORID is 6P 0.
CREATE SEQUENCE IF NOT EXISTS lastordno
  AS integer
  START WITH 60720
  INCREMENT BY 1
  MAXVALUE 999999
  NO CYCLE;

-- ORDER.PF record format FORDE. "order" is a reserved word (the legacy view quotes "ORDER" too),
-- so the table is named orders. No FK to customer: ORD100 accepts any non-zero id without an
-- ExistCus check (ord-entry-ord100-c01 / c14); orphans exist and stay hidden by ORDERCUS.
CREATE TABLE IF NOT EXISTS orders (
  orid      integer   PRIMARY KEY CHECK (orid >= 0 AND orid <= 999999),   -- ORID 6P 0
  oryear    smallint  NOT NULL DEFAULT 0 CHECK (oryear >= 0 AND oryear <= 9999), -- ORYEAR (YEAR 4P 0)
  orcuid    integer   NOT NULL CHECK (orcuid >= 0 AND orcuid <= 99999),    -- ORCUID (CUID 5P 0)
  ordate    date      NOT NULL,          -- ORDATE 8 0 yyyymmdd; ORD100 always writes today
  ordatdel  date,                        -- ORDATDEL 8 0; NULL = never delivered (legacy 0)
  ordatclo  date                         -- ORDATCLO 8 0; NULL = never closed (legacy 0)
);

-- ORDER1.LF UNIQUE K ORID -> primary key. ORDER2.LF (ORCUID, ORID), ORDER3.LF (ORDATE, ORID).
CREATE INDEX IF NOT EXISTS order2 ON orders (orcuid, orid);
CREATE INDEX IF NOT EXISTS order3 ON orders (ordate, orid);

-- DETORD.PF record format FDETO. DETORD1.LF is UNIQUE (ODORID, ODLINE) -> primary key; the PF
-- key (ODLINE, ODORID, ODYEAR) becomes a plain index. No FK to orders: legacy has none and
-- ORD200's header-first delete can leave orphan lines (ord-maintain-ord200-c13).
CREATE TABLE IF NOT EXISTS detord (
  odorid    integer       NOT NULL CHECK (odorid >= 0 AND odorid <= 999999),  -- ODORID (ORID 6P 0)
  odyear    smallint      NOT NULL DEFAULT 0 CHECK (odyear >= 0 AND odyear <= 9999), -- ODYEAR; ORD100 writes 0 (c07)
  odline    integer       NOT NULL CHECK (odline >= 0 AND odline <= 99999),   -- ODLINE 5P 0
  odarid    varchar(6)    NOT NULL DEFAULT '',   -- ODARID (ARID 6A)
  odqty     integer       NOT NULL DEFAULT 0 CHECK (odqty > -100000 AND odqty < 100000),      -- QUANTITY 5 0 signed
  odqtyliv  integer       NOT NULL DEFAULT 0 CHECK (odqtyliv > -100000 AND odqtyliv < 100000),
  odprice   numeric(7,2)  NOT NULL DEFAULT 0,    -- ODPRICE (UNITPRICE 7P 2)
  odtot     numeric(9,2)  NOT NULL DEFAULT 0,    -- ODTOT (TOTPRICE 9P 2)
  odtotvat  numeric(9,2)  NOT NULL DEFAULT 0,    -- ODTOTVAT 9P 2 "TOTAL LINE WITH VAT"
  PRIMARY KEY (odorid, odline)
);
CREATE INDEX IF NOT EXISTS detord_pf ON detord (odline, odorid, odyear);

-- ARTICLE.PF: dependency table only (FARTICLE GetArtDesc / GetArtRefSalPrice / GetArtVatCode /
-- SltArticle are consumed by ORD100, ORD101, ORD202, ORD500; ORD700 maintains ARCUSQTY).
-- ART is stay_legacy in this pack: no article maintenance path exists here.
CREATE TABLE IF NOT EXISTS article (
  arid      varchar(6)    PRIMARY KEY,                    -- ARID 6A
  ardesc    varchar(50)   NOT NULL DEFAULT '',            -- ARDESC 50A
  arsalepr  numeric(7,2)  NOT NULL DEFAULT 0,             -- ARSALEPR (UNITPRICE 7P 2) "REF SALE PRICE"
  arwhspr   numeric(7,2)  NOT NULL DEFAULT 0,             -- ARWHSPR
  artifa    varchar(3)    NOT NULL DEFAULT '',            -- ARTIFA (FAID 3A)
  arstock   integer       NOT NULL DEFAULT 0,             -- ARSTOCK (QUANTITY 5 0)
  arminqty  integer       NOT NULL DEFAULT 0,             -- ARMINQTY
  arcusqty  integer       NOT NULL DEFAULT 0              -- ARCUSQTY "CUSTOMER ORDER QTY", ORD700-maintained
            CHECK (arcusqty > -100000 AND arcusqty < 100000),
  arpurqty  integer       NOT NULL DEFAULT 0,             -- ARPURQTY
  arvatcd   char(1)       NOT NULL DEFAULT '2',           -- ARVATCD (VATCODE 1A, DFT('2'))
  arcrea    date,                                          -- ARCREA L
  armod     timestamp,                                     -- ARMOD Z (never stamped by ORD700, c05)
  armodid   varchar(10)   NOT NULL DEFAULT '',            -- ARMODID 10A
  ardel     char(1)       NOT NULL DEFAULT ' '            -- ARDEL (DLCODE 1A); never tested by ORD
);

-- VATDEF.PF: dependency table only (FVAT GetVATRate / CLCVat). vat-module is not converted here.
CREATE TABLE IF NOT EXISTS vatdef (
  vatcode   char(1)       PRIMARY KEY,                    -- VATCODE 1A
  vatrate   numeric(4,2)  NOT NULL DEFAULT 0,             -- VATRATE 4 2 "VAT RATE %"
  vatdesc   varchar(20)   NOT NULL DEFAULT '',            -- VATDESC 20A
  vatcrea   date,
  vatmod    timestamp,
  vatmodid  varchar(10)   NOT NULL DEFAULT '',
  vatdel    char(1)       NOT NULL DEFAULT ' '
);

-- SAMLOG user space (LOG300 AddLogEntry): the only in-tree reader is menu option 84. Entries
-- are appended, never wrapped or trimmed (ord-trigger-ord700-c03).
CREATE TABLE IF NOT EXISTS samlog (
  id         bigserial     PRIMARY KEY,
  logged_at  timestamp     NOT NULL DEFAULT LOCALTIMESTAMP,
  user_id    varchar(10)   NOT NULL DEFAULT '',
  msg        text          NOT NULL
);

-- ORDERCUS.VIEW as-is: inner join "ORDER" x CUSTOMER on ORCUID = CUID (planted defect kept: an
-- order whose customer row is missing is not listed anywhere), TOTVAL = COALESCE(SUM(ODTOTVAT), 0).
CREATE OR REPLACE VIEW ordercus AS
  SELECT h.orid, h.orcuid, c.custnm, h.oryear, h.ordate, h.ordatdel, h.ordatclo,
         COALESCE((SELECT SUM(d.odtotvat) FROM detord d WHERE d.odorid = h.orid), 0)::numeric(11,2) AS totval
    FROM orders h, customer c
   WHERE h.orcuid = c.cuid;

-- --------------------------------------------------------------------------------------------
-- ORD700 / ORD701 side effects. Pack mapping rule left the shape open (application-level vs
-- Postgres trigger); the ORD convert chose Postgres triggers so that every writer of detord /
-- orders (including ad-hoc SQL, as on IBM i) produces the same side effects. The as-is
-- arithmetic is kept exactly, asymmetries included — see modern/README.md, ORD section.
-- --------------------------------------------------------------------------------------------

-- ORD700.UpdArt (ord-trigger-ord700-c05): zero delta -> no-op; unknown article -> silent no-op;
-- ARMOD / ARMODID are not stamped; sign and bounds are not checked (the CHECK on arcusqty is
-- the modern stand-in for the 5 0 size exception).
CREATE OR REPLACE FUNCTION ord700_updart(p_qty integer, p_arid varchar) RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  IF p_qty = 0 THEN
    RETURN;
  END IF;
  UPDATE article SET arcusqty = arcusqty + p_qty WHERE arid = p_arid;
END;
$$;

-- Who is writing, for the SAMLOG "User:" column (legacy *USER). The repository sets
-- atu.user per transaction; falls back to the database role when unset.
CREATE OR REPLACE FUNCTION ord700_user() RETURNS varchar
LANGUAGE sql STABLE AS $$
  SELECT LEFT(COALESCE(NULLIF(current_setting('atu.user', true), ''), current_user), 10)
$$;

-- ORD700 event '1' (ord-trigger-ord700-c02): the FULL ordered quantity is added; new.ODQTYLIV
-- is ignored on insert (as-is asymmetry with delete/update).
CREATE OR REPLACE FUNCTION ord700_detord_insert() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  PERFORM ord700_updart(NEW.odqty, NEW.odarid);
  RETURN NULL;
END;
$$;

-- ORD700 event '2' (ord-trigger-ord700-c03): log first (message carries ODQTY, not the
-- outstanding quantity; ODARID untrimmed as-is), then subtract the outstanding quantity.
CREATE OR REPLACE FUNCTION ord700_detord_delete() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO samlog (user_id, msg)
  VALUES (ord700_user(),
          'ORD700:Order Line deleted ' || OLD.odorid || ' ' || OLD.odline
          || ' article : ' || RPAD(OLD.odarid, 6) || ' quantity : ' || OLD.odqty);
  PERFORM ord700_updart(-OLD.odqty + OLD.odqtyliv, OLD.odarid);
  RETURN NULL;
END;
$$;

-- ORD700 event '3' (ord-trigger-ord700-c04). TRGUPDCND(*CHANGE) is the WHEN clause below.
CREATE OR REPLACE FUNCTION ord700_detord_update() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.odarid = OLD.odarid THEN
    PERFORM ord700_updart((NEW.odqty - OLD.odqty) - (NEW.odqtyliv - OLD.odqtyliv), NEW.odarid);
  ELSE
    PERFORM ord700_updart(NEW.odqty - NEW.odqtyliv, NEW.odarid);
    PERFORM ord700_updart(-OLD.odqty + OLD.odqtyliv, OLD.odarid);
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS ord700_detord_article_insert ON detord;
CREATE TRIGGER ord700_detord_article_insert
  AFTER INSERT ON detord FOR EACH ROW EXECUTE FUNCTION ord700_detord_insert();

DROP TRIGGER IF EXISTS ord700_detord_article_delete ON detord;
CREATE TRIGGER ord700_detord_article_delete
  AFTER DELETE ON detord FOR EACH ROW EXECUTE FUNCTION ord700_detord_delete();

DROP TRIGGER IF EXISTS ord700_detord_article_update ON detord;
CREATE TRIGGER ord700_detord_article_update
  AFTER UPDATE ON detord FOR EACH ROW
  WHEN (OLD.* IS DISTINCT FROM NEW.*)
  EXECUTE FUNCTION ord700_detord_update();

-- ORD701_Insert_order (ord-trigger-ord700-c07): unconditional assignment (no MAX), no
-- existence / CUDEL check, CUMOD / CUMODID untouched. Insert only — no update/delete twin
-- exists in the legacy tree (c08, needs-SME). Boundary: CULASTORD stays yyyymmdd integer.
CREATE OR REPLACE FUNCTION ord701_insert_order() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  UPDATE customer SET culastord = to_char(NEW.ordate, 'YYYYMMDD')::integer WHERE cuid = NEW.orcuid;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS ord701_insert_order ON orders;
CREATE TRIGGER ord701_insert_order
  AFTER INSERT ON orders FOR EACH ROW EXECUTE FUNCTION ord701_insert_order();

-- ============================================================================================
-- atuMerlin VAT vertical — additive VAT objects (pack atu-merlin-ts-vat-v1@1, data.strategy
-- postgres-greenfield-from-pf, schema_changes additive-only). Nothing above this line is touched
-- by the VAT pack (forbidden: reshape CUS or ORD schema). Idempotent.
--
-- VATDEF.PF (record format FVAT, REF(SAMREF), K VATCODE) is already mapped column-for-column by
-- the `vatdef` table in the ORD section, where it was a read-only dependency. The VAT convert
-- takes over the semantics of that table without altering it: VATCODE 1A -> char(1) PK (the PF
-- key; no logical file over VATDEF exists in ATU_SRC, so no further index), VATRATE 4 2 ->
-- numeric(4,2), VATDESC 20 -> varchar(20), VATCREA L -> date, VATMOD Z -> timestamp,
-- VATMODID 10 -> varchar(10), VATDEL (DLCODE 1A) -> char(1). Audit and delete columns have no
-- writer in the legacy tree (vat-module-c07) and none here.
-- ============================================================================================

COMMENT ON TABLE vatdef IS
  'VATDEF.PF — VAT code and rate. Read by shared FVAT (GetVATRate, GetVATDesc, ClcVAT, ExistVATRate); no maintenance path (vat-module-c07, needs-SME).';
COMMENT ON COLUMN vatdef.vatrate IS 'VATRATE 4P 2 "VAT RATE %"; 0 after a miss is indistinguishable from a zero rate (vat-module-c02).';
COMMENT ON COLUMN vatdef.vatdel IS 'DLCODE: ''X'' = soft-deleted. Only ExistVATRate reads it; ClcVAT still applies the rate (vat-module-c04).';

-- ============================================================================================
-- atuMerlin DAT utilities — additive DAT objects (pack atu-merlin-ts-dat-v1@1, data.strategy
-- postgres-greenfield-from-pf, schema_changes additive-only). Nothing above this line is touched
-- by the DAT pack (forbidden: reshape CUS or ORD schema). Idempotent. No table: DAT001 / DAT002
-- read no file (dat-utils-c06).
--
-- The legacy surface is two SQL scalar functions (ISO_Num_To_Date -> DAT001, ISOTODATE40 ->
-- DAT002, dat-utils-c04). Their TypeScript twins live in modern/src/shared/dat. In the database
-- only the *date lock* is defined — the one rule the ORD pack already applies inline in ORD701
-- (`to_char(ordate, 'YYYYMMDD')::integer`) and the CUS pack applies in TypeScript for CULASTORD:
-- an `8 0` yyyymmdd crossing the boundary becomes a date or NULL (0 = never, invalid = NULL);
-- a date leaving becomes yyyymmdd or 0. The 1940-01-01 / 2039-12-31 presentation sentinels of
-- DAT002 (dat-utils-c01, c07) are deliberately NOT given a SQL function: they must never be
-- stored, and no modern SQL consumer needs them. ISO_Num_To_Date's only possible callers are
-- QM queries with no source in the tree (c02 / c03, needs-SME) — nothing is created for them.
-- ============================================================================================

-- Boundary in: `8 0` yyyymmdd -> date. 0 -> NULL (never); an invalid number -> NULL (the CUS
-- pack's CR-6 stance; the RPG paths raised an exception). STRICT = RETURNS NULL ON NULL INPUT,
-- IMMUTABLE = DETERMINISTIC NO SQL (dat-utils-c04). Same values as ISO_Num_To_Date / DAT001.
CREATE OR REPLACE FUNCTION dat_iso_num_to_date(dat8 integer) RETURNS date
LANGUAGE plpgsql IMMUTABLE STRICT AS $$
BEGIN
  IF dat8 <= 0 THEN
    RETURN NULL;
  END IF;
  -- make_date validates year 1..9999, month and day-of-month (incl. leap years); no leniency.
  RETURN make_date(dat8 / 10000, (dat8 / 100) % 100, dat8 % 100);
EXCEPTION
  WHEN datetime_field_overflow OR invalid_datetime_format THEN
    RETURN NULL;
END;
$$;

COMMENT ON FUNCTION dat_iso_num_to_date(integer) IS
  'DAT date lock, boundary in: legacy 8 0 yyyymmdd -> date; 0 or invalid -> NULL (dat-utils-c02 semantics, pack atu-merlin-ts-dat-v1@1).';

-- Boundary out: date -> `8 0` yyyymmdd, NULL -> 0 (the storage convention of ORDATDEL / ORDATCLO /
-- CULASTORD, dat-utils-c07). Not STRICT on purpose: NULL must yield 0.
CREATE OR REPLACE FUNCTION dat_date_to_iso_num(d date) RETURNS integer
LANGUAGE sql IMMUTABLE AS $$
  SELECT COALESCE(to_char(d, 'YYYYMMDD')::integer, 0)
$$;

COMMENT ON FUNCTION dat_date_to_iso_num(date) IS
  'DAT date lock, boundary out: date -> legacy 8 0 yyyymmdd; NULL -> 0 (dat-utils-c07, pack atu-merlin-ts-dat-v1@1).';

-- ============================================================================================
-- atuMerlin COU vertical, FCOUNTRY half — additive COU objects (pack atu-merlin-ts-cou-v1@1,
-- data.strategy postgres-greenfield-from-pf, schema_changes additive-only). Nothing above this
-- line is touched by the COU pack (forbidden: reshape CUS or ORD schema). Idempotent.
--
-- COUNTRY.PF (record format FCOUN, REF(SAMREF), UNIQUE K COID) is already mapped column-for-column
-- by the `country` table in the CUS section, where it was a read-only dependency. The COU convert
-- takes over the semantics of that table without altering it: COID 2A -> varchar(2) PK (the PF
-- key), COUNTR 30A -> varchar(30), COISO 3A -> varchar(3). COUNTRY has no create / modify / delete
-- columns (cou-maintain-c07): "exists" means "row present".
--
-- COUNTR1.LF (K COUNTR, not UNIQUE) is the by-name order of the SltCountry window (c09, c10). The
-- index below is the LF -> index mapping rule; byte order (COLLATE "C") stands in for the keyed
-- order and the code is the tie-breaker for equal names (the LF listed them in arrival order).
-- COU200 (the deferred panel half, the only writer of COUNTRY) is not mapped: no maintenance path.
-- ============================================================================================

CREATE INDEX IF NOT EXISTS countr1 ON country (countr COLLATE "C", coid COLLATE "C");

COMMENT ON TABLE country IS
  'COUNTRY.PF — country code, name, ISO-3. Read by shared FCOUNTRY (ExistCountry, GetCountryName, GetCountryIso3, SltCountry); written only by the deferred COU200 panel (cou-maintain-c13), no maintenance path here.';
COMMENT ON COLUMN country.coiso IS 'COISO 3A literal (not SAMREF); read by GetCountryIso3, which has no caller in the estate (cou-maintain-c08, needs-SME).';
COMMENT ON INDEX countr1 IS 'COUNTR1.LF — by-name order of COU301 SltCountry (cou-maintain-c09); not unique, code tie-breaks equal names.';

-- ============================================================================================
-- atuMerlin PAR vertical — additive PAR objects (pack atu-merlin-ts-par-v1@1, data.strategy
-- postgres-greenfield-from-pf, schema_changes additive-only). Nothing above this line is touched
-- by the PAR pack (forbidden: reshape CUS or ORD schema). Idempotent.
--
-- PARAMETER.PF (record format FPARAM, UNIQUE K PACODE + K PASUBCODE, par-maintain-c12): a plain
-- two-key key/value table. PACODE 10A / PASUBCODE 10A -> the composite primary key (the PF UNIQUE);
-- PARM1 10A, PARM2 100A, PARM3 2A -> varchar; PARM4 zoned 1 0 and PARM5 zoned 3 0 -> smallint with
-- the DDS width as a CHECK (the getters returned them packed; no value change). No delete flag
-- (deletes are physical, c05), no audit columns, no TEXT, no logical file, no trigger, no SQL
-- consumer in the legacy tree — none is added. A blank/blank key is legal (one row, c02) and is
-- never read by the getters (c09). No PATH row is seeded: its presence is installation data (c08)
-- and PAR200 (features/par) is the only writer, as on the box.
--
-- Mapping choice recorded at Convert (pack mapping rule "PF PARM / PATH -> postgres table or
-- config surface; choose at convert"): the PF is mapped to a table so that the accepted cards
-- (c01-c06 maintain, c09 getters, c11 PATH reader) hold as-is. Whether PATH becomes target
-- configuration instead (c11, room) is NOT decided here; see modern/README.md, PAR section.
-- ============================================================================================

CREATE TABLE IF NOT EXISTS parameter (
  pacode    varchar(10)   NOT NULL,              -- PACODE 10A "Parameter code"
  pasubcode varchar(10)   NOT NULL,              -- PASUBCODE 10A "Parameter sub-Code"
  parm1     varchar(10)   NOT NULL DEFAULT '',   -- PARM1 10A (GetPARM1: no caller, c11)
  parm2     varchar(100)  NOT NULL DEFAULT '',   -- PARM2 100A, CHECK(LC) on PAR200 (PATH lives here, c11)
  parm3     varchar(2)    NOT NULL DEFAULT '',   -- PARM3 2A (GetPARM3: no caller)
  parm4     smallint      NOT NULL DEFAULT 0     -- PARM4 1S 0 (GetPARM4 -> 1P 0: no caller)
            CHECK (parm4 >= -9 AND parm4 <= 9),
  parm5     smallint      NOT NULL DEFAULT 0     -- PARM5 3S 0 (GetPARM5 -> 3P 0: no caller)
            CHECK (parm5 >= -999 AND parm5 <= 999),
  PRIMARY KEY (pacode, pasubcode)                -- UNIQUE K PACODE K PASUBCODE (c12)
);

COMMENT ON TABLE parameter IS
  'PARAMETER.PF — two-key key/value store. Written only by PAR200 (features/par); read by shared FPARAMETER (GetPARM1..5). The one live row is (PATH, blank) read by GetParm2 (par-maintain-c11); PATH-as-configuration is an open room decision.';
COMMENT ON COLUMN parameter.parm2 IS 'PARM2 100A, case kept (CHECK(LC)). For the PATH row: an IFS directory, expected to end with ''/'' by two of four legacy consumers (par-maintain-c07, known_risk).';
COMMENT ON COLUMN parameter.parm4 IS 'PARM4 zoned 1 0; the CHECK is the DDS width. Maintained by PAR200, read by nobody (par-maintain-c11).';
COMMENT ON COLUMN parameter.parm5 IS 'PARM5 zoned 3 0; the CHECK is the DDS width. Maintained by PAR200, read by nobody (par-maintain-c11).';

-- ============================================================================================
-- atuMerlin LOG vertical — samlog alignment (pack atu-merlin-ts-log-v1@1, data.strategy
-- postgres-greenfield-from-pf, schema_changes additive-only, mapping rule "PF / samlog -> reuse or
-- align with existing ORD samlog table"). Nothing above this line is touched by the LOG pack
-- (forbidden: reshape CUS or ORD schema). No new object: the SAMLOG user space is already the
-- `samlog` table of the ORD section, and the LOG pack REUSES it (modern/src/shared/samlog).
-- Idempotent.
--
-- What SAMLOG was (log-programs-c01, c02, c03): a 5000-byte *USRSPC created by LOG100 (a hand-run
-- install step, c06), with a 4-byte big-endian write cursor at offset 0, '***' at 4 and lines
-- 'User: <10> * Date: <26> * Msg: <trimmed entry> ***' appended from offset 7 by LOG300.AddLogEntry
-- (a 600-byte padded write per call). The cursor, the header, the fixed size (silent permanent
-- stop at ~35 ORD700 lines, c04), the swallowed create errors (c05), the never-retried init (c06)
-- and the unlocked shared cursor (c10) are properties of the user-space implementation with no
-- table counterpart — recorded in modern/README.md (LOG section), not reproduced.
--
-- What is reused: one row per line; `user_id` = the actor (per event, via ord700_user(); the legacy
-- `User` was stamped once per activation group, c03 — needs-SME); `logged_at` = the legacy in-line
-- Date; `msg` = %trim(entry). The legacy line STRING is reproducible from a row
-- (shared/samlog formatLegacyLine); whether that string is a contract is open (SME_BRIEF item 7).
-- Only comments are added; the ORD pack's CREATE TABLE stands as written.
-- ============================================================================================

COMMENT ON TABLE samlog IS
  'SAMLOG *USRSPC (LOG100 / LOG300.AddLogEntry) as a table. Written by the ORD700 delete trigger (ord-trigger-ord700-c03, the only in-tree log event, log-programs-c07) and by shared/samlog addLogEntry (pack atu-merlin-ts-log-v1). Unbounded: the legacy 5000-byte capacity and its silent stop (log-programs-c04) are not reproduced. No in-tree reader on the box (menu option 84 = ADSPUSRSPC, no source, log-programs-c09).';
COMMENT ON COLUMN samlog.user_id IS
  'Legacy User 10A inz(*USER), stamped once per activation group and written blank-padded (log-programs-c03). Here: the actor per event — ord700_user() (atu.user on the transaction, else the database role) or the user named by addLogEntry. Needs-SME: per-event actor confirmed as the target contract?';
COMMENT ON COLUMN samlog.logged_at IS
  'Legacy in-line Date = %char(%timestamp()) (26 chars, YYYY-MM-DD-HH.MM.SS.UUUUUU, log-programs-c03); shared/samlog toRpgTimestamp renders this column in that form.';
COMMENT ON COLUMN samlog.msg IS
  'Legacy %trim(entry) with entry 500A by value (log-programs-c03): shared/samlog normaliseLogEntry cuts to 500 then trims blanks. Stored in full; the legacy 500-byte line buffer (a message > 437 chars loses its '' ***'' terminator) is reproduced only by formatLegacyLine (CR-L3).';
