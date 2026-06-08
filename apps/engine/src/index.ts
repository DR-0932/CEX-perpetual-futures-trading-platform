import { redis } from '@cex/redis'
import { create_order, orderbooks ,Order} from './orderbook.js'
import { match_orders } from './matching-engine.js'


function parseOrder(orderData: Record<string,string>): Order{
    return{
        id:         orderData.id,
        userId:     orderData.userId,
        price:      BigInt(orderData.price),
        quantity:   BigInt(orderData.quantity),
        filled_qty: BigInt(orderData.filled_qty),
        margin:     BigInt(orderData.margin),
        leverage:   BigInt(orderData.leverage),
        side:       orderData.side as "LONG" | "SHORT",
        createdAt:  new Date(orderData.createdAt)
    }
}

async function processMessage(messageId:string,rawFields:string[]){
    const orderData: Record<string,string> ={}    

    for( let i =0;i<rawFields.length; i +=2 ) {
        orderData[rawFields[i]]= rawFields[i+1]
    }

    const book = orderbooks.get(orderData.market)
    if(!book){
        await redis.xack("orders","engine_group",messageId)
        return
    }

    const order = parseOrder(orderData)
    create_order(book,order)
    await match_orders(orderData.market)

    await redis.lpush(`replies:${orderData.id}`,JSON.stringify({
        orderId:   orderData.id,
        status:    "filled",
        market:    orderData.market
    }))

    await redis.expire( `replis:${orderData.id}`,30 )
    await redis.xack( "orders","engine_group",messageId )
}


async function main() {
    
    console.log("engine worker started monitoring orders..")
    const pending = await redis.xreadgroup(
        
        "GROUP",    "engine_group", "worker_1",
        
        "COUNT",    "100",
        
        "STREAMS",  "orders",       "0"  //read un-ack messages
    
    ) as [string, [string, string[]][]][]

    if(pending){
        for(const[messageId,rawFields] of pending[0][1]){
            await processMessage(messageId,rawFields)
        }
    }

    while(true) {
        const result =await redis.xreadgroup(
           
            "GROUP",    "engine_group",   "worker_1",
           
            "COUNT",    "1",
           
            "BLOCK",    "0",
           
            "STREAMS",  "orders",          ">" 
        
        ) as [string,[string,string[]][]][]
        
        if(!result) continue;
        
        const [messageId,rawfields] = result[0][1][0]
        await processMessage(messageId,rawfields)
    }
}

main().catch(console.error)