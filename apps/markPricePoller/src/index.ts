import "dotenv/config";
import WebSocket from "ws";
import { makeRedisClient } from "@cex/redis";
import { MARK_PRICE_STREAM } from "@cex/shared";

const WS_BASE = process.env.BINANCE_FUTURES_WS || "wss://fstream.binance.com/ws";
const PRICE_DECIMALS = 8;
const STREAM_MAXLEN = 1000;
const STALE_MS = 30_000;
const MAX_BACKOFF_MS = 30_000;

// binance symbol → internal market name
const MARKETS: Record<string, string> = {
  BTCUSDT: "BTC_USD",
  ETHUSDT: "ETH_USD",
};

const redis = makeRedisClient("mark-price-poller");
const sockets = new Map<string, WebSocket>();
let stopping = false;

function priceToScaledInt(priceStr: string, decimals: number): bigint | null {
  if (!/^\d+(\.\d+)?$/.test(priceStr)) return null;
  const [whole, frac = ""] = priceStr.split(".");
  const paddedFrac = frac.padEnd(decimals, "0").slice(0, decimals);
  return BigInt(whole + paddedFrac);
}

function connect(symbol: string, attempt = 0): void {
  if (stopping) return;

  const market = MARKETS[symbol]!;
  const ws = new WebSocket(`${WS_BASE}/${symbol.toLowerCase()}@markPrice@1s`);
  sockets.set(symbol, ws);

  let lastMessageAt = Date.now();
  let currentAttempt = attempt;

  // heartbeat: kill the socket if no data for STALE_MS
  const watchdog = setInterval(() => {
    if (Date.now() - lastMessageAt > STALE_MS) {
      console.warn(`[mark-price-poller] ${symbol} stale, terminating`);
      ws.terminate();
    }
  }, 10_000);

  ws.on("open", () => {
    currentAttempt = 0; // reset backoff
    lastMessageAt = Date.now();
    console.log(`[mark-price-poller] connected: ${symbol}`);
  });

  ws.on("message", (data) => {
    lastMessageAt = Date.now();
    void (async () => {
      try {
        const msg = JSON.parse(data.toString()) as {
          e?: string;
          E?: number;
          s?: string;
          p?: string;
        };
        if (msg.e !== "markPriceUpdate" || !msg.p) return;

        const price = priceToScaledInt(msg.p, PRICE_DECIMALS);
        if (price === null || price <= 0n) return;

        await redis.xadd(
          MARK_PRICE_STREAM,
          "MAXLEN", "~", STREAM_MAXLEN,
          "*",
          "market", market,
          "price", price.toString(),
          "timestamp", (msg.E ?? Date.now()).toString(),
        );
      } catch (err) {
        console.error(`[mark-price-poller] error (${symbol}):`, err);
      }
    })();
  });

  ws.on("error", (err) =>
    console.error(`[mark-price-poller] ws error (${symbol}):`, err.message),
  );

  ws.on("close", () => {
    clearInterval(watchdog);
    ws.removeAllListeners();
    sockets.delete(symbol);
    if (stopping) return;

    const delay = Math.min(3000 * 2 ** currentAttempt, MAX_BACKOFF_MS);
    console.log(
      `[mark-price-poller] ${symbol} disconnected, retry in ${delay}ms`,
    );
    setTimeout(() => connect(symbol, currentAttempt + 1), delay);
  });
}

async function shutdown(signal: string): Promise<void> {
  if (stopping) return;
  stopping = true;
  console.log(`[mark-price-poller] ${signal} received, shutting down`);
  for (const ws of sockets.values()) ws.close();
  await redis.quit().catch(() => {});
  process.exit(0);
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));

for (const symbol of Object.keys(MARKETS)) {
  connect(symbol);
}