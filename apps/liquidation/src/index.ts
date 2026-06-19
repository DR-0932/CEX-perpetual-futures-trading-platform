/*  
    1. get data from matching engine via redis

    2. get data of binance from redis + websocket(no idea how this is going to work)

    3. calculate liquidation price and check if it's matched,(how are we going to keep it checking on perpetual price change, how is
        can we make it trigger an operation only when there is a fluctuation in price, does binance only send changes in price, or
        is it insignificant and we can just keep checking with markPrice poller every few ms, is trading that serious or not)


*/

import { check_and_liqudate } from "./liquidation.js";
import { start_markprice_stream } from "./markprice.js";
import { redis, STREAM } from "@cex/redis"

async function initRedis(){
    try {
        await redis.xgroup("CREATE","markPrice","liq_group","$","MKSTREAM")
    }catch(e:any) {
        if(!e.message.includes("BUSYGROUP")) throw e
    }

    try {
        await redis.xgroup("CREATE","markprice","liq_group","$",'MKSTREAM')
    }catch(e:any){
        if(!e.message.includes("BUSYGROUP")) throw e
    }
}

async function process_prices() {
    while( true ) {
        const result  = await redis.xreadgroup(
            
            "GROUP",    "liq_group",    "liq_worker",
            
            "COUNT",    "1",
            
            "BLOCK",    "0",
            
            "STREAMS",  "markprice",    ">"
        ) as [string,[string[]][][]]
        
        if(!result) continue;

        const [messageId, rawfields] = result[0][1][0]

        const data: Record<string,string> = {}

        for( let i = 0; i<rawfields.length; i +=2){
            data[rawfields[i]] = rawfields[i+1]
        }

        await check_and_liqudate(
            data.symbol,
            BigInt(Math.floor(parseFloat(data.price)*100))
        )
        await redis.xack("markprice","liq_group",messageId)
    }
}

