export type EngineRequestType =
  | "create_order"
  | "cancel_order"
  | "get_order"
  | "get_depth"
  | "get_user_balance"
  | "deposit"
  | "get_user_position"
  | "get_position"

export interface EngineRequest<T = unknown> {
  type: EngineRequestType;
  data: T;
  correlationId: string;
  backendId: string;
}

export interface EngineResponse<T = unknown> {
  correlationId: string;
  payload: T;
}
