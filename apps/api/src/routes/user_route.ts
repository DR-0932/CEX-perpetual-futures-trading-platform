import { Router } from "express";
import { on_ramp, get_balance,get__all_positions,get_single_position } from "../controllers/user_controllers.js";
import { auth_middleware } from "../middleware/auth_middleware.js";

export const spotUserRouter = Router();
spotUserRouter.get("/balance",  auth_middleware, get_balance);
spotUserRouter.post("/on_ramp", auth_middleware, on_ramp);

export const perpsUserRouter = Router();
perpsUserRouter.get("/balance",          auth_middleware, get_balance);
perpsUserRouter.get("/position/:market", auth_middleware, get_single_position);
perpsUserRouter.get("/positions/",       auth_middleware, get__all_positions);
