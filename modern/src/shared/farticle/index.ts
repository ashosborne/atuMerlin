import type { Db } from "../../db/pool.js";

/**
 * FARTICLE dependency surface used by the ORD vertical (ART300 GetArtDesc / GetArtRefSalPrice /
 * GetArtVatCode, ART301 SltArticle list). ART is stay_legacy in pack atu-merlin-ts-ord-v1@1:
 * this is read-only access to the ARTICLE reference table the ORD cards depend on
 * (ord-entry-ord100-c03, ord-entry-ord101-c01/c03, ord-maintain-ord202-c02, ord-print-ord500-c01).
 *
 * Miss rule: ART300.chainARTICLE1 does `clear *all FARTI` before the chain, so every getter
 * returns blanks / zeros for an unknown id. ORD202 and ORD500 chained ARTICLE1 directly and
 * repeated the previous line's description on a miss (ord-maintain-ord202-c06); the modern ORD
 * vertical uses this single FARTICLE rule everywhere (CONTRACT_RISK, see README).
 * Not reproduced: the last-key cache (stateless server, one read per call).
 */
export interface Article {
  arid: string;
  ardesc: string;
  arsalepr: number;
  arvatcd: string;
  ardel: string;
}

export interface FArticle {
  /** GetArtDesc: ARDESC (50), blank on miss. */
  getArtDesc(arid: string): Promise<string>;
  /** GetArtRefSalPrice: ARSALEPR (7P 2), 0 on miss. */
  getArtRefSalPrice(arid: string): Promise<number>;
  /** GetArtVatCode: ARVATCD (1A), blank on miss. */
  getArtVatCode(arid: string): Promise<string>;
  /** One read for the three getters ORD100/ORD101 call together; null on miss. */
  chain(arid: string): Promise<Article | null>;
  /** Rows behind ART301.SltArticle, ordered by id. Soft-deleted rows are listed (as-is, c14). */
  listArticles(): Promise<Article[]>;
}

const COLUMNS = "arid, ardesc, arsalepr, arvatcd, ardel";

export function createFArticle(db: Db): FArticle {
  async function chain(arid: string): Promise<Article | null> {
    const r = await db.query<Article>(`SELECT ${COLUMNS} FROM article WHERE arid = $1`, [arid]);
    return r.rows[0] ?? null;
  }
  return {
    chain,
    async getArtDesc(arid) {
      return (await chain(arid))?.ardesc ?? "";
    },
    async getArtRefSalPrice(arid) {
      return (await chain(arid))?.arsalepr ?? 0;
    },
    async getArtVatCode(arid) {
      return (await chain(arid))?.arvatcd ?? "";
    },
    async listArticles() {
      const r = await db.query<Article>(`SELECT ${COLUMNS} FROM article ORDER BY arid`);
      return r.rows;
    },
  };
}
