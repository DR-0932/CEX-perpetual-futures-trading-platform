import type { WalEntry } from "@cex/shared";
import type { SpotOrder } from "../types/spot_exchange_store_types.js";
import type { PerpsOrder, PerpsPosition } from "../types/perp_exchange_store_types.js";
import { balanceStore } from "../store/balance_store.js";
import { spotExchangeStore } from "../store/spot_exchange_store.js";
import { perpsExchangeStore } from "../store/perps_exchange_store.js";

// Apply a single WAL entry to in-memory state during replay.
// All operations are direct Map mutations — no validation, no side effects
// (no DB writes, no pub/sub publishes, no WAL re-appending).
export function applyWalEntry(entry: WalEntry): void {
  const data = entry.data as Record<string, unknown>;

  switch (entry.type) {
    case "order_created":
    case "order_fill":
    case "order_cancelled": {
      if (entry.exchange === "SPOT") {
        spotExchangeStore.walSetOrder(data as unknown as SpotOrder);
      } else {
        perpsExchangeStore.walSetOrder(data as unknown as PerpsOrder);
      }
      break;
    }

    case "position_state": {
      perpsExchangeStore.walSetPosition(data as unknown as PerpsPosition);
      break;
    }

    case "balance_snapshot": {
      const { userId, asset, available, locked } = data as {
        userId: string;
        asset: string;
        available: number;
        locked: number;
      };
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
