import WebSocket from "ws";
import { redis } from "@cex/redis"

const PRICE_DECIMALS = 8; // match whatever precision your orderbook/matching engine expects

function priceStringToBigInt(priceStr: string, decimals: number): bigint {
    const [whole, frac = ""] = priceStr.split(".");
    const paddedFrac = frac.padEnd(decimals, "0").slice(0, decimals);
    return BigInt(whole + paddedFrac);
}

function start_markprice_stream(symbol: string) {
    const socketUrl = `wss://stream.binancefuture.com/ws/${symbol.toLowerCase()}@markPrice`
    const ws = new WebSocket(socketUrl)

    ws.on('open', () => {
        console.log(`connected to binance websocket for ${symbol}`)
        console.log("waiting for messages...")
    });

    ws.on('message', async (data) => {
        console.log("raw message:", data.toString().slice(0, 100))
        const message = JSON.parse(data.toString())
        const price = priceStringToBigInt(message.p, PRICE_DECIMALS)
        console.log("price:", price)

        await redis.xadd(
            'markprice', '*',
            'symbol', symbol,
            'price', price.toString()
        )
    })

    ws.on('close', () => {
        console.log(`markprice stream closed for ${symbol}, reconnecting`)
        setTimeout(() => start_markprice_stream(symbol), 3000)
    })

    ws.on('error', (error) => {
        console.error('websocket error:', error)
    });
}

start_markprice_stream('BTCUSDT')