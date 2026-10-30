import { Router } from "express";
import { get_funding_history, get_funding_payments, get_funding_rate } from "../controllers/funding_rate_controller.js";
import { auth_middleware } from "../middleware/auth_middleware.js";

export const perpsFundingRouter = Router();

perpsFundingRouter.get("/rate/:market", get_funding_rate);
perpsFundingRouter.get("/history/:market", get_funding_history);
perpsFundingRouter.get("/payments/:market", auth_middleware, get_funding_payments);
