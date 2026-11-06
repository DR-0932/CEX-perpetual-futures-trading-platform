import { redisPub } from "@cex/redis";
import { orderbookChannel } from "@cex/shared";
export async function publishSnapshot(market, snapshot) {
    const event = {
        type: "orderbook_snapshot",
        market,
        bids: snapshot.bids,
        asks: snapshot.asks,
        timestamp: Date.now(),
    };
    await redisPub.publish(orderbookChannel(market), JSON.stringify(event));
}
