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
