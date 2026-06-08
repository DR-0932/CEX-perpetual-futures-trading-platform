import { create_orders,cancel_order,on_ramp } from '../controllers/exchange_controllers.js'
import { authMiddleware } from '../middleware/auth_middleware.js'
import { redis }     from '@cex/redis'
import { Router }    from 'express'
import { v4 as uuid} from 'uuid'

export const exchangeRouter = Router()

exchangeRouter.post("/create_order", authMiddleware, create_orders)
exchangeRouter.post("/cancel_order", authMiddleware, cancel_order)
exchangeRouter.post("/on_ramp", authMiddleware, on_ramp)
exchangeRouter.post('/exchange/order',async (req,res)=>{

  const orderId= uuid()
  await redis.xadd(
    "orders", "*",
    "id",         req.body.userId,
    "market",     req.body.market,
    "side",       req.body.side,
    "price",      req.body.price.toString(),
    "quantity",   req.body.price.toString(),
    "leverage",   req.body.leverage.toString(),
    "createdAt",  new Date().toISOString()
  )
  const reply = await redis.blpop(`replies:${orderId}`,10)

  if(!reply){
    res.status(408).json({error:"engine timeout"})
    return
  }

  const result = JSON.parse(reply[1])
  res.json(result)
})