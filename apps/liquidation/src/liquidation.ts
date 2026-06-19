import {prisma} from "@cex/db"
import { redis } from "@cex/redis"
import { get_liquidation_price, should_liquidate } from "./calculate.js"


export async function check_and_liqudate( market:string, markPrice:bigint ) {
    const raw = await redis.hgetall(`position:${market}`)
    /**need to get redis data , then i need to    */
    if(!raw) return


    for (const [positionId,json] of Object.entries(raw)) {
        const position = JSON.parse(json)

        const liquidation_price  = get_liquidation_price(
            BigInt(position.entry_price),
            BigInt(position.leverage),
            position.side
        ) 

        if(should_liquidate(position.side,markPrice,liquidation_price)) {
            await liquidate_position(positionId,position, markPrice)
        }
    }
}

async function liquidate_position(positionId: string, position: any, markPrice: bigint) {
    
    const entryPrice    = BigInt(position.entry_price)
    const quantity      = BigInt(position.quantity)
    const initialMargin = BigInt(position.initial_margin)

    const loss = position.side === "LONG"
        ? (entryPrice - markPrice) * quantity
        : (markPrice - entryPrice) * quantity

    const remainingMargin = loss >= initialMargin 
        ? 0n 
        : initialMargin - loss

    // send to liquidations stream — DB poller handles the rest
    await redis.xadd("liquidations", "*",
        "positionId",      position.id,
        "userId",          position.userId,
        "market",          position.market_id,
        "side",            position.side,
        "markPrice",       markPrice.toString(),
        "remainingMargin", remainingMargin.toString(),
        "initialMargin",   initialMargin.toString(),
    )
    
    // remove from Redis cache immediately
    await redis.hdel(`positions:${position.market_id}`, positionId)
}