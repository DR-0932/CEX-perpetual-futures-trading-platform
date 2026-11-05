import type {Side,OrderType,OrderStatus,Fill} from "./common_types.js";

export interface SpotOrder {
    userId: string;
    market: string;
    side: Side;
    price: number;
    quantity: number;
    orderType: OrderType;
    status: OrderStatus;

    
    orderId: string;
    filledQuantity: number;
    fills: Fill[];
    timestamp: number;
    avgPrice: number;
}

export interface SpotOrderBook {
    bids: SpotOrder[];
    asks: SpotOrder[];
}