import type { Depth,Fill } from "../types/common_types.js";
import { SpotOrder,SpotOrderBook } from "../types/spot_exchange_store_types.js";
import {randomUUID} from "crypto";
import {balanceStore,BalanceStore} from "./balance_store.js";
import { writeOrder, writeFill, writeBalance, writeOrderbookSnapshot } from "../db/writer.js";
import { publishUserEvent, publishOrderbookSnapshot } from "../publisher.js";
import { appendWal} from "../wal/writer.js";

class SpotExchangeStore {
    constructor(private balanceStore:BalanceStore) {
            this.initializeSpotOrderBooks();
    }
    private static readonly SPOT_MARKET = [
        "BTC_USD",
        "ETH_USD"
    ];
    private static readonly SPOT_ASSETS = new Set<string>(
        this.SPOT_MARKET.flatMap((m)=> m.split("_")),
    );

    private spotOrderBooks = new Map<string, SpotOrderBook>();
    private spotOrders = new Map<string,SpotOrder>();

    private initializeSpotOrderBooks(){
        for (const market of SpotExchangeStore.SPOT_MARKET){
            const key = market.split("_")[0]!;
            this.spotOrderBooks.set(key,{ bids: [], asks: [] });
        }
    }
    
    private snapshotSpotOb(market: string): void {
      const ob = this.spotOrderBooks.get(market);
      if (!ob) return;
      const bidLevels = new Map<number, number>();
      for (const o of ob.bids) {
        bidLevels.set(o.price, (bidLevels.get(o.price) ?? 0) + (o.quantity - o.filledQuantity));
      }
      const askLevels = new Map<number, number>();
      for (const o of ob.asks) {
        askLevels.set(o.price, (askLevels.get(o.price) ?? 0) + (o.quantity - o.filledQuantity));
      }
      const bids: [string, string][] = Array.from(bidLevels.entries()).map(([p, q]) => [p.toString(), q.toString()]);
      const asks: [string, string][] = Array.from(askLevels.entries()).map(([p, q]) => [p.toString(), q.toString()]);
      publishOrderbookSnapshot(market, bids, asks);
      writeOrderbookSnapshot(market, "SPOT", bids, asks);
    }
    
    private checksForCreateOrder(
      input: Omit<
        SpotOrder,
        | "orderId"
        | "filledQuantity"
        | "fills"
        | "status"
        | "timestamp"
        | "avgPrice"
      >,
    ): void {
      // check if market is valid
      if (!SpotExchangeStore.SPOT_MARKET.includes(input.market)) {
        throw new Error("invalid market");
      }
      // check if side is valid
      if (input.side !== "buy" && input.side !== "sell") {
        throw new Error("invalid side");
      }
      if (input.orderType !== "limit" && input.orderType !== "market") {
        throw new Error("invalid order type");
      }
      // check if quantity are positive
      if (input.quantity <= 0) {
        throw new Error("quantity must be positive");
      }
      // check if price is positive for limit order
      if (input.orderType === "limit" && input.price <= 0) {
        throw new Error("price must be positive for limit order");
      }
    }

