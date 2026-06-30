"use client"

import { useEffect, useState } from "react"

type Collateral = {
    total: string
    available: string
    locked: string
}

export default function Dashboard() {
    const [username, setUsername] = useState("")
    const [collateral, setCollateral] = useState<Collateral>({ total: "0", available: "0", locked: "0" })

    useEffect(() => {
        async function fetchData() {
            const token = localStorage.getItem("token")
            const userId = localStorage.getItem("userId")
            if (!token || !userId) return

            const [userRes, collateralRes] = await Promise.all([
                fetch("http://localhost:3000/auth/me", {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                fetch(`http://localhost:3000/exchange/collateral?userId=${userId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ])

            const userData = await userRes.json()
            const collateralData = await collateralRes.json()

            setUsername(userData.username)
            setCollateral(collateralData)
        }
        fetchData()
    }, [])

    return (
        <div className="flex items-center gap-6 text-sm">
            <span className="text-muted-foreground">{username}</span>
            <div className="flex gap-4">
                <span className="text-muted-foreground">Balance: <span className="text-green-400">{collateral.available}</span></span>
                <span className="text-muted-foreground">Locked: <span className="text-yellow-400">{collateral.locked}</span></span>
            </div>
        </div>
    )
}