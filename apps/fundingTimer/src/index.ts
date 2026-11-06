import "dotenv/config";
import { makeRedisClient } from "@cex/redis";
import { FUNDING_RATE_STREAM } from "@cex/shared";

const INTERVAL_MS =
  Number(process.env.FUNDING_INTERVAL_MS) || 8 * 60 * 60 * 1000;
const MARKETS = (process.env.MARKETS || "BTC_USD")
  .split(",")
  .map((m) => m.trim())
  .filter(Boolean);
const STREAM_MAXLEN = 10_000;
const LOCK_TTL_SEC = Math.ceil(INTERVAL_MS / 1000);

const redis = makeRedisClient("funding-timer");

let timer: NodeJS.Timeout | null = null;
let stopping = false;

async function emitFundingTriggers(windowStart: number): Promise<void> {
  for (const market of MARKETS) {
    try {
      // only one instance wins the lock per market per window
      const lockKey = `funding:lock:${market}:${windowStart}`;
      const locked = await redis.set(lockKey, "1", "EX", LOCK_TTL_SEC, "NX");
      if (locked !== "OK") {
        console.log(`[funding-timer] ${market} already emitted for ${windowStart}`);
        continue;
      }

      await redis.xadd(
        FUNDING_RATE_STREAM,
        "MAXLEN",
        "~",
        STREAM_MAXLEN,
        "*",
        "type", "funding_trigger",
        "market", market,
        "windowStart", windowStart.toString(),
        "timestamp", Date.now().toString(),
      );
      console.log(`[funding-timer] emitted trigger for ${market} @ ${windowStart}`);
    } catch (err) {
      console.error(`[funding-timer] failed for ${market}:`, err);
    }
  }
}

function scheduleNext(): void {
  if (stopping) return;

  const now = Date.now();
  const nextBoundary = (Math.floor(now / INTERVAL_MS) + 1) * INTERVAL_MS;
  const delay = nextBoundary - now;

  timer = setTimeout(async () => {
    await emitFundingTriggers(nextBoundary);
    scheduleNext();
  }, delay);

  console.log(
    `[funding-timer] next trigger at ${new Date(nextBoundary).toISOString()}`,
  );
}

async function shutdown(signal: string): Promise<void> {
  if (stopping) return;
  stopping = true;
  console.log(`[funding-timer] ${signal} received, shutting down`);
  if (timer) clearTimeout(timer);
  await redis.quit().catch(() => {});
  process.exit(0);
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));

console.log(
  `[funding-timer] started — interval=${INTERVAL_MS}ms markets=${MARKETS.join(",")}`,
);
scheduleNext();