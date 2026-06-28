import Chart from "@/components/trade/chart";

export default function Home() {
  return (
  <div className="flex flex-col h-screen bg-background text-foreground">
      {/* Top bar */}
      <div className="h-12 border-b flex items-center px-4 gap-8">
        <span className="font-bold">BTC-PERP</span>
        <span className="text-green-400 font-mono text-lg">--</span>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Chart */}
            {/* Chart */}
            <div className="flex-1 border-r h-full">
                <Chart/>
            </div>


        {/* Orderbook */}
        <div className="w-64 border-r">
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            Orderbook
          </div>
        </div>

        {/* Order form */}
        <div className="w-72">
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            Order Form
          </div>
        </div>
      </div>

      {/* Bottom tabs */}
      <div className="h-48 border-t">
        <div className="flex items-center justify-center h-full text-muted-foreground">
          Positions / Orders
        </div>
      </div>
    </div>
  );
}
