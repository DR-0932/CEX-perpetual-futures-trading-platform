"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { signup_schema, login_schema } from "@cex/validation"

export default function LoginPage() {
    const router = useRouter()
    const [isSignup, setIsSignup] = useState(false)
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [error, setError] = useState("")

    async function handleSubmit() {
        setError("")

        // validate with the shared zod schema before hitting the API
        const result = isSignup
            ? signup_schema.safeParse({ name, email, username, password })
            : login_schema.safeParse({ identifier: username, password })

        if (!result.success) {
            setError(result.error.issues[0].message)
            return
        }

        const url = isSignup
            ? "http://localhost:3000/auth/signup"
            : "http://localhost:3000/auth/signin"

        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(result.data)
        })

        const data = await res.json()

        if (!res.ok) {
            setError(data.error || "Something went wrong")
            return
        }

        if (isSignup) {
            localStorage.setItem("userId", data.userId)
            setIsSignup(false)
        } else {
            localStorage.setItem("token", data.token)
            router.push("/trade")
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="w-96 p-8 border border-border rounded-lg bg-card">
                <h1 className="text-2xl font-bold mb-6">
                    {isSignup ? "Create Account" : "Sign In"}
                </h1>

                {isSignup && (
                    <>
                        <div className="mb-3">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                placeholder="Name"
                                value={name}
                                onChange={e => setName(e.target.value)}
                            />
                        </div>

                        <div className="mb-3">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                            />
                        </div>
                    </>
                )}

                <div className="mb-3">
                    <Label htmlFor="username">Username</Label>
                    <Input
                        id="username"
                        placeholder="Username"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                    />
                </div>

                <div className="mb-4">
                    <Label htmlFor="password">Password</Label>
                    <Input
                        id="password"
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                    />
                </div>

                {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

                <Button onClick={handleSubmit} className="w-full mb-3">
                    {isSignup ? "Sign Up" : "Sign In"}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                    {isSignup ? "Already have an account?" : "Don't have an account?"}
                    <button
                        onClick={() => setIsSignup(!isSignup)}
                        className="text-primary ml-1 hover:underline"
                    >
                        {isSignup ? "Sign In" : "Sign Up"}
                    </button>
                </p>
            </div>
        </div>
    )
}