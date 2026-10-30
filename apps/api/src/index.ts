import "dotenv/config";
import express, { Router } from "express";
import type { ErrorRequestHandler, RequestHandler } from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { prisma } from "@cex/db";

import { authRouter } from "./routes/auth_routes.js";
import { initBroker } from "./utils/brokers.js";
import { spotOrderRouter, perpsOrderRouter } from "./routes/order_route.js";
import { spotMarketRouter, perpsMarketRouter } from "./routes/market_route.js";
import { spotUserRouter, perpsUserRouter } from "./routes/user_route.js";
import { perpsFundingRouter } from "./routes/funding_route.js";
import { addQueueProps } from "./middleware/spot_or_perps.js";

/* ───────────── Config ───────────── */

// Read once at startup. Env vars are always strings, so convert PORT to a number.
const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: Number(process.env.PORT) || 3000, // Number(undefined) is NaN, so fall back to 3000
  BACKEND_INSTANCE_ID: process.env.BACKEND_INSTANCE_ID ?? "backend-1",
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? "*",
};

const isProd = env.NODE_ENV === "production";

/* ───────────── Route groups ───────────── */

// Specific paths first so "/order" isn't swallowed by the catch-all "/".
const spotRouter = Router();
spotRouter.use("/order", spotOrderRouter);
spotRouter.use("/depth", spotMarketRouter);
spotRouter.use("/", spotUserRouter);

const perpsRouter = Router();
perpsRouter.use("/order", perpsOrderRouter);
perpsRouter.use("/depth", perpsMarketRouter);
perpsRouter.use("/funding", perpsFundingRouter);
perpsRouter.use("/", perpsUserRouter);

/* ───────────── Fallback handlers ───────────── */

const notFound: RequestHandler = (req, res) => {
  res.status(404).json({ error: `Not found: ${req.method} ${req.path}` });
};

// Needs all 4 params, Express detects error handlers by arity.
const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error(err);
  // Don't leak internals to clients in production.
  res.status(err.status ?? 500).json({ error: isProd ? "Internal server error" : err.message });
};

/* ───────────── App ───────────── */

const app = express();

// Makes req.ip the real client IP behind a load balancer (rate limiting depends on it).
app.set("trust proxy", 1);

// Security and parsing
app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json({ limit: "100kb" })); // small cap blocks oversized payloads
app.use(rateLimit({ windowMs: 60_000, limit: 100 })); // use `max` on express-rate-limit v6

// Health: liveness = process is up, readiness = dependencies are reachable
app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/ready", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    // TODO: add a broker ping
    res.json({ ok: true });
  } catch {
    res.status(503).json({ ok: false });
  }
});

// Dev-only helpers, never exposed in production
if (!isProd) {
  app.get("/debug/db-check", async (_req, res, next) => {
    try {
      res.json({ users: await prisma.user.count() });
    } catch (err) {
      next(err);
    }
  });

  // TODO: call sendToEngine("get_depth", ...) with a timeout to test the engine round trip
  app.get("/debug/ping-engine", (_req, res) => {
    res.json({ message: "pong" });
  });
}

// Business routes. addQueueProps only runs where a queue is needed.
app.use("/", authRouter);
app.use("/spot", addQueueProps, spotRouter);
app.use("/perps", addQueueProps, perpsRouter);

// Must be last
app.use(notFound);
app.use(errorHandler);

/* ───────────── Startup and shutdown ───────────── */

async function main() {
  // Broker first: no point accepting requests we can't forward to the engine.
  await initBroker();

  const server = app.listen(env.PORT, () => {
    console.log(`[${env.BACKEND_INSTANCE_ID}] listening on :${env.PORT}`);
  });

  // Graceful shutdown: stop new connections, let in-flight requests finish, then close resources.
  const shutdown = (signal: string) => {
    console.log(`${signal} received, shutting down`);
    server.close(async () => {
      await prisma.$disconnect();
      // TODO: close the broker connection
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref(); // force exit if something hangs
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

main().catch((err) => {
  console.error("startup failed:", err);
  process.exit(1);
});