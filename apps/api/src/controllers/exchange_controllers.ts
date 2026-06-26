import type { Request,Response } from "express";
import { prisma } from '@cex/db'
import { redis } from '@cex/redis'
import { pendingOrders } from "../index.js";
import { v4 as uuid } from 'uuid'

//types to be put in /packages/types and exported from there
type onRamp = {
    userId:string,
    amount:bigint,

}

type orderType={
    userId:string,
    price:bigint,
    symbol:string,
    market_id:string,
    leverage:bigint,
    side: "LONG" | "SHORT",
    type: "MARKET" | "LIMIT",
    quantity:bigint,
    createdAt:Date 
}

type OrderStatus = {
  OPEN: 'OPEN',
  FILLED: 'FILLED',
  PARTIALLY_FILLED: 'PARTIALLY_FILLED',
  CANCELLED: 'CANCELLED'
} 


/**----adding money to account wallet---- */
export async function on_ramp(req:Request,res:Response):Promise<void>{
   
    const {userId,amount} = req.body as onRamp
    try{
        await prisma.collateral.upsert({
            where:{userId},
            update:{
                total:  {increment:amount},
                available:  {increment:amount}
            },
            create: {
                userId,
                total: amount,
                available: amount,
                locked: 0n
            }
        })
        res.status(200).json({message:"balance added"})
    }catch(e){
        res.status(400).json({error:"Unable to update collateral",e})
    }

}

/**----creating a new order---- */
export async function create_orders(req:Request,res:Response):Promise<void>{
    const data = req.body as orderType
    if(!data){
        res.status(404).json({error:"no data recieved"})
    }
    try{
        const {userId,symbol,market_id,price,leverage,side,type,quantity} =data

            /**----calculating margin---- */
        const required_margin = (price*quantity)/leverage
        const orderId = uuid();
        /**----updating amount to locked---- */
        await prisma.collateral.update({
            where:{id:userId},
            data:{
                available: { decrement: BigInt(required_margin)},
                locked:    { increment: BigInt(required_margin)}
            }
        })
        
        /**----db call creating order---- */
        await prisma.orders.create({
            data:{
                id:         orderId,
                user_id:    userId,
                price:      BigInt(price),
                market_id:  market_id,
                symbol:     symbol,
                margin:     required_margin,
                side:       side,
                type:       type,
                quantity:   BigInt(quantity),
                created_at: new Date(),
                leverage:   leverage,
                status:     "OPEN",
                filled_qty: 0n,
            }
        })
        
        /**----redis stream: adding limit order ---- */
        await redis.xadd(
            "orders",    "*",
            "id",        String(userId),            
            "userId",    String(userId),
            "market",    symbol,
            "market_id", market_id,
            "margin",    String(required_margin),
            "leverage",  String(leverage),
            "side",      String(side),
            "price",     String(price),
            "quantity",  String(quantity),
            "type",      type,
            "filled_qty", 0,
            "createdAt", new Date().toISOString()
        )

        const result = await Promise.race([
            new Promise((resolve)=>{pendingOrders.set(orderId,resolve)}),
            new Promise((_,reject)=>setTimeout(()=>reject(new Error("timeout"))))
        ])
        res.json(result)
    
    }catch(e){
        console.error("create orders error:",e);
        res.status(500).json({error:"internal server error"});
    }
}
    
    //cancel order
export async function cancel_order(req: Request,res:Response):Promise<void>{
    const userId = req.userId //will come from authmiddleware once i add it
    const orderId = req.params.id as string;

    const order =await prisma.orders.findFirst({
        where:{ id:orderId },
    })
    
    if (!order) {
        res.status(404).json({ error: "Order not found" })
        return
    }
    
    if (order.status !== "OPEN") {
        res.status(400).json({ error: "Only OPEN orders can be cancelled" })
        return
    } 

    try{
        const remaining_qty = order.quantity - order.filled_qty
        const unloack_margin = (remaining_qty*order.price)/order.leverage

        await prisma.orders.update({
            where:{ id: orderId },
            data: { status: "CLOSED" }
        })

        await prisma.collateral.update({
            where:{userId},
            data:{
                available:{increment: unloack_margin},
                locked:   {decrement: unloack_margin}
            }
        })
        res.status(200).json({message:"order cancelled successfully"})

    }catch(e){
        console.error("cancel_prder error",e)
        res.status(500).json({error:"internal server error" })
    }
    //logic to unlock margins
}   

//remove/exit position

//check balance/get collateral: available && locked

//