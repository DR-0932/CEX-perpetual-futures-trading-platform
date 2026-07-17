import { calculate_liquidation_price } from "./liquidation.js";
import { Order, Orderbook, orderbooks, removeOrder, updateOrderQty,bestAsk,bestBid } from "./orderbook.js";
import { redis } from "@cex/redis";

interface fillResult {
    fill_price:        bigint   
    fill_qty:          bigint   
    bid_fully_filled:  boolean
    ask_fully_filled:  boolean
    remaining_bid_qty: bigint   
    remaining_ask_qty: bigint   
    fill_bid_margin:   bigint   
    fill_ask_margin:   bigint 
    bidOrderID:        string
    askOrderID:        string
}

interface fillResultWithOrders extends fillResult {
    bidOrder: Order
    askOrder: Order
}

export  function calculateFill(bestBid:Order,bestAsk:Order) {
    //fill price will be calculated based on maker,the one who
    // was in the orderbook first, we need time comparision to decide
    // who's price we are going to follow*/
    const fill_price = bestBid.createdAt < bestAsk.createdAt
    ? bestBid.price
    : bestAsk.price

    const fill_qty = bestBid.quantity < bestAsk.quantity
    ? bestBid.quantity
    : bestAsk.quantity

    const bid_fully_filled = bestBid.quantity <= bestAsk.quantity
    const ask_fully_filled = bestAsk.quantity <= bestBid.quantity

    const remaining_bid_qty = bestBid.quantity - fill_qty
    const remaining_ask_qty = bestAsk.quantity - fill_qty

    const fill_bid_margin = (fill_qty*fill_price) / bestBid.leverage
    const fill_ask_margin = (fill_qty*fill_price) / bestAsk.leverage

    return{
        fill_price,
        fill_qty,
        remaining_ask_qty,
        remaining_bid_qty,
        fill_ask_margin,
        fill_bid_margin,
        bid_fully_filled,
        ask_fully_filled,
        askOrderID:bestAsk.id,
        bidOrderID:bestBid.id

    }
}

export async function updateOrderbook(book:Orderbook,bestBid:Order,bestAsk:Order,fill:fillResult){
    if(fill.bid_fully_filled) {
        removeOrder(book,bestBid.id)
    }else{
        updateOrderQty(book,bestBid.id,fill.remaining_bid_qty)
    }

    if(fill.ask_fully_filled) {
        removeOrder(book,bestAsk.id)
    }else{
        updateOrderQty(book,bestBid.id,fill.remaining_ask_qty)
    }
}

export async function match_orders(market:string):Promise<fillResult[]> {
    const book  = orderbooks.get(market)
    if(!book){
      return []
    } 
    console.log("bids:", book?.bids.size, "asks:", book?.asks.size)
        console.log("match_orders called for", market)

    const fills: fillResultWithOrders[] = []

    while(true){
        const best_bid = bestBid(book)
        const best_ask =bestAsk(book)
        
        console.log("best_bid:", best_bid?.price, "best_ask:", best_ask?.price)
        if(!best_ask ||!best_bid) break
        if(best_bid.price <best_ask.price) break

        const fill = calculateFill(best_bid,best_ask)
        await updateOrderbook(book,best_bid,best_ask,fill)
        fills.push({ ...fill, bidOrder: best_bid, askOrder: best_ask }) 

        const bid_liquidation_price = calculate_liquidation_price(fill.fill_price,best_bid.leverage,"LONG")
        const ask_liquidation_price = calculate_liquidation_price(fill.fill_price,best_ask.leverage,"SHORT")

        await (redis as any).xadd(
            "fills",                    "*",
            "fill_price",               String(fill.fill_price),
            "fill_qty",                 String(fill.fill_qty),

            "market",                   market,

            "bid_orderId",              String(best_bid.id),
            "ask_orderId",              String(best_ask.id),

            "bid_userId",               String(best_bid.userId),
            "ask_userId",               String(best_ask.userId),

            "remaining_bid_qty",        String(fill.remaining_bid_qty),
            "remaining_ask_qty",        String(fill.remaining_ask_qty),

            "filled_bid_margin",        String(fill.fill_bid_margin),
            "filled_ask_margin",        String(fill.fill_ask_margin),

            "bid_fully_filled",         String(fill.bid_fully_filled),
            "ask_fully_filled",         String(fill.ask_fully_filled),

            "bid_leverage",             String(best_bid.leverage),
            "ask_leverage",             String(best_ask.leverage),

            "bid_orderID",              String(fill.bidOrderID),
            "ask_orderID",              String(fill.askOrderID),

            "bid_liquidation_price",    String(bid_liquidation_price),
            "ask_liquidation_price",    String(ask_liquidation_price),

            "timestamp",                String(Date.now())
        )

        const sides = [
            { 
                order: best_bid, 
                side: "LONG" as const,  
                orderId: fill.bidOrderID, 
                margin: fill.fill_bid_margin,
                liquidation_price: bid_liquidation_price
            },
            { 
                order: best_ask, 
                side: "SHORT" as const,
                orderId: fill.askOrderID, 
                margin: fill.fill_ask_margin,
                liquidation_price:ask_liquidation_price
            },
        ]

        await redis.publish("order:results", JSON.stringify({
            orderId: fill.bidOrderID,
            market,
            status: "filled"
        }))
        await redis.publish("order:results", JSON.stringify({
            orderId: fill.askOrderID,
            market,
            status: "filled"
        }))

        for (const { order, side, orderId, margin,liquidation_price } of sides) {
            
            await redis.hset(`positions:${market}`, orderId, JSON.stringify({
                id:                 orderId,
                userId:             order.userId,
                symbol:             market,
                side:               side,
                entry_price:        String(fill.fill_price),
                quantity:           String(fill.fill_qty),
                leverage:           String(order.leverage),
                initial_margin:     String(margin),
                liquidation_price:  String(liquidation_price),
                status:            "OPEN"
            }))         
        }
    }
    return fills
    
}