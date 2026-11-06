"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginForm = LoginForm;
const react_1 = require("react");
const validation_1 = require("@cex/validation");
function LoginForm() {
    const [identifier, setIdentifier] = (0, react_1.useState)("");
    const [password, setPassword] = (0, react_1.useState)("");
    const [message, setMessage] = (0, react_1.useState)("");
    async function handleSubmit(e) {
        e.preventDefault();
        setMessage("");
        const result = validation_1.login_schema.safeParse({ identifier, password });
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
    return (<form onSubmit={handleSubmit}>
      <input placeholder="Username or Email" value={identifier} onChange={(e) => setIdentifier(e.target.value)}/>
      <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}/>
      <button type="submit">Log in</button>
      {message && <p>{message}</p>}
    </form>);
}
