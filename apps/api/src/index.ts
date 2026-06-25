import express, { json } from "express"
import { authRouter } from "./routes/auth-routes.js";
import { exchangeRouter } from "./routes/exchange-routes.js";
import { redis,redisSub } from "@cex/redis";

const app = express();
app.use(express.json());

app.use("/auth",authRouter);
app.use("/exchange",exchangeRouter);


export const pendingOrders = new Map<string,(data:any)=>void>()

async function initRedis(){
    
    try{                   //action //redis_key //grp_name   //start_id //optnl      
        await redis.xgroup("CREATE", "orders" , "engine_group" , "$" , "MKSTREAM")
    }catch(e:any){
        if(!e.message.includes("BUSYGROUP")) throw e
    }

    try{
        await redis.xgroup("CREATE","FILLS","api_group","$","MKSTREAM")
    }catch(e:any){
        if(!e.message.includes("BUSYGROUP")) throw e
    }

    await redisSub.subscribe("order:results")
    
    redisSub.on("message",(channel,message)=>{
        const data  =JSON.parse(message)
        const resolve = pendingOrders.get(data.orderId)
        if(resolve){
            resolve(data)
            pendingOrders.delete(data.orderId)
        }
    
    })
}

async function main(){
    await initRedis();
    app.listen(3000,()=>{
        console.log("server running on port 3000")
    })
}

main().catch(console.error)
