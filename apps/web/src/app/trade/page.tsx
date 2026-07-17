import Chart from "@/components/trade/chart";
import Orderbook from "@/components/trade/orderbook";
import OrderForm from "@/components/trade/Orderform";
import PositionsTable from "@/components/trade/PositionsTable";
import OnRamp from "@/components/trade/onRamp";
import Dashboard from "@/components/trade/Dashboard";

export default function Home() {
  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden select-none">
      {/* Top bar */}
      <div className="h-12 border-b flex items-center px-4 gap-8 flex-shrink-0">
        <span className="font-bold text-sm">BTC-PERP</span>
        <span className="text-green-400 font-mono text-sm">--</span>
            <div className="ml-auto">
              <Dashboard/>
              <OnRamp/>
          </div>
      </div>

      {/* Main content body */}
      <div className="flex flex-1 min-h-0 w-full overflow-hidden">
        
        {/* Left main column: Chart, Orderbook, and Positions */}
        <div className="flex flex-col flex-1 border-r min-h-0 overflow-hidden">
          
          {/* Top Row: Chart + Orderbook layout */}
          <div className="flex h-[65%] min-h-[400px] border-b overflow-hidden">
            {/* Chart */}
            <div className="flex-1 border-r overflow-hidden h-full">
              <Chart />
            </div>

            {/* Orderbook */}
            <div className="w-64 overflow-hidden h-full">
              <Orderbook />
            </div>
          </div>

          {/* Bottom Row: Positions Table (takes up exactly what's left) */}
          <div className="flex-1 min-h-[200px] bg-background">
            <PositionsTable />
          </div>
          
        </div>

        {/* Right column: Full height Order Form */}
        <div className="w-80 flex-shrink-0 h-full bg-background">
          <OrderForm />
        </div>

      </div>
    </div>
  );
}