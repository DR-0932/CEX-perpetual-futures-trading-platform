import type { Request,Response } from "express";
import { prisma } from '@cex/db'
import { redis } from '@cex/redis'


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
export async function on_ramp(on_ramp_data:onRamp,res:Response):Promise<void>{
    const {userId,amount} = on_ramp_data

    const cltrl = await prisma.collateral.findFirst({
        where:{userId}
    })
    if(!cltrl){
        res.status(400).json({error:"Unable to reach database"})
        return
    }
    const new_total = cltrl?.available +amount
    try{

        await prisma.collateral.create({
            data:{
                userId,
                total:new_total,
                available:amount,
            }
        })
    }catch(error){
        res.status(400).json({error:"unable to add balance"})
    }

}

/**----creating a new order---- */
export async function create_orders(order:orderType,res:Response):Promise<void>{
    const data = order
    if(!data){
        res.status(404).json({error:"no data recieved"})
    }
    const {userId,symbol,market_id,price,leverage,side,type,quantity} =data

    /**----calculating margin---- */
    const required_margin = (price*quantity)/leverage
    
    /**----updating amount to locked---- */
    await prisma.collateral.update({
        where:{id:userId},
        data:{
            available: { decrement: BigInt(required_margin)},
            locked:    { increment: BigInt(required_margin)}
        }
    })
    
    /**----db call creating order---- */
    const post_order = await prisma.orders.create({
        data:{
            user_id:userId,
            price:BigInt(price),
            market_id,
            symbol,
            margin:required_margin,
            side,
            type,
            quantity:BigInt(quantity),
            created_at:new Date(),
            leverage,
            status:"OPEN",
            filled_qty:0n,
        }
    })

    /**----redis stream: adding limit order ---- */
    if(type==="LIMIT"){
        //redis calll
        await redis.xadd(
            "orders",    "*",
            "action",    "NEW_LIMIT_ORDER",   
            
            "userId",    String(userId),
            
            "margin",    String(required_margin),
            "leverage",  String(leverage),
            "side",      String(side),
            "price",     String(price),
            "quantity",  String(quantity),
            
            "createdAt", String(order.createdAt.getTime()),
        )
    }


    /**----posting market order and geting market price---- */
    if(type==="MARKET"){
            await redis.xadd(
            "orders",    "*",
            "action",    "NEW_MARKET_ORDER",   
            
            "userId",    String(userId),
            
            "margin",    String(required_margin),
            "leverage",  String(leverage),
            "side",      String(side),
            "price",     String(price),
            "quantity",  String(quantity),
            
            "createdAt", String(order.createdAt.getTime()),
        )
    }
    
}

//cancel order
export async function cancel_order(req: Request,res:Response):Promise<void>{
    const userId = req.userId //will come from authmiddleware once i add it

    const order =await prisma.orders.findFirst({
        where:{id:userId},
    })
    
    if (!order) {
        res.status(404).json({ error: "Order not found" })
        return
    }
    
    if (order.status !== "OPEN") {
        res.status(400).json({ error: "Only OPEN orders can be cancelled" })
        return
    } 

    /**db call to set order as closed */
    if( order.filled_qty === 0n ){
        try{
            await prisma.orders.update({
                where:{id:userId},
                data:{status:"CLOSED"}
            })
            res.status(200).json({message:"order closed successfully"})
        }catch(e){
            res.status(400).json({error:"order cancelled"})
        }
    }else{
        /**db call is order is partially_filled */
        const remaining_qty = order.quantity-order.filled_qty;
        const update_order = await prisma.orders.update({
            where:{id:userId},
            data:{
                status:"PARTIALLY_FILLED",
                quantity:remaining_qty
            }
        })
        if(!update_order){
            res.status(400).json({error:"could not cancel order try again"})
        }

        /**unlocking the locked margin according to qty yet to be filled */
        const unlock_margin = (remaining_qty*order.price)/order.leverage
        
        
    }


    
    //logic to unlock margins
}   

//remove/exit position

//check balance/get collateral: available && locked

//