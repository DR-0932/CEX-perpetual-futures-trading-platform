import { prisma } from "@cex/db";
const writeQueue = [];
let flushing = false;
function enqueueWrite(fn) {
    writeQueue.push(fn);
    if (!flushing)
        flushWriteQueue();
}
async function flushWriteQueue() {
    flushing = true;
    while (writeQueue.length > 0) {
        const fn = writeQueue.shift();
        try {
            await fn();
        }
        catch (e) {
            console.error("[db-writer] write error:", e);
        }
    }
    flushing = false;
}
// Upsert an order. Call immediately after creation (status=OPEN) so the row
// exists before any fill references it. Call again after matching to update
// filledQty and status.
export function writeOrder(order, exchange) {
    const o = order;
    enqueueWrite(() => prisma.order.upsert({
        where: { id: o.orderId },
        update: {
            status: o.status,
            filledQty: String(o.filledQuantity),
            avgFillPrice: o.avgPrice > 0 ? String(o.avgPrice) : null,
        },
        create: {
            id: o.orderId,
            userId: o.userId,
            market: o.market,
            side: o.side,
            orderType: o.orderType,
            price: String(o.price),
            quantity: String(o.quantity),
            filledQty: "0",
            status: o.status,
            leverage: o.leverage ?? null,
            reduceOnly: o.reduceOnly ?? false,
            exchange,
        },
    }).then(() => { }));
}
/**Write two fill rows per trade one linked to takeOrderId, one to makeOrderId.
 *  MakerSide is the buy/sell side of the resting(maker) order */
export function writeFill(fill, makerSide) {
    enqueueWrite(() => prisma.fill.createMany({
        data: [
            {
                orderId: fill.takerOrderId,
                price: String(fill.price),
                quantity: String(fill.quantity),
                makerSide,
            },
            {
                orderId: fill.makerOrderId,
                price: String(fill.price),
                quantity: String(fill.quantity),
                makerSide,
            }
        ],
    }).then(() => { }));
}
/**Upsert a position by it's positionId. Called From inside updatePOsitionFromFill at
 * eveery state transition(open,increase,partial close, full close, flip) */
export function writePosition(position) {
    enqueueWrite(() => prisma.position.upsert({
        where: { id: position.positionId },
        update: {
            side: position.side,
            quantity: String(position.size),
            entryPrice: String(position.entryPrice),
            liquidationPrice: String(position.liquidationPrice),
            margin: String(position.margin),
            status: position.status,
        },
        create: {
            id: position.positionId,
            userId: position.userId,
            market: position.market,
            side: position.side,
            quantity: String(position.size),
            entryPrice: String(position.entryPrice),
            liquidationPrice: String(position.liquidationPrice),
            margin: String(position.margin),
            leverage: position.leverage,
            status: position.status,
        },
    }).then(() => { }));
}
/** Record an insurance fund inflow(+ve) or outflow (-ve) */
export function writeInsuranceFundEvent(market, amount, reason) {
    enqueueWrite(() => prisma.insuranceFundEvent.create({
        data: { market, amount: String(amount), reason },
    }).then(() => { }));
}
// Write a funding settlement: one FundingRate row + one FundingPayment per position.
export function writeFundingRate(market, rate, markPrice, indexPrice, payments) {
    enqueueWrite(async () => {
        const rateRow = await prisma.fundingRate.create({
            data: {
                market,
                rate: String(rate),
                markPrice: String(markPrice),
                indexPrice: String(indexPrice),
            },
        });
        if (payments.length > 0) {
            await prisma.fundingPayment.createMany({
                data: payments.map((p) => ({
                    userId: p.userId,
                    market,
                    positionSide: p.side,
                    amount: String(p.amount),
                    fundingRateId: rateRow.id,
                })),
            });
        }
    });
}
// Write the post-match orderbook depth snapshot so the poller can read it and
// push it to WS clients on an interval even when no new trades occur.
export function writeOrderbookSnapshot(market, exchange, bids, asks) {
    enqueueWrite(() => prisma.orderbookSnapshot.create({
        data: { market, exchange, bids, asks },
    }).then(() => { }));
}
//Persist a full engine state snapshot
export async function writeEngineSnapshotAwait(walCursor, state) {
    await prisma.engineSnapshot.create({
        data: { walCursor, state: state },
    });
}
//Read the most recent snapshot (returns null if none exist)
export async function readLatestEngineSnapshot() {
    const row = await prisma.engineSnapshot.findFirst({ orderBy: { createdAt: "desc" } });
    if (!row)
        return null;
    return { walCursor: row.walCursor, state: row.state };
}
//Snapshot current available + locked for a user/asset after a fill settles.
export function writeBalance(userId, asset, available, locked) {
    enqueueWrite(() => prisma.balance.upsert({
        where: { userId_asset: { userId, asset } },
        update: { available: String(available), locked: String(locked) },
        create: { userId, asset, available: String(available), locked: String(locked) }
    }).then(() => { }));
}
