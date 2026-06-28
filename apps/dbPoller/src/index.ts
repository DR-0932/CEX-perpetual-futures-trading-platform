import {redis} from "@cex/redis"
import { prisma } from "@cex/db"
import "dotenv/config"

async function initRedis() {
    try{
        await redis.xgroup("CREATE", "fills", "poller_group", "$","MKSTREAM")
    }catch(e:any){
        if(!e.message.includes("BUSYGROUP")) throw e
    }
}

async function process_fills() {
    while(true){
        const result = await redis.xreadgroup(
            "GROUP",        "poller_group",     "poller_worker",
            
            "COUNT",        "1",
            
            "BLOCK",        "0",
            
            "STREAMS",      "fills",             ">"
        ) as [string, [string, string[]][]][]
        
        if(!result) continue

        const [messageId,rawfileds] = result[0][1][0]
        const data:Record<string,string> ={}

        for(let i = 0;i<rawfileds.length; i += 2) {
            data[rawfileds[i]] = rawfileds[i+1]
        }

        await prisma.fills.create({
            data: {
                market:          data.market,
                price:           BigInt(data.fill_price),
                quantity:        BigInt(data.fill_qty),
                bidOrderId:      data.bid_orderId,
                askOrderId:      data.ask_orderId,
                bidUser:         { connect: { id: data.bid_userId } },
                askUser:         { connect: { id: data.ask_userId } },
                bidMargin:       BigInt(data.filled_bid_margin),
                askMargin:       BigInt(data.filled_ask_margin),
                bidRole:         "TAKER",
                askRole:         "MAKER",
                remainingBidQty: BigInt(data.remaining_bid_qty),
                remainingAskQty: BigInt(data.remaining_ask_qty),
                bidLeverage:     BigInt(data.bid_leverage),
                askLeverage:     BigInt(data.ask_leverage),
            } as any
        });

        await prisma.positions.create({
            data: {
                userId:            data.bid_userId,
                symbol:            data.market,
                market_id:         data.market,
                side:              "LONG",
                entry_price:       BigInt(data.fill_price),
                quantity:          BigInt(data.fill_qty),
                leverage:          BigInt(data.bid_leverage),
                initial_margin:    BigInt(data.filled_bid_margin),
                liquidation_price: BigInt(data.bid_liquidation_price),
                status:            "OPEN",
                type:              "LIMIT",
                PnL:               0n
            }
        })

        await prisma.positions.create({
            data: {
                userId:            data.ask_userId,
                symbol:            data.market,
                market_id:         data.market,
                side:              "SHORT",
                entry_price:       BigInt(data.fill_price),
                quantity:          BigInt(data.fill_qty),
                leverage:          BigInt(data.ask_leverage),
                initial_margin:    BigInt(data.filled_ask_margin),
                liquidation_price: BigInt(data.ask_liquidation_price),
                status:            "OPEN",
                type:              "LIMIT",
                PnL:               0n
            }
        })
        await redis.xack("fills","poller_group",messageId)
    }
}

async function main(){
    console.log("db poller started..")
    await initRedis();
    await process_fills();
}

main().catch(console.error)
