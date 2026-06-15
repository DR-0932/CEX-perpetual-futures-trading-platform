const maintainance_margin = BigInt(5)

export function get_liquidation_price(entryPrice:bigint,leverage:bigint,side:"LONG"|"SHORT"):bigint{
    if(side === "LONG"){
        return entryPrice - (entryPrice/leverage)+(entryPrice*maintainance_margin/1000n)
    }else {
        return entryPrice+ (entryPrice/leverage)-(entryPrice*maintainance_margin/1000n)
    }
}

export function should_liquidate(side:"LONG"|"SHORT",markPrice: bigint,liquidationPrice:bigint):boolean {
    if(side ==="LONG"){
        return markPrice<=liquidationPrice
    }else {
        return markPrice >=liquidationPrice
    }
}