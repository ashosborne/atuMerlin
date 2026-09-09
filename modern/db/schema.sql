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
