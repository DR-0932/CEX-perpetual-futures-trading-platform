import { redis } from "@cex/redis";
import { readLatestEngineSnapshot } from "../db/writer.js";
import { balanceStore } from "../store/balance_store.js";
import { spotExchangeStore } from "../store/spot_exchange_store.js";
import { perpsExchangeStore } from "../store/perps_exchange_store.js";
import { hydrateFromDB } from "../store/hydrator.js";
import { WAL_STREAM } from "./writer.js";
import { applyWalEntry } from "./apply.js";
import type { WalEntry } from "@cex/shared";

export async function restoreFromSnapshotAndReplay(): Promise<void> {
  const snapshot = await readLatestEngineSnapshot();

  if (!snapshot) {
    await hydrateFromDB();
    return;
  }

  // Restore full in-memory state from the snapshot object.
  const state = snapshot.state as {
    balances: Parameters<typeof balanceStore.restoreFromSnapshot>[0];
    spot: Parameters<typeof spotExchangeStore.restoreFromSnapshot>[0];
    perps: Parameters<typeof perpsExchangeStore.restoreFromSnapshot>[0];
  };

  balanceStore.restoreFromSnapshot(state.balances);
  spotExchangeStore.restoreFromSnapshot(state.spot);
  perpsExchangeStore.restoreFromSnapshot(state.perps);
  console.log(`[replay] snapshot loaded walCursor=${snapshot.walCursor}`);

  // Replay WAL entries written after the snapshot cursor.
  // XRANGE with exclusive lower bound: "(cursor" skips the cursor entry itself.
  let cursor = snapshot.walCursor;
  let replayed = 0;

  while (true) {
    const entries = (await redis.xrange(
      WAL_STREAM,
      `(${cursor}`,
      "+",
      "COUNT",
      "500",
    )) as [string, string[]][];

    if (!entries || entries.length === 0) break;

    for (const [msgId, fields] of entries) {
      const obj: Record<string, string> = {};
      for (let i = 0; i < fields.length; i += 2) obj[fields[i]!] = fields[i + 1]!;
      const entry = JSON.parse(obj["payload"]!) as WalEntry;
      try {
        applyWalEntry(entry);
      } catch (e) {
        console.error(`[replay] failed to apply WAL entry ${msgId}:`, e);
      }
      cursor = msgId;
      replayed++;
    }

    if (entries.length < 500) break;
  }

  console.log(`[replay] replayed ${replayed} WAL entries since snapshot`);
}
