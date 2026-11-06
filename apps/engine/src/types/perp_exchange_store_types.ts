import type { Side,OrderStatus,OrderType,Fill } from "./common_types.js";

export interface PerpsOrder{
    orderId:string;
    userId: string;
    market: string;
    side: Side;
    price: number;
    lockedPricePerUnit: number;
    filledQuantity: number;
    quantity: number;
    orderType: OrderType;
    reduceOnly: boolean;
    isLiquidation?: boolean;
    status: OrderStatus;
    fills: Fill[];
    timestamp: number;
    avgPrice: number;
    leverage: number;
}

export interface PerpsOrderBook {
    bids: PerpsOrder[];
    asks: PerpsOrder[];
}

export type PositionSide = "LONG" | "SHORT";

export interface PerpsPosition {
    positionId:string;
    userId: string;
    market: string;
    side: PositionSide;
    size: number;
    leverage: number;
    entryPrice: number;
    margin: number;
    liquidationPrice: number;
    status: "OPEN" | "CLOSED" |"LIQUIDATED";
    timestamp: number;
}