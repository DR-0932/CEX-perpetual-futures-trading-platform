import { redisPub } from "@cex/redis";
import { orderbookChannel } from "@cex/shared";
import type { OrderbookSnapshotEvent } from "@cex/shared";
import type { SnapshotData } from "./db-reader.js";


export async function publishSnapshot(market: string, snapshot: SnapshotData): Promise<void> {
  const event: OrderbookSnapshotEvent = {
    type: "orderbook_snapshot",
    market,
    bids: snapshot.bids,
    asks: snapshot.asks,
    timestamp: Date.now(),
  };
  await redisPub.publish(orderbookChannel(market), JSON.stringify(event));
}
