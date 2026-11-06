"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.signup_form = signup_form;
const react_1 = require("react");
const navigation_1 = require("next/navigation");
const validation_1 = require("@cex/validation");
function signup_form() {
    const router = (0, navigation_1.useRouter)();
    const [email, setEmail] = (0, react_1.useState)("");
    const [name, setName] = (0, react_1.useState)("");
    const [username, setUsername] = (0, react_1.useState)("");
    const [password, setPassword] = (0, react_1.useState)("");
    const [message, setMessage] = (0, react_1.useState)("");
    async function handle_submit(e) {
        e.preventDefault();
        setMessage("");
        const result = validation_1.signup_schema.safeParse({ name, email, username, password });
        if (!result.success) {
            setMessage(result.error.issues[0].message);
            return;
        }
        const res = await fetch("http://localhost3001/auth/singup", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(result.data),
        });
        const data = await res.json();
        if (!res.ok) {
            setMessage(data.message || "Singup Failed");
            return;
        }
        setMessage("signup successful");
    }
    return (<>
        <form onSubmit={handle_submit}>
            <input placeholder="name" value={name} onChange={(e) => setName(e.target.value)}/>
            <input placeholder="username" value={name} onChange={(e) => setUsername(e.target.value)}/>
            <input placeholder="Email" value={name} onChange={(e) => setEmail(e.target.value)}/>
            <input placeholder="password" value={name} onChange={(e) => setPassword(e.target.value)}/>

            <button type="submit">Sign Up</button>
            {message && <p>{message}</p>}
        </form>
    </>);
}
