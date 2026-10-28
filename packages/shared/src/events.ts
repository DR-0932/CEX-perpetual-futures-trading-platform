export interface FillEvent {
  type: "fill";
  orderId: string;
  userId: string;
  market: string;
  side: "buy" | "sell";
  price: number;
  quantity: number;
  fee: number;
  timestamp: number;
}

export interface OrderUpdateEvent {
  type: "order_update";
  orderId: string;
  userId: string;
  market: string;
  status: "open" | "filled" | "cancelled" | "partially_filled";
  filledQuantity: number;
  remainingQuantity: number;
}

export interface PositionUpdateEvent {
  type: "position_update";
  userId: string;
  market: string;
  side: "long" | "short";
  quantity: number;
  entryPrice: number;
  liquidationPrice: number;
  unrealizedPnl: number;
  margin: number;
  leverage: number;
}

export interface LiquidationEvent {
  type: "liquidation";
  userId: string;
  market: string;
  side: "long" | "short";
  markPrice: number;
  liquidationPrice: number;
  marginLost: number;
}
