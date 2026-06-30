"use client"

import { useEffect, useState } from "react"

type PriceLevel = [string, string] // [price, quantity]

export default function Orderbook() {
    const [asks, setAsks] = useState<PriceLevel[]>([])
    const [bids, setBids] = useState<PriceLevel[]>([])

    useEffect(() => {
        const ws = new WebSocket("wss://stream.binance.com:9443/ws/btcusdt@depth20@100ms")

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data)
            setAsks(data.asks.slice(0, 15))
            setBids(data.bids.slice(0, 15))
        }

        return () => ws.close()
    }, [])

    return (
        <div className="h-full flex flex-col text-xs font-mono p-2">
            <div className="flex justify-between text-muted-foreground mb-1 px-1">
                <span>Price</span>
                <span>Size</span>
            </div>

            {/* Asks */}
            <div className="flex-1 flex flex-col-reverse overflow-hidden">
                {asks.map(([price, qty]) => (
                    <div key={price} className="flex justify-between px-1 hover:bg-muted/20">
                        <span className="text-red-400">{parseFloat(price).toFixed(1)}</span>
                        <span>{parseFloat(qty).toFixed(4)}</span>
                    </div>
                ))}
            </div>

            {/* Spread */}
            <div className="text-center py-1 text-muted-foreground border-y">
                {asks[0] && bids[0] && (parseFloat(asks[0][0]) - parseFloat(bids[0][0])).toFixed(1)}
            </div>

            {/* Bids */}
            <div className="flex-1 overflow-hidden">
                {bids.map(([price, qty]) => (
                    <div key={price} className="flex justify-between px-1 hover:bg-muted/20">
                        <span className="text-green-400">{parseFloat(price).toFixed(1)}</span>
                        <span>{parseFloat(qty).toFixed(4)}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}