import { Router } from "express";
import { cancel_order, get_orders, create_orders } from "../controllers/order_controllers.js";
import { auth_middleware } from "../middleware/auth_middleware.js";

export const spotOrderRouter = Router();

spotOrderRouter.post( "/" ,     auth_middleware, create_orders);
spotOrderRouter.post( "/cancel",auth_middleware, cancel_order);
spotOrderRouter.get(  "/:id",   auth_middleware, get_orders);

export const perpsOrderRouter = Router();
perpsOrderRouter.post( "/",      auth_middleware, create_orders);
perpsOrderRouter.post( "/cancel",auth_middleware, cancel_order);
perpsOrderRouter.get(  "/:id",   auth_middleware, get_orders);
