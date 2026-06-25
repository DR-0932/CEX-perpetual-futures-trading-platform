import WebSocket from 'ws';
import { check_and_liqudate } from '../../engine/src/liquidation.js';

export function start_markprice_stream(symbol:string){

    const socketUrl = `wss://fstream.binancefuture.com/ws/${symbol.toLowerCase()}@markPrice`; //add multiple markets here to avoid creating multiple connections
    
    const ws = new WebSocket(socketUrl);
    
    ws.on('open',()=>{
        console.log( 'connected to binance websocket' )
    });
    
    ws.on('message',async ( data )=>{
        const message = JSON.parse(data.toString());
        
          //markprice recieved from binance as "p"
        const markPrice = BigInt(Math.round(
            parseFloat(message.p)*100
        )) 
        console.log( 'Recieved market price update:',message )
        
        check_and_liqudate(symbol,markPrice)
    })
    
    ws.on('close',()=>{
        console.log(`mark price stream closed for ${symbol},reconnecting`)
        setTimeout(()=>{
            start_markprice_stream(symbol)
        },3000);
    })
    ws.on('error',(error)=>{
        console.error('websocket error:',error);
    })
    
    
}