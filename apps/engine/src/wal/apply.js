import { balanceStore } from "../store/balance_store.js";
import { spotExchangeStore } from "../store/spot_exchange_store.js";
import { perpsExchangeStore } from "../store/perps_exchange_store.js";
// Apply a single WAL entry to in-memory state during replay.
// All operations are direct Map mutations — no validation, no side effects
// (no DB writes, no pub/sub publishes, no WAL re-appending).
export function applyWalEntry(entry) {
    const data = entry.data;
    switch (entry.type) {
        case "order_created":
        case "order_fill":
        case "order_cancelled": {
            if (entry.exchange === "SPOT") {
                spotExchangeStore.walSetOrder(data);
            }
            else {
                perpsExchangeStore.walSetOrder(data);
            }
            break;
        }
        case "position_state": {
            perpsExchangeStore.walSetPosition(data);
            break;
        }
        case "balance_snapshot": {
            const { userId, asset, available, locked } = data;
            balanceStore.walSetBalance(userId, asset, Number(available), Number(locked));
            break;
        }
        // liquidation_triggered and funding_settled are captured via position_state
        // and balance_snapshot entries — no additional apply needed.
        case "liquidation_triggered":
        case "funding_settled":
            break;
    }
}
