import { redis } from "@cex/redis"
import { prisma } from "@cex/db"

async function processFill(messageId:string,rawFields:string[]) {
    const data : Record<string,string> = {};

    for(let i = 0; i < rawFields.length; i+=2) {
        data[rawFields[i]] = rawFields[i+1]
    }

    await prisma.fills.create({
        data: {
            market:          data.market,
            price:           BigInt(data.fill_price),
            quantity:        BigInt(data.fill_qty),
            bidOrderId:      data.bid_orderId,
            askOrderId:      data.ask_orderId,
            bidUserId:       data.bid_userId,
            askUserId:       data.ask_userId,
            bidMargin:       BigInt(data.filled_bid_margin),
            askMargin:       BigInt(data.filled_ask_margin),
            bidRole:         data.bid_role,          
            askRole:         data.ask_role,          
            remainingBidQty: BigInt(data.remaining_bid_qty),  
            remainingAskQty: BigInt(data.remaining_ask_qty),  
            bidLeverage:     BigInt(data.bid_leverage),       
            askLeverage:     BigInt(data.ask_leverage),       
        }
    })
    await redis.lpush(`replies:${data.bid_orderId}`,JSON.stringify({
        status:         "filled",
        fillPrice:      data.fill_price,
        fillQty:        data.fill_qty,
        market:         data.market,
    }))

    await redis.publish(`user:${data.bid_userId}:fills`, JSON.stringify({
        type:  "fill",
        price:  data.fill_price,
        qty:    data.fill_qty
    }))

    await redis.publish(`user:${data.ask_userId}:fills`, JSON.stringify({
        type:  "fill",
        price:  data.fill_price,
        qty:    data.fill_qty
    }))
    
    await redis.publish(`orderbook:${data.market}`, JSON.stringify({
        type:  "fill",
        price: data.fill_price,
        qty:   data.fill_qty,
    }))

    await redis.xack("fills","api_group",messageId)
}

export async function startPoller(){
    console.log("poller started")
    
    const pending = await redis.xreadgroup(
        "GROUP",        "api_group",    "poller",
        
        "COUNT",        "100",
        
        "STREAMS",      "fills",        "0"
   
    )   as [string, [string, string[]][]][]
   
    if (pending?.[0]?.[1]?.length) {
        for (const [messageId, rawFields] of pending[0][1]) {
            await processFill(messageId, rawFields)
        }
    }

     while (true) {
        const result = await redis.xreadgroup(
            "GROUP",        "api_group",   "poller",
           
            "COUNT",        "1",
            
            "BLOCK",        "0",
           
            "STREAMS",      "fills",      ">"
        
        ) as [string, [string, string[]][]][]

        if (!result) continue
        const [messageId, rawFields] = result[0][1][0]
        await processFill(messageId, rawFields)
    }
}
    