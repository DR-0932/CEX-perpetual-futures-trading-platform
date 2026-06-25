import { redis } from "@cex/redis"

export function calculate_liquidation_price( entry_price:bigint,leverage:bigint,side:"LONG"|"SHORT" ):bigint {
    const maintenance_margin = 5n 
    
    if (side === "LONG") {
        return entry_price - (entry_price / leverage) + (entry_price * maintenance_margin / 1000n)
    } else {
        return entry_price + (entry_price / leverage) - (entry_price * maintenance_margin / 1000n)
    }
}

export async function check_and_liqudate( symbol:string, markPrice:bigint ):Promise<void> {
    try{
        const positions = await redis.hgetall(`position:${symbol}`)
        if(!positions){
            throw new Error('position for this market not found')
        }
        
        for(const [ id,data ] of Object.entries(positions) ){
            const single_position = JSON.parse(data)
            const liquidation_price = BigInt(single_position.liquidation_price)
            
            const should_liquidate = positions.side== "LONG"
            ? markPrice <= liquidation_price
            : markPrice>= liquidation_price
            
            if(!should_liquidate) continue
           
            await redis.hdel(`positions:${symbol}`,id)
    
            await redis.xadd("liquidations","*",
                "positionId",   id,
                
                "userId",       positions.userId,
                
                "symbol",       symbol,
                
                "markprice",    markPrice.toString()
            )
            console.log(`liquidated position ${id} for ${symbol} at ${markPrice}`)
        }   
    }catch(e){
        console.error("check_and_liquidate error:",e)
    }
}