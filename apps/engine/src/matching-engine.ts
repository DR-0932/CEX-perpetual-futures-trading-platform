import { Order, Orderbook, orderbooks, removeOrder, updateOrderQty,bestAsk,bestBid } from "./orderbook.js";
import { redis } from "@cex/redis";

interface fillResult {
    fill_price:        bigint   
    fill_qty:          bigint   
    bid_fully_filled:  boolean
    ask_fully_filled:  boolean
    remaining_bid_qty: bigint   
    remaining_ask_qty: bigint   
    fill_bid_margin: bigint   
    fill_ask_margin: bigint 
}

export  function calculateFill(bestBid:Order,bestAsk:Order) {
    //fill price will be calculated based on maker,(the one who)
    // was in the orderbook first, we need timecomparision to decis
    // who's price we are going to follow*/
    const fill_price = bestBid.createdAt < bestAsk.createdAt
    ? bestBid.price
    : bestAsk.price

    const fill_qty = bestBid.quantity < bestAsk.quantity
    ? bestBid.quantity
    : bestAsk.quantity

    const bid_fully_filled = bestBid.quantity<=bestAsk.quantity
    const ask_fully_filled = bestAsk.quantity<=bestBid.quantity

    const remaining_bid_qty = bestBid.quantity-fill_qty
    const remaining_ask_qty = bestAsk.quantity-fill_qty

    const fill_bid_margin = (fill_qty*fill_price)/bestBid.leverage
    const fill_ask_margin = (fill_qty*fill_price)/bestAsk.leverage

    return{
        fill_price,
        fill_qty,
        remaining_ask_qty,
        remaining_bid_qty,
        fill_ask_margin,
        fill_bid_margin,
        bid_fully_filled,
        ask_fully_filled
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

export async function match_orders(market:string):Promise<void> {
    const book  = orderbooks.get(market)
    if(!book) return



    while(true){
        const best_bid = bestBid(book)
        const best_ask =bestAsk(book)

        if(!best_ask ||!best_bid) break
        if(best_bid >best_ask) break

        const fill = calculateFill(best_bid,best_ask)
        updateOrderbook(book,best_bid,best_ask,fill)
        
        await (redis as any).xadd(
            "fills", "*",
            "fill_price", String(fill.fill_price),
            "fill_qty",   String(fill.fill_qty),
            
            "market",    market,
            
            "bid_orderId",     String(best_bid.id),
            "ask_orderId",     String(best_ask.id),

            "remaining_bid_qty",    String(fill.remaining_bid_qty),
            "remaining_ask_qty",     String(fill.remaining_ask_qty),

            "filled_bid_margin",    String(fill.fill_bid_margin),
            "filled_ask_margin",    String(fill.fill_ask_margin),

            "bid_fully_filled",     String(fill.bid_fully_filled),
            "ask_fully_filled",     String(fill.ask_fully_filled),

            "bid_leverage",         String(best_bid.leverage),
            "ask_leverage",         String(best_ask.leverage),

            "timestamp",            String(Date.now())
        )
    }
}