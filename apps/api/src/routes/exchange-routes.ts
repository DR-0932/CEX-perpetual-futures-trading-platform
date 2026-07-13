import { create_orders, cancel_order, on_ramp, get_positions, get_collateral, get_orders } from '../controllers/exchange_controllers.js'
import { authMiddleware } from '../middleware/auth_middleware.js'
import { Router }    from 'express'

export const exchangeRouter = Router()

exchangeRouter.post("/create_order", authMiddleware, create_orders)
exchangeRouter.post("/cancel_order/:id", authMiddleware, cancel_order)
exchangeRouter.post("/on_ramp", authMiddleware, on_ramp)
exchangeRouter.get("/positions", authMiddleware, get_positions)
exchangeRouter.get("/collateral", authMiddleware, get_collateral)
exchangeRouter.get("/orders",authMiddleware,get_orders)