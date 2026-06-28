import { redis,redisLiq } from "@cex/redis"

export function calculate_liquidation_price(entry_price: bigint, leverage: bigint, side: "LONG" | "SHORT"): bigint {
    // Maintenance margin of 0.5% (5 / 1000)
    const maintenance_margin = 5n 
    
    // Scale up the entry price to prevent rounding errors during integer division
    const margin_offset = (entry_price * maintenance_margin) / 1000n

    if (side === "LONG") {
        // Long liquidation happens HIGHER than bankruptcy price due to maintenance requirements
        return entry_price - (entry_price / leverage) + margin_offset
    } else {
        // Short liquidation happens LOWER than bankruptcy price due to maintenance requirements
        return entry_price + (entry_price / leverage) - margin_offset
    }
}

export async function check_and_liqudate(symbol: string, markPrice: bigint): Promise<void> {
     console.log("check_and_liquidate called for", symbol, markPrice)
    try {
        const hashKey = `positions:${symbol}`
        const positions = await redisLiq.hgetall(hashKey)
        console.log("positions count:", Object.keys(positions).length)
        // Redis hgetall returns an empty object {} if the key does not exist
        if (!positions || Object.keys(positions).length === 0) return
        
        for (const [id, data] of Object.entries(positions)) {
            console.log("checking position:", id)
            const single_position = JSON.parse(data as string)
            const liquidation_price = BigInt(single_position.liquidation_price)
            
            const should_liquidate = single_position.side === "LONG"
                ? markPrice <= liquidation_price
                : markPrice >= liquidation_price
            
            console.log("should_liquidate:", should_liquidate, "side:", single_position.side, "markPrice:", markPrice, "liq:", liquidation_price)   
            if (!should_liquidate) continue
            console.log("PAST THE CONTINUE CHECK")
            
            try {
                const deleted = await redisLiq.hdel(hashKey, id)
                console.log("deleted:", deleted)
            } catch(e) {
                console.error("hdel threw:", e)
            }
            
            console.log(`Successfully liquidated position ${id} for ${symbol} at ${markPrice}`)
    
            // Push events onto the stream safely
            await redisLiq.xadd("liquidations", "*",
                "positionId", id,
                "userId", single_position.userId,
                "symbol", symbol,
                "markprice", markPrice.toString()
            )
        }   
    } catch (e) {
        console.error("check_and_liquidate error:", e)
    }
}
