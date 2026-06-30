"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

export default function OnRamp() {
    const [amount, setAmount] = useState("")
    const [loading, setLoading] = useState(false)

    async function handleOnRamp() {
        const token = localStorage.getItem("token")
        const userId = localStorage.getItem("userId")
        if (!token || !userId) return

        setLoading(true)
        await fetch("http://localhost:3000/exchange/on_ramp", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ userId, amount: parseFloat(amount) })
        })
        setLoading(false)
        setAmount("")
    }

    return (
        <div className="flex items-center gap-2">
            <input
                type="number"
                placeholder="Amount"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="bg-input border border-border rounded px-3 py-1 text-sm w-32"
            />
            <Button onClick={handleOnRamp} disabled={loading} size="sm">
                {loading ? "..." : "Deposit"}
            </Button>
        </div>
    )
}