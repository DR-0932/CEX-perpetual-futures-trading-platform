"use client";

import { useState } from "react";
import { login_schema } from "@cex/validation";

export function LoginForm() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e:React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");

    const result = login_schema.safeParse({ identifier, password });

    if (!result.success) {
      setMessage(result.error.issues[0].message);
      return;
    }

    const res = await fetch("http://localhost:3001/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result.data),
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data.message || "Login failed");
      return;
    }

    setMessage("Login successful!");
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        placeholder="Username or Email"
        value={identifier}
        onChange={(e) => setIdentifier(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button type="submit">Log in</button>
      {message && <p>{message}</p>}
    </form>
  );
}