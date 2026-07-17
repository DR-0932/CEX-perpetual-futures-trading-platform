import { redis,redisMarkPrice } from '@cex/redis'
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
    const fills = await match_orders(orderData.market)

    if(fills.length === 0){
        await redis.publish( "order:results", JSON.stringify ({
            orderId:   orderData.id,
            
            market:    orderData.market,
            
            status:    "open"
        }))
    }
    console.log("processing order:", orderData.id, "side:", orderData.side)
    console.log("published order:results for", orderData.id)
    await redis.xack( "orders", "engine_group", messageId )
}

async function processMarkPrice(messageId: string, rawFields: string[]) {
    const data: Record<string, string> = {}
    for (let i = 0; i < rawFields.length; i += 2) {
        data[rawFields[i]] = rawFields[i + 1]
    }
    await check_and_liqudate(data.symbol, BigInt(data.price))
    await redis.xack("markprice", "mark_price_group", messageId)
}

async function process_prices() {
    console.log("process_prices started")
    
    const pending = await redisMarkPrice.xreadgroup(
    
        "GROUP",   "mark_price_group", "engine_worker",
        
        "COUNT",   "100",
        
        "STREAMS", "markprice",        "0"
    
    ) as [string, [string, string[]][]][]


    if (pending?.[0]?.[1]?.length) {
        for (const [messageId, rawFields] of pending[0][1]) {
            await processMarkPrice(messageId, rawFields)
        }
    }
    console.log("pending messages processed, starting live loop")


    while(true){
        console.log("waiting for markprice message...")
       
        const result = await redisMarkPrice.xreadgroup(
            "GROUP",        "mark_price_group",     "engine_worker",
            
            "COUNT",        "1",
            
            "BLOCK",        "0",

            "STREAMS",      "markprice",        ">",
        )as [string,[string,string[]][]][]
        

        if(!result) continue;
        const [messageId,rawFields] = result[0][1][0];
        const data: Record<string,string> = {};


        for(let i = 0; i<rawFields.length;i+=2){
            data[rawFields[i]] = rawFields[i+1];
        }
        
        await check_and_liqudate(data.symbol, BigInt(data.price))
        await redisMarkPrice.xack("markprice","mark_price_group",messageId)

        console.log("xack done")
    }
}

//creating markprice consumer group
async function initRedis() {
    try{
        await redis.xgroup("CREATE", "markprice", "mark_price_group", "$","MKSTREAM")
    }catch(e:any){
        if(!e.message.includes("BUSYGROUP")) throw e
    }
}

async function main() {
    console.log("engine worker started monitoring orders..")
    
    await initRedis();
    process_prices();
    
    //reads from engine group, order stream coming from api/index.ts
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
            
        //reads from engine group, order stream coming from api/index.ts
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