import { redis } from '@cex/redis'


async function processMessage(messageId:string,rawFields:string[]){
    const orderData: Record<string,string> ={}    

    for(let i =0;i<rawFields.length; i +=2){
        orderData[rawFields[i]]= rawFields[i+1]
    }
    
    console.log(`Processing order [${messageId}]:`,orderData)
    await redis.xack("orders","engine_group",messageId)
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
            "GROUP",    "engine_group",   "wokrer_1",
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