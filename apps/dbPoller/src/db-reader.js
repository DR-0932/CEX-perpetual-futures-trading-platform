import pg from "pg";
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
pool.on("error", (e) => console.error("[poller] pg pool error:", e.message));
export async function readLatestSnapshot(market) {
    const result = await pool.query(`SELECT bids, asks FROM "OrderbookSnapshot" WHERE market = $1 ORDER BY "createdAt" DESC LIMIT 1`, [market]);
    const row = result.rows[0];
    if (!row)
        return null;
    return { bids: row.bids, asks: row.asks };
}
