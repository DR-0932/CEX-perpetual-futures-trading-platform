import { redis } from "@cex/redis";
export const WAL_STREAM = "wal_stream";
const WAL_MAXLEN = 10_000_000;
export async function appendWal(entry) {
    const id = await redis.xadd(WAL_STREAM, "MAXLEN", "~", String(WAL_MAXLEN), "*", "payload", JSON.stringify(entry));
    return id;
}
