"use client";
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = TradePage;
const react_1 = require("react");
const navigation_1 = require("next/navigation");
const chart_1 = __importDefault(require("@/components/trade/chart"));
const orderbook_1 = __importDefault(require("@/components/trade/orderbook"));
const Orderform_1 = __importDefault(require("@/components/trade/Orderform"));
const PositionsTable_1 = __importDefault(require("@/components/trade/PositionsTable"));
const onRamp_1 = __importDefault(require("@/components/trade/onRamp"));
const Dashboard_1 = __importDefault(require("@/components/trade/Dashboard"));
function TradePage() {
    const router = (0, navigation_1.useRouter)();
    const [loading, setLoading] = (0, react_1.useState)(true);
    (0, react_1.useEffect)(() => {
        async function authenticate() {
            const token = localStorage.getItem("token");
            if (!token) {
                router.replace("/login");
                return;
            }
            try {
                const res = await fetch("http://localhost:3000/exchange/orders/get_orders", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                if (res.status === 401 || res.status === 403) {
                    localStorage.removeItem("token");
                    router.replace("/login");
                    return;
                }
            }
            catch (error) {
                console.error("Authentication failed:", error);
                return;
            }
            finally {
                setLoading(false);
            }
        }
        authenticate();
    }, [router]);
    if (loading) {
        return (<div className="flex h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>);
    }
    return (<div className="flex flex-col h-screen bg-background text-foreground overflow-hidden select-none">
      {/* Top Bar */}
      <div className="h-12 border-b flex items-center px-4 gap-8 flex-shrink-0">
        <span className="font-bold text-sm">BTC-PERP</span>
        <span className="text-green-400 font-mono text-sm">--</span>

        <div className="ml-auto flex items-center gap-2">
          <Dashboard_1.default />
          <onRamp_1.default />
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left Side */}
        <div className="flex flex-col flex-1 border-r min-h-0 overflow-hidden">
          {/* Chart + Orderbook */}
          <div className="flex h-[65%] min-h-[400px] border-b overflow-hidden">
            <div className="flex-1 border-r overflow-hidden">
              <chart_1.default />
            </div>

            <div className="w-64 overflow-hidden">
              <orderbook_1.default />
            </div>
          </div>

          {/* Positions */}
          <div className="flex-1 min-h-[200px] overflow-hidden">
            <PositionsTable_1.default />
          </div>
        </div>

        {/* Right Side */}
        <div className="w-80 flex-shrink-0 border-l overflow-hidden">
          <Orderform_1.default />
        </div>
      </div>
    </div>);
}
