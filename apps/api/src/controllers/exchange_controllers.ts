import type { Request,Response } from "express";
import { prisma } from '@cex/db'
import { redis } from '@cex/redis'
import { pendingOrders } from "../index.js";
import { v4 as uuid } from 'uuid'
import { Status } from '@cex/db'    

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


export async function get_positions(req: Request, res: Response): Promise<void> {
    const { userId } = req.query
    
    try {
        const positions = await prisma.positions.findMany({
            where: { userId: userId as string, status: "OPEN" }
        })
            res.json(positions.map(p => ({
                ...p,
                entry_price: p.entry_price.toString(),
                quantity: p.quantity.toString(),
                leverage: p.leverage.toString(),
                liquidation_price: p.liquidation_price.toString(),
                initial_margin: p.initial_margin.toString(),
                PnL: p.PnL.toString(),
            })))
        
        } catch (e) {
         console.error("get_positions error:", e)
        res.status(500).json({ error: "internal server error" })
    }
}

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

export async function get_orders(req: Request, res: Response): Promise<void> {
    const { userId, status } = req.query
    try {
        const orders = await prisma.orders.findMany({
            where: {
                user_id: userId as string,
                ...(status ? { status: status as Status } : {})
            },
            orderBy: { created_at: "desc" }
        })
        res.json(orders.map(o => ({
            ...o,
            price:      o.price.toString(),
            quantity:   o.quantity.toString(),
            filled_qty: o.filled_qty.toString(),
            leverage:   o.leverage.toString(),
            margin:     o.margin.toString(),
        })))
    
    } catch (e) {
        console.error("get_orders error:", e)
        res.status(500).json({ error: "internal server error" })
    }
}        

export async function create_orders(req:Request,res:Response):Promise<void>{
    const data = req.body as orderType
    if(!data){
        res.status(404).json({error:"no data recieved"})
        return
    }
    
    try{
        const {userId,symbol,market_id,price,leverage,side,type,quantity} =data
        console.log("request body:", req.body)

        const required_margin = (price*quantity)/leverage
        const orderId = uuid();

        await prisma.collateral.update({
            where:{userId},
            data:{
                available: { decrement: BigInt(required_margin)},
                locked:    { increment: BigInt(required_margin)}
            }
        })
        
        await redis.xadd(
            "orders",    "*",
            "id",        String(orderId),            
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
            new Promise((_,reject)=>setTimeout(()=>reject(new Error("timeout")),5000))
        ])
        res.json(result)
    
    }catch(e){
        console.error("create orders error:",e);
        res.status(500).json({error:"internal server error"});
    }
}
    
    //cancel order
export async function cancel_order(req: Request,res:Response):Promise<void>{
    const userId = req.userId 
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
        const unlock_margin = (remaining_qty*order.price)/order.leverage

        await prisma.orders.update({
            where:{ id: orderId },
            data: { status: "CLOSED" }
        })

        await prisma.collateral.update({
            where:{userId},
            data:{
                available:{increment: unlock_margin},
                locked:   {decrement: unlock_margin}
            }
        })
        res.status(200).json({message:"order cancelled successfully"})

    }catch(e){
        console.error("cancel_prder error",e)
        res.status(500).json({error:"internal server error" })
    }
   
}   

export async function get_collateral(req: Request, res: Response): Promise<void> {
    const { userId } = req.query
    try {
        const collateral = await prisma.collateral.findUnique({
            where: { userId: userId as string }
        })
        if (!collateral) {
            res.json({ total: "0", available: "0", locked: "0" })
            return
        }
        res.json({
            total: collateral.total.toString(),
            available: collateral.available.toString(),
            locked: collateral.locked?.toString() || "0"
        })
    } catch (e) {
        res.status(500).json({ error: "internal server error" })
    }
}
