"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import Chart from "@/components/trade/chart";
import Orderbook from "@/components/trade/orderbook";
import OrderForm from "@/components/trade/Orderform";
import PositionsTable from "@/components/trade/PositionsTable";
import OnRamp from "@/components/trade/onRamp";
import Dashboard from "@/components/trade/Dashboard";

export default function TradePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
      } catch (error) {
        console.error("Authentication failed:", error);
        return;
      } finally {
        setLoading(false);
      }
    }

    authenticate();
  }, [router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden select-none">
      {/* Top Bar */}
      <div className="h-12 border-b flex items-center px-4 gap-8 flex-shrink-0">
        <span className="font-bold text-sm">BTC-PERP</span>
        <span className="text-green-400 font-mono text-sm">--</span>

        <div className="ml-auto flex items-center gap-2">
          <Dashboard />
          <OnRamp />
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left Side */}
        <div className="flex flex-col flex-1 border-r min-h-0 overflow-hidden">
          {/* Chart + Orderbook */}
          <div className="flex h-[65%] min-h-[400px] border-b overflow-hidden">
            <div className="flex-1 border-r overflow-hidden">
              {/* <Chart /> */}
            </div>

            <div className="w-64 overflow-hidden">
              <Orderbook />
            </div>
          </div>

          {/* Positions */}
          <div className="flex-1 min-h-[200px] overflow-hidden">
            <PositionsTable />
          </div>
        </div>

        {/* Right Side */}
        <div className="w-80 flex-shrink-0 border-l overflow-hidden">
          <OrderForm />
        </div>
      </div>
    </div>
  );
}