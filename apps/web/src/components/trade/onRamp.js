"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = OnRamp;
const react_1 = require("react");
const button_1 = require("@/components/ui/button");
function OnRamp() {
    const [amount, setAmount] = (0, react_1.useState)("");
    const [loading, setLoading] = (0, react_1.useState)(false);
    async function handleOnRamp() {
        const token = localStorage.getItem("token");
        const userId = localStorage.getItem("userId");
        if (!token || !userId)
            return;
        setLoading(true);
        await fetch("http://localhost:3000/exchange/on_ramp", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ userId, amount: parseFloat(amount) })
        });
        setLoading(false);
        setAmount("");
    }
    return (<div className="flex items-center gap-2">
            <input type="number" placeholder="Amount" value={amount} onChange={e => setAmount(e.target.value)} className="bg-input border border-border rounded px-3 py-1 text-sm w-32"/>
            <button_1.Button onClick={handleOnRamp} disabled={loading} size="sm">
                {loading ? "..." : "Deposit"}
            </button_1.Button>
        </div>);
}
