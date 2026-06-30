"use client"

import { useEffect, useState } from "react"

type Position = {
    id: string
    symbol: string
    side: string
    entry_price: string
    quantity: string
    leverage: string
    liquidation_price: string
    status: string
}

export default function PositionsTable() {
    const [positions, setPositions] = useState<Position[]>([])
    // 1. This state is already correctly placed here:
    const [activeTab, setActiveTab] = useState<"positions" | "orders" | "fills">("positions")
    
    useEffect(() => {
        async function fetchPositions() {
            const token = localStorage.getItem("token")
            const userId = localStorage.getItem("userId")
            if (!token || !userId) return

            const res = await fetch(`http://localhost:3000/exchange/positions?userId=${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            const data = await res.json()
            setPositions(Array.isArray(data) ? data : data.positions || [])
            console.log("positions response:", data)    
        }
        fetchPositions()
    }, [])

    return (
        <div className="h-full overflow-auto">
            {/* 2. Your new dynamic tabs replace the old static buttons here: */}
            <div className="flex gap-4 px-4 py-2 border-b text-sm">
                <button 
                    onClick={() => setActiveTab("positions")}
                    className={`${activeTab === "positions" ? "text-foreground font-bold border-b-2 border-primary" : "text-muted-foreground"} pb-1`}
                >
                    Positions
                </button>
                <button 
                    onClick={() => setActiveTab("orders")}
                    className={`${activeTab === "orders" ? "text-foreground font-bold border-b-2 border-primary" : "text-muted-foreground"} pb-1`}
                >
                    Open Orders
                </button>
                <button 
                    onClick={() => setActiveTab("fills")}
                    className={`${activeTab === "fills" ? "text-foreground font-bold border-b-2 border-primary" : "text-muted-foreground"} pb-1`}
                >
                    Fill History
                </button>
            </div>

            {/* 3. Conditional Rendering based on activeTab */}
            {activeTab === "positions" && (
                <table className="w-full text-xs font-mono">
                    <thead>
                        <tr className="text-muted-foreground border-b">
                            <th className="text-left px-4 py-2">Symbol</th>
                            <th className="text-left px-4 py-2">Side</th>
                            <th className="text-left px-4 py-2">Size</th>
                            <th className="text-left px-4 py-2">Entry Price</th>
                            <th className="text-left px-4 py-2">Liq. Price</th>
                            <th className="text-left px-4 py-2">Leverage</th>
                            <th className="text-left px-4 py-2">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {positions.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="text-center text-muted-foreground py-8">
                                    No open positions
                                </td>
                            </tr>
                        ) : (
                            positions.map(p => (
                                <tr key={p.id} className="border-b hover:bg-muted/20">
                                    <td className="px-4 py-2">{p.symbol}</td>
                                    <td className={`px-4 py-2 ${p.side === "LONG" ? "text-green-400" : "text-red-400"}`}>{p.side}</td>
                                    <td className="px-4 py-2">{p.quantity}</td>
                                    <td className="px-4 py-2">{p.entry_price}</td>
                                    <td className="px-4 py-2">{p.liquidation_price}</td>
                                    <td className="px-4 py-2">{p.leverage}x</td>
                                    <td className="px-4 py-2">{p.status}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            )}

            {activeTab === "orders" && (
                <div className="p-4 text-xs text-muted-foreground">Open Orders content goes here...</div>
            )}

            {activeTab === "fills" && (
                <div className="p-4 text-xs text-muted-foreground">Fill History content goes here...</div>
            )}
        </div>
    )
}