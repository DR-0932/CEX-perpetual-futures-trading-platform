import { redisPub } from "@cex/redis";
import { userEventsChannel, orderbookChannel } from "@cex/shared";
export function publishUserEvent(userId, event) {
    redisPub
        .publish(userEventsChannel(userId), JSON.stringify(event))
        .catch((e) => console.error("[publisher] publishUserEvent error:", e));
}
export function publishMarketEvent(market, event) {
    redisPub
        .publish(orderbookChannel(market), JSON.stringify(event))
        .catch((e) => console.error("[publisher] publishMarketEvent error:", e));
}
export function publishOrderbookSnapshot(market, bids, asks) {
    const event = {
        type: "orderbook_snapshot",
        market,
        bids,
        asks,
        timestamp: Date.now(),
    };
    redisPub
        .publish(orderbookChannel(market), JSON.stringify(event))
        .catch((e) => console.error("[publisher] publishOrderbookSnapshot error:", e));
}
