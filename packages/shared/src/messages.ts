export type EngineRequestTypes = 
| "create_orders"
| "cancel_orders"
| "get_orders"
| "get_depth"
| "get_position"
| "get_user_position"
| "deposit"
| "get_user_balance"

export type baseCreateOrderRequest<TExtra = unknown> = {
    userId:string;
    market:string;
    side:"buy"|"sell";
    price:number;
    quantity:number;
    orderType:"limit" |"market";
    reduceOnly?:boolean;
} & TExtra;

export type baseCancelOrderRequest<TExtra = unknown> = {
    market: string;
    orderId:string;
} & TExtra

export type baseGetOrderRequest<TExtra = unknown> = {
  orderId: string;
  userId: string;
} & TExtra;

export type baseGetDepthRequest<TExtra = unknown> = {
  market: string;
} & TExtra;

