import { redis } from '@cex/redis'
import { create_order, orderbooks ,Order} from './orderbook.js'
import { match_orders } from './matching-engine.js'
import { check_and_liqudate } from './liquidation.js'

function parseOrder( orderData: Record<string,string> ): Order {
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

async function processOrder( messageId:string,rawFields:string[] ) {
    const orderData: Record<string,string> ={}    

    for( let i =0;i<rawFields.length; i +=2 ) {
        orderData[rawFields[i]]= rawFields[i+1]
    }

    const book = orderbooks.get(orderData.market)
    if(!book){
        await redis.xack( "orders", "engine_group", messageId )
        return
    }  

    const order =  parseOrder(orderData)
    create_order(book,order)
    await match_orders(orderData.market)

    await redis.publish( "order:results", JSON.stringify ({
        orderId:   orderData.id,
        
        market:    orderData.market,
        
        status:    "filled"
    }))

    await redis.expire( `replis:${ orderData.id }`, 30 )
    await redis.xack( "orders", "engine_group", messageId )
}

async function initRedis() {
    try{
        await redis.xgroup("CREATE", "markprice", "mark_price_group", "$","MKSTREAM")
    }catch(e:any){
        if(!e.message.includes("BUSYGROUP")) throw e
    }
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
            await processOrder(messageId,rawFields)
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
        await processOrder(messageId,rawfields)
    }


}

main().catch(console.error)