import express from "express"
import { authRouter } from "./routes/auth-routes.js";
import { exchangeRouter } from "./routes/exchange-routes.js";
import { redis } from "@cex/redis";

const app = express();
app.use(express.json());

app.use("/auth",authRouter);
app.use("/exchange",exchangeRouter)

async function initRedis(){
    try{                   //action //redis_key //grp_name   //start_id //optnl      
        await redis.xgroup("CREATE", "orders" , "engine_group" , "$" , "MKSTREAM")
    }catch(e:any){
        if(!e.message.includes("BUSYGROUP")) throw e
    }
}

async function main(){
    await initRedis();
    app.listen(3000,()=>{
        console.log("server running on port 3000")
    })
}

main().catch(console.error)
