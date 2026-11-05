import { redisPub } from "@cex/redis";
import type {UserEvent,MarketEvent,OrderbookSnapshotEvent} from "@cex/shared";
import { userEventsChannel,orderbookChannel } from "@cex/shared";

export function publishUserEvent(userId: string, event: UserEvent): void{
    redisPub
        .publish(userEventsChannel(userId),JSON.stringify(event))
        .catch((e: unknown) =>
            console.error("[publisher] publishUserEvent error:", e),
        );
}

export function publishMarketEvent(market: string, event: MarketEvent): void {
    redisPub
      .publish(orderbookChannel(market), JSON.stringify(event))
      .catch((e: unknown) =>
        console.error("[publisher] publishMarketEvent error:", e),
      );
}

export function publishOrderbookSnapshot(market: string,bids: [string, string][],asks: [string, string][]): void {
    const event: OrderbookSnapshotEvent = {
      type: "orderbook_snapshot",
      market,
      bids,
      asks,
      timestamp: Date.now(),
    };
    redisPub
      .publish(orderbookChannel(market), JSON.stringify(event))
      .catch((e: unknown) =>
        console.error("[publisher] publishOrderbookSnapshot error:", e),
      );
}
