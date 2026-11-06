"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = OrderForm;
const react_1 = require("react");
const button_1 = require("@/components/ui/button");
function OrderForm() {
    const [side, setSide] = (0, react_1.useState)("LONG");
    const [price, setPrice] = (0, react_1.useState)("");
    const [quantity, setQuantity] = (0, react_1.useState)("");
    const [leverage, setLeverage] = (0, react_1.useState)("10");
    async function placeOrder() {
        const token = localStorage.getItem("token");
        const userId = localStorage.getItem("userId");
        await fetch("http://localhost:3000/exchange/create_order", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                userId,
                symbol: "BTCUSDT",
                market_id: "BTCUSDT",
                price: parseFloat(price),
                quantity: parseFloat(quantity),
                leverage: parseFloat(leverage),
                side,
                type: "LIMIT"
            })
        });
    }
    return (<div className="p-4 flex flex-col gap-3 h-full">
            {/* Side toggle */}
            <div className="flex">
                <button onClick={() => setSide("LONG")} className={`flex-1 py-2 text-sm font-bold ${side === "LONG" ? "bg-green-600 text-white" : "bg-muted text-muted-foreground"}`}>
                    Buy / Long
                </button>
                <button onClick={() => setSide("SHORT")} className={`flex-1 py-2 text-sm font-bold ${side === "SHORT" ? "bg-red-600 text-white" : "bg-muted text-muted-foreground"}`}>
                    Sell / Short
                </button>
            </div>

            {/* Price */}
            <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">Price</label>
                <input type="number" value={price} onChange={e => setPrice(e.target.value)} className="bg-input border border-border rounded px-3 py-2 text-sm w-full" placeholder="0.00"/>
            </div>

            {/* Quantity */}
            <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">Quantity</label>
                <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} className="bg-input border border-border rounded px-3 py-2 text-sm w-full" placeholder="0"/>
            </div>

            {/* Leverage */}
            <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">Leverage</label>
                <input type="number" value={leverage} onChange={e => setLeverage(e.target.value)} className="bg-input border border-border rounded px-3 py-2 text-sm w-full" placeholder="10"/>
            </div>

            <button_1.Button onClick={placeOrder} className={`w-full mt-auto ${side === "LONG" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}`}>
                {side === "LONG" ? "Buy / Long" : "Sell / Short"}
            </button_1.Button>
        </div>);
}
