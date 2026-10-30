import type { Request,Response } from "express";
import { sendToEngine } from "../utils/brokers.js";
import {cancel_order_schema,create_order_schema} from "@cex/validation"

//get orders
export async function get_orders(req: Request, res: Response): Promise<void> {
    const {id} = req.params;
    if(!id){
        res.status(400).json({error:"OrderId is Required"});
        return;
    }

    try{
        const result = await sendToEngine("get_order",{
            userId: req.userId,
            orderId:id,
        }, req.queue)

        res.status(200).json(result);
    }catch(err){
        res.status(502).json({error:(err as Error).message})
    }
}        

//create order
export async function create_orders(req:Request,res:Response):Promise<void>{
    const parsed = create_order_schema.safeParse(req.body);
    if(!parsed.success){
        res.status(400).json({error:"Incorrect Input"});
        return
    }

    try{
        const result = await sendToEngine("create_order",{
            userId: req.userId,
            ...parsed.data
        }, req.queue )

        res.status(200).json(result);
    }catch(err){
        res.status(502).json({error:(err as Error).message});
    }
}
    


    //cancel order
export async function cancel_order(req: Request,res:Response):Promise<void>{
    const parsed = cancel_order_schema.safeParse(req.body);
    if(!parsed.success){
        res.status(400).json({error:"Incorrect Input"});
        return
    }

    try{
        const result = await sendToEngine("cancel_order",{
            userId: req.userId,
            ...parsed.data // spread operator (Take all properties inside parsed.data and copy them here)
        }, req.queue);
        
        res.status(200).json(result);
    } catch (err) {
        res.status(502).json({error:(err as Error).message});
    }    
}   

