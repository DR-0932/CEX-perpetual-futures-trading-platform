import { Router } from "express";
import { get_depth } from "../controllers/market_controllers.js";

export const spotMarketRouter = Router();

spotMarketRouter.get("/:symbol",get_depth);

export const perpsMarketRouter = Router();

perpsMarketRouter.get("/:symbol",get_depth);