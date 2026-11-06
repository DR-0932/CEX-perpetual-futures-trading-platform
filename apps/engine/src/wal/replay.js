import { redis } from "@cex/redis";
import { readLatestEngineSnapshot } from "../db/writer.js";
import { balanceStore } from "../store/balance_store.js";
import { spotExchangeStore } from "../store/spot_exchange_store.js";
import { perpsExchangeStore } from "../store/perps_exchange_store.js";
import { hydrateFromDB } from "../store/hydrator.js";
import { WAL_STREAM } from "./writer.js";
import { applyWalEntry } from "./apply.js";
export async function restoreFromSnapshotAndReplay() {
    const snapshot = await readLatestEngineSnapshot();
    if (!snapshot) {
        await hydrateFromDB();
        return;
    }
    // Restore full in-memory state from the snapshot object.
    const state = snapshot.state;
    balanceStore.restoreFromSnapshot(state.balances);
    spotExchangeStore.restoreFromSnapshot(state.spot);
    perpsExchangeStore.restoreFromSnapshot(state.perps);
    console.log(`[replay] snapshot loaded walCursor=${snapshot.walCursor}`);
    // Replay WAL entries written after the snapshot cursor.
    // XRANGE with exclusive lower bound: "(cursor" skips the cursor entry itself.
    let cursor = snapshot.walCursor;
    let replayed = 0;
    while (true) {
        const entries = (await redis.xrange(WAL_STREAM, `(${cursor}`, "+", "COUNT", "500"));
        if (!entries || entries.length === 0)
            break;
        for (const [msgId, fields] of entries) {
            const obj = {};
            for (let i = 0; i < fields.length; i += 2)
                obj[fields[i]] = fields[i + 1];
            const entry = JSON.parse(obj["payload"]);
            try {
                applyWalEntry(entry);
            }
            catch (e) {
                console.error(`[replay] failed to apply WAL entry ${msgId}:`, e);
            }
            cursor = msgId;
            replayed++;
        }
        if (entries.length < 500)
            break;
    }
    console.log(`[replay] replayed ${replayed} WAL entries since snapshot`);
}
