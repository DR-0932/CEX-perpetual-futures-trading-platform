/*  
    1. get data from matching engine via redis

    2. get data of binance from redis + websocket(no idea how this is going to work)

    3. calculate liquidation price and check if it's matched,(how are we going to keep it checking on perpetual price change, how is
        can we make it trigger an operation only when there is a fluctuation in price, does binance only send changes in price, or
        is it insignificant and we can just keep checking with markPrice poller every few ms, is trading that serious or not)


*/

import { start_markprice_stream } from "./markprice.js";
import { redis } from "@cex/redis"

async function main() {
    console.log("liquidation main function running");

    const pending =await redis.xreadgroup(
        ""
    )
}