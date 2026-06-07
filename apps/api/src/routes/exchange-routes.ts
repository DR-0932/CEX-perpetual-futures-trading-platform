import { Router } from 'express'
import { 
  create_orders, 
  cancel_order, 
  on_ramp 
} from '../controllers/exchange_controllers.js'
import { authMiddleware } from '../middleware/auth_middleware.js'

export const exchangeRouter = Router()

exchangeRouter.post("/create_order", authMiddleware, create_orders)
exchangeRouter.post("/cancel_order", authMiddleware, cancel_order)
exchangeRouter.post("/on_ramp", authMiddleware, on_ramp)