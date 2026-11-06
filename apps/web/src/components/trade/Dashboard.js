"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Dashboard;
const react_1 = require("react");
function Dashboard() {
    const [user, setUser] = (0, react_1.useState)({ username: "", name: "", email: "" });
    const [collateral, setCollateral] = (0, react_1.useState)({ total: "0", available: "0", locked: "0" });
    (0, react_1.useEffect)(() => {
        async function fetchData() {
            const token = localStorage.getItem("token");
            const userId = localStorage.getItem("userId");
            if (!token || !userId)
                return;
            const [userRes, collateralRes] = await Promise.all([
                fetch("http://localhost:3000/auth/me", {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                fetch(`http://localhost:3000/exchange/collateral?userId=${userId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);
            const userData = await userRes.json();
            const collateralData = await collateralRes.json();
            setUser(userData);
            setCollateral(collateralData);
        }
        fetchData();
    }, []);
    return (<div className="flex items-center gap-6 text-sm">
            <span className="">{user.username}</span>
            <div className="flex gap-4">
                <span className="text-muted-foreground">Balance: <span className="text-green-400">{collateral.available}</span></span>
                <span className="text-muted-foreground">Locked: <span className="text-yellow-400">{collateral.locked}</span></span>
            </div>
        </div>);
}