  createOrder(
    input: Omit<
      SpotOrder,
      | "orderId"
      | "filledQuantity"
      | "fills"
      | "status"
      | "timestamp"
      | "avgPrice"
    >,
  ): unknown {
    
    this.checksForCreateOrder(input);
    
    // assign orderId, match against the book using price-time
    // enough balance
    const quote = input.market.split("_")[1]!;
    const base = input.market.split("_")[0]!;
    const asset = input.side === "buy" ? quote : base;
    
    let amountToLock: number;
    
    if ( input.side === "buy" ) {
        if ( input.orderType === "limit" ) {
            const totalCost = input.price * input.quantity;
    
            // this.lock(input.userId, quote, totalCost);
              amountToLock = totalCost;
        }
        else {
            
            //But for now, we lock the full balance. For a market order, we assume the price will not go higher than the limit order’s price
            const currentBalance = this.balanceStore.getBalance(input.userId)?.get(quote) || 0;
            
            // this.lock(input.userId, quote, currentBalance);
            amountToLock = currentBalance;
            
            if (amountToLock <= 0) {
              throw new Error("insufficient quote balance for market buy");
            }      
        }
    
    } else {
      amountToLock = input.quantity;
      // for sell order we need to lock the base
      // if(input.orderType==="limit"){
      // this.lock(input.userId, base, input.quantity);
      // amountToLock = input.quantity;
      // } else {
      // market order m sell h
      // this.lock(input.userId, base, input.quantity);
      // amountToLock = input.quantity;
    }

    //extra check , breaks when orderId is an un-used uuid. 
    let orderId = randomUUID();
    while (this.spotOrders.has(orderId)) {
      orderId = randomUUID();
    }
    
    //creating order variable with order_data
    const order: SpotOrder = {
      orderId,
      filledQuantity: 0,
      ...input,
      status: "OPEN",
      fills: [],
      timestamp: Date.now(),
      avgPrice: 0,
    };

    this.balanceStore.lock(input.userId, asset, amountToLock);
    this.spotOrders.set(orderId, order);

    writeOrder(order, "SPOT"); // insert row before any fill can reference it
        const oppositeSide = input.side === "buy" ? "asks" : "bids";
        const ob = this.spotOrderBooks.get(input.market) || { bids: [], asks: [] };
        const toIterate = ob[oppositeSide];
        const effectedMakerIds = new Set<string>();
        
        while (order.filledQuantity < order.quantity && toIterate.length > 0) {
            
            // priority, record fills, handle partial fills, support limit
            const bestOrder = toIterate[0] as SpotOrder;

            if (input.orderType === "limit") {
              if (input.side === "buy" && bestOrder!.price > input.price) {
                break;
              }
              if (input.side === "sell" && bestOrder!.price < input.price) {
                break;
              }
            }
        
            const remainingQtyBuyable = bestOrder.quantity - bestOrder.filledQuantity;  
        
            const qtyToFill = Math.min(
              remainingQtyBuyable,
              input.quantity - order.filledQuantity,
            );  
            const fillPrice = bestOrder.price;

            //creating fill variable
            const fill: Fill = {
              price: fillPrice,
              quantity: qtyToFill,
              timestamp: Date.now(),
              makerOrderId: bestOrder.orderId,
              takerOrderId: order.orderId,
            };


            order.fills.push(fill);
            order.filledQuantity += qtyToFill;
            bestOrder.filledQuantity += qtyToFill;
            bestOrder.fills.push(fill);

            writeFill(fill, bestOrder.side); // two DB rows: one per side
            
            // update both users balance and locked
            const makerUserId = bestOrder.userId;
            effectedMakerIds.add(makerUserId);
            const takerUserId = order.userId;
            
            order.avgPrice =     //total filled till now   //for this order
              (order.avgPrice * (order.filledQuantity - fill.quantity) +
                fillPrice * fill.quantity) /
              order.filledQuantity;
            
            bestOrder.avgPrice =
              (bestOrder.avgPrice * (bestOrder.filledQuantity - fill.quantity) +
                fillPrice * fill.quantity) /
              bestOrder.filledQuantity;
              
            
            if (input.side === "buy") {
                // buyer is taker and seller is maker
                // increase base amount for buyer & dec. quote amount
                this.balanceStore.deductLocked(
                  takerUserId,
                  quote,
                  fillPrice * fill.quantity,
                );
                
                this.balanceStore.credit(takerUserId, base, fill.quantity);
                this.balanceStore.deductLocked(makerUserId, base, fill.quantity);
                this.balanceStore.credit(makerUserId, quote, fillPrice * fill.quantity);
            } else {
                // seller is taker, buyer is maker
                this.balanceStore.deductLocked(takerUserId, base, fill.quantity);
                this.balanceStore.credit(takerUserId, quote, fillPrice * fill.quantity);
                this.balanceStore.deductLocked(
                  makerUserId,
                  quote,
                  fillPrice * fill.quantity,
                );
                this.balanceStore.credit(makerUserId, base, fill.quantity);
              }
            
            if (input.orderType === "limit") {
              // unlock the delta of price-fill.price for filled quantity
              if (input.side === "buy") {
                const deltaToUnlock = (input.price - fillPrice) * fill.quantity;
                this.balanceStore.unlock(takerUserId, quote, deltaToUnlock);
              }
            }

            if (bestOrder.filledQuantity === bestOrder.quantity) {
              // >= defensive programming
              bestOrder.status = "FILLED";
              // ab delete kro isko orderbook se;
              toIterate.shift();
            } else {
              bestOrder.status = "PARTIALLY_FILLED";
            }

            writeOrder(bestOrder, "SPOT"); // update maker order status + filledQty
            appendWal({ type: "order_fill", exchange: "SPOT", market: input.market, data: bestOrder, timestamp: Date.now() }).catch(console.error);
        
            // Publish fill events for taker and maker
            publishUserEvent(makerUserId, {
              type: "fill",
              orderId: bestOrder.orderId,
              userId: makerUserId,
              market: input.market,
              side: bestOrder.side,
              price: fill.price,
              quantity: fill.quantity,
              fee: 0,
              timestamp: fill.timestamp,
            });
            
            publishUserEvent(takerUserId, {
              type: "fill",
              orderId: order.orderId,
              userId: takerUserId,
              market: input.market,
              side: input.side,
              price: fill.price,
              quantity: fill.quantity,
              fee: 0,
              timestamp: fill.timestamp,
            });
            
            // Publish maker order update
            publishUserEvent(makerUserId, {
              type: "order_update",
              orderId: bestOrder.orderId,
              userId: makerUserId,
              market: input.market,
              status: bestOrder.status === "FILLED" ? "filled" : "partially_filled",
              filledQuantity: bestOrder.filledQuantity,
              remainingQuantity: bestOrder.quantity - bestOrder.filledQuantity,
            });
            
            if (order.filledQuantity === order.quantity) {
              order.status = "FILLED";
            } else if (order.filledQuantity > 0) {
               order.status = "PARTIALLY_FILLED";
            }
    }

    if (order.orderType === "market" && order.side === "buy") {
      const amountToUnlock =
        amountToLock -
        order.fills.reduce((acc, fill) => acc + fill.price * fill.quantity, 0);
      if (amountToUnlock > 0) {
        this.balanceStore.unlock(order.userId, quote, amountToUnlock);
      }
    }

    if (order.filledQuantity < order.quantity) {
      if (order.orderType === "market") {
        order.status = "PARTIALLY_CANCELLED";
        if (order.filledQuantity === 0) {
          order.status = "CANCELLED";
        }
        if (order.side === "sell") {
          this.balanceStore.unlock(
            order.userId,
            base,
            order.quantity - order.filledQuantity,
          );
        }
        writeOrder(order, "SPOT");
        appendWAL({ type: "order_cancelled", exchange: "SPOT", market: input.market, userId: order.userId, data: order, timestamp: Date.now() }).catch(console.error);
        publishUserEvent(order.userId, {
          type: "order_update",
          orderId: order.orderId,
          userId: order.userId,
          market: input.market,
          status: "cancelled",
          filledQuantity: order.filledQuantity,
          remainingQuantity: order.quantity - order.filledQuantity,
        });
        this.snapshotSpotOb(input.market);
        this.flushBalances(order.userId, effectedMakerIds, base, quote);
        return order;
      }
      // type to limit he hoga
      const sameSide = input.side === "buy" ? "bids" : "asks";
      ob[sameSide].push(order);
      // price time priority maintain krne k liye sort krna pdega
      // TODO: replace push+sort (O(n log n)) with an O(n) insertion walk to the correct price-time position
      ob[sameSide].sort((a, b) => {
        if (a.price === b.price) {
          return a.timestamp - b.timestamp; // earlier order gets priority
        }
        return input.side === "buy" ? b.price - a.price : a.price - b.price; // buy m higher price priority, sell m lower price priority
      });
    }
    writeOrder(order, "SPOT");
    appendWAL({ type: "order_created", exchange: "SPOT", market: order.market, userId: order.userId, data: order, timestamp: Date.now() }).catch(console.error);
    publishUserEvent(order.userId, {
      type: "order_update",
      orderId: order.orderId,
      userId: order.userId,
      market: input.market,
      status: order.status === "FILLED"
        ? "filled"
        : order.status === "PARTIALLY_FILLED"
          ? "partially_filled"
          : "open",
      filledQuantity: order.filledQuantity,
      remainingQuantity: order.quantity - order.filledQuantity,
    });
    this.snapshotSpotOb(input.market);
    this.flushBalances(order.userId, effectedMakerIds, base, quote);
    return order;
  }
  
}