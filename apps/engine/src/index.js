import "dotenv/config";
import { redis } from "@cex/redis";
import { SPOT_INCOMING_STREAM, PERPS_INCOMING_STREAM, MARK_PRICE_STREAM, FUNDING_RATE_STREAM, ENGINE_CONSUMER_GROUP, ENGINE_CONSUMER_NAME, backendResponseChannel, } from "@cex/shared";
import { handleEngineRequestForPerps, handleEngineRequestForSpot } from "./handler.js";
import { perpsExchangeStore } from "./store/perps_exchange_store.js";
import { balanceStore } from "./store/balance_store.js";
import { INSURANCE_FUND_USER_ID } from "./constants.js";
import { restoreFromSnapshotAndReplay } from "./wal/replay.js";
import { startSnapshotLoop } from "./wal/snapshot.js";
function fieldsToObject(fields) {
    const obj = {};
    for (let i = 0; i < fields.length; i += 2) {
        obj[fields[i]] = fields[i + 1];
    }
    return obj;
}
async function ensureConsumerGroups() {
    for (const stream of [SPOT_INCOMING_STREAM, PERPS_INCOMING_STREAM, MARK_PRICE_STREAM, FUNDING_RATE_STREAM]) {
        try {
            await redis.xgroup("CREATE", stream, ENGINE_CONSUMER_GROUP, "0", "MKSTREAM");
        }
        catch (e) {
            if (!e.message.includes("BUSYGROUP"))
                throw e;
        }
    }
}
async function processOrderMessage(streamName, msgId, raw) {
    const request = JSON.parse(raw["payload"]);
    let payload;
    try {
        if (streamName === SPOT_INCOMING_STREAM) {
            payload = handleEngineRequestForSpot(request);
        }
        else {
            payload = handleEngineRequestForPerps(request);
        }
    }
    catch (err) {
        payload = { error: err.message };
    }
    await redis.publish(backendResponseChannel(request.backendId), JSON.stringify({ correlationId: request.correlationId, payload }));
    await redis.xack(streamName, ENGINE_CONSUMER_GROUP, msgId);
}
function processMarkPrice(raw) {
    const market = raw["market"];
    const price = Number(raw["price"]);
    if (!market || !price || isNaN(price))
        return;
    perpsExchangeStore.updateMarkPrice(market, price);
}
async function drainPending() {
    for (const stream of [SPOT_INCOMING_STREAM, PERPS_INCOMING_STREAM]) {
        const result = (await redis.xreadgroup("GROUP", ENGINE_CONSUMER_GROUP, ENGINE_CONSUMER_NAME, "COUNT", "100", "STREAMS", stream, "0"));
        if (!result)
            continue;
        for (const [streamName, messages] of result) {
            for (const [msgId, fields] of messages) {
                const raw = fieldsToObject(fields);
                const idleMs = Date.now() - parseInt(msgId.split("-")[0]);
                if (idleMs > 60_000) {
                    console.warn(`[engine] dead-lettering msgId=${msgId}`);
                    await redis.xack(streamName, ENGINE_CONSUMER_GROUP, msgId);
                    continue;
                }
                await processOrderMessage(streamName, msgId, raw);
            }
        }
    }
}
function seedInsuranceFund() {
    const seedAmt = Number(process.env.INSURANCE_FUND_SEED_USD) || 0;
    if (seedAmt <= 0)
        return;
    balanceStore.credit(INSURANCE_FUND_USER_ID, "USD", seedAmt);
    console.log(`[engine] insurance fund seeded with ${seedAmt} USD`);
}
async function main() {
    seedInsuranceFund();
    await restoreFromSnapshotAndReplay();
    await ensureConsumerGroups();
    await drainPending();
    startSnapshotLoop();
    console.log("Engine listening on streams...");
    while (true) {
        try {
            const results = (await redis.xreadgroup("GROUP", ENGINE_CONSUMER_GROUP, ENGINE_CONSUMER_NAME, "COUNT", "10", "BLOCK", "0", "STREAMS", SPOT_INCOMING_STREAM, PERPS_INCOMING_STREAM, MARK_PRICE_STREAM, FUNDING_RATE_STREAM, ">", ">", ">", ">"));
            if (!results)
                continue;
            for (const [streamName, messages] of results) {
                for (const [msgId, fields] of messages) {
                    const raw = fieldsToObject(fields);
                    if (streamName === MARK_PRICE_STREAM) {
                        processMarkPrice(raw);
                        await redis.xack(MARK_PRICE_STREAM, ENGINE_CONSUMER_GROUP, msgId);
                    }
                    else if (streamName === FUNDING_RATE_STREAM) {
                        const market = raw["market"];
                        if (market)
                            perpsExchangeStore.settleFunding(market);
                        await redis.xack(FUNDING_RATE_STREAM, ENGINE_CONSUMER_GROUP, msgId);
                    }
                    else {
                        await processOrderMessage(streamName, msgId, raw);
                    }
                }
            }
        }
        catch (err) {
            console.error("engine loop error:", err);
            await new Promise((r) => setTimeout(r, 1000));
        }
    }
}
main().catch((err) => {
    console.error("engine crashed:", err);
    process.exit(1);
});
