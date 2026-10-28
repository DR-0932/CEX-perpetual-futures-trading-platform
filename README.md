# CEX Perpetual Exchange

A perpetual futures exchange built as a TypeScript monorepo. The project combines a Next.js trading interface, an Express API, a Redis Streams based matching worker, and PostgreSQL persistence through Prisma.

## What is in the repo

| Path | Purpose |
| --- | --- |
| `apps/web` | Next.js interface with signup/login and a trading screen for orders, collateral, positions, chart, and order book UI. |
| `apps/api` | Express API for authentication and exchange actions. It accepts orders and publishes them to Redis. |
| `apps/engine` | Consumes order and mark price streams, matches orders, and checks positions for liquidation. In-memory books are defined for BTCUSDT, ETHUSDT, and SOLUSDT. |
| `apps/dbPoller` | Consumes fill events from Redis and persists fills and resulting positions in PostgreSQL. |
| `apps/markPricePoller` | Streams BTCUSDT mark prices from Binance Futures into Redis. |
| `packages/db` | Prisma schema, migrations, generated client, and PostgreSQL connection. |
| `packages/redis` | Shared Redis clients and stream types. |
| `packages/validation` | Shared Zod schemas for signup and login. |

## Architecture

```text
Next.js web app ──HTTP──> Express API ──> PostgreSQL
                              │
                              └── Redis `orders` stream ──> matching engine
                                                               │
                                               Redis `fills` stream ──> DB poller ──> PostgreSQL
Binance Futures mark price ──> Redis `markprice` stream ──> engine liquidation checks
```

Redis is used for stream-based communication between services and for live position data used by liquidation checks. PostgreSQL is the durable store for users, collateral, orders, fills, and positions.

## Requirements

- Node.js 20 or newer
- pnpm (the repository pins pnpm 11 in `package.json`)
- PostgreSQL
- Redis with Streams support

## Local setup

Install dependencies from the repository root:

```bash
pnpm install
```

Provide these environment variables to every service process. For example, create a root `.env` file and export it in the terminal before starting the services:

```dotenv
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/cex?schema=public"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="replace-with-a-long-random-secret"
```

```bash
set -a
source .env
set +a
```

`REDIS_URL` defaults to `redis://localhost:6379` when omitted. `DATABASE_URL` and `JWT_SECRET` are required by the database and API respectively. Exporting them in the shell also makes them available to the engine, which reads `REDIS_URL` directly from its process environment.

Generate Prisma's client and apply the checked-in migrations:

```bash
pnpm --filter @cex/db db:generate
pnpm --filter @cex/db exec prisma migrate deploy
```

## Run the services

Start each service in a separate terminal from the repository root:

```bash
pnpm --filter @cex/api dev
pnpm --filter @cex/engine dev
pnpm --filter @cex/poller dev
pnpm --filter @cex/liquidation dev
pnpm --filter web dev -- --port 3001
```

The API listens on `http://localhost:3000`. The web app is configured to use that API and the API allows browser requests from `http://localhost:3001`, so run the web app on port 3001. The mark price poller connects to Binance Futures and publishes BTCUSDT prices; it needs outbound network access.

The root scripts are `pnpm dev` and `pnpm build`, which run the corresponding Turborepo task across packages and apps. For local development, starting services individually makes it easier to see each worker's logs and avoids the API and Next.js both selecting port 3000.

## API overview

The API is served at `http://localhost:3000`.

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/auth/signup` | Create an account. Body: `name`, `username`, `email`, `password`. |
| `POST` | `/auth/login` | Log in using `identifier` (username or email) and `password`; returns a JWT. |
| `GET` | `/auth/me` | Return the authenticated user's profile. |
| `POST` | `/exchange/on_ramp` | Add collateral. Authenticated. Body: `userId`, `amount`. |
| `GET` | `/exchange/collateral?userId=...` | Read collateral totals. Authenticated. |
| `GET` | `/exchange/orders?userId=...&status=OPEN` | List a user's orders. Authenticated. |
| `GET` | `/exchange/positions?userId=...` | List open positions. Authenticated. |
| `POST` | `/exchange/create_order` | Submit an order. Authenticated. |
| `POST` | `/exchange/cancel_order/:id` | Cancel an open order. Authenticated. |

For protected routes, send `Authorization: Bearer <token>`. Order prices, quantities, and collateral are represented as integer values (`BigInt`) in the backend; callers should follow the units expected by the client and exchange logic.

## Build

```bash
pnpm build
```

This runs each workspace package's build task through Turborepo. Individual services also provide `start` scripts that run their compiled output from `dist/`.

## Current scope

This repository is an actively developed exchange prototype. It currently uses in-memory order books in the engine, and the mark price poller is configured for BTCUSDT. Review the order, collateral, and liquidation flows carefully before using it with real funds or exposing it to the public internet.


## Folder structure. 
