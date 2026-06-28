import WebSocket from "ws";
import { redis } from "@cex/redis"

function start_markprice_stream(symbol:string){
    const socketUrl = `wss://stream.binancefuture.com/ws/${symbol.toLowerCase()}@markPrice`
    const ws = new WebSocket(socketUrl)

    ws.on('open',()=>{
        console.log(`connected to binance websocket for ${symbol}`)
         console.log("waiting for messages...")
    });

    ws.on('message',async (data)=>{
        console.log("raw message:", data.toString().slice(0, 100))
        const message = JSON.parse(data.toString())
        const price = BigInt(Math.round(parseFloat(message.p)))
        console.log("price:", price)
        await redis.xadd(
            'markprice',  '*', 
            
            'symbol'   ,  symbol,
            
            'price'    ,  price.toString()        
        )
    })

    ws.on('close',()=>{
        console.log(`markprice stream clsoed for ${symbol},reconnecting`)
        setTimeout(()=> start_markprice_stream(symbol),3000)
    })

    ws.on('error',(error)=>{
        console.error('websocket error:',error)
    });
}

start_markprice_stream('BTCUSDT')