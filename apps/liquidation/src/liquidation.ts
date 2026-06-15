import {prisma} from "@cex/db"
import { redis } from "@cex/redis"
import { get_liquidation_price, should_liquidate } from "./calculate.js"


export async function check_and_liqudate(market:string,markPrice:bigint){
    const raw = await redis.hgetall(`position:${market}`)
    if(!raw) return

    for (const [positionId,json] of Object.entries(raw)) {
        const position = JSON.parse(json)

        const liquidation_price  = get_liquidation_price(
            BigInt(position.entry_price),
            BigInt(position.leverage),
            position.side
        ) 

        if(should_liquidate(position.side,markPrice,liquidation_price)) {
            await liquidate_position(position, markPrice)
        }
    }
}

async function liquidate_position(position:any, markPrice:bigint) {
    console.log( `liquidateing position ${position.id} at mark price ${markPrice}`)

    const entryPrice = BigInt(position.entry_price)
    const quantity = position.quantity
    let remainingMarin: bigint

    if(position.side ==="LONG") {
        const loss = (entryPrice - markPrice)* quantity
        remainingMarin = position.initial_margin-loss
    }else {
        const loss = (markPrice - entryPrice)* quantity
        remainingMarin = position.initial_margin - loss
    }
}