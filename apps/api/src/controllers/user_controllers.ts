import type { Response, Request } from "express";
import { sendToEngine } from "../utils/brokers.js";


export async function get__all_positions(req: Request, res: Response): Promise<void> {    
    try {
        const result = await sendToEngine("get_user_position",{
            userId:req.userId
        },req.queue);

        if (result && typeof result === "object" && "error" in result){
            res.status(400).json(result);
            return;
        }

        res.json(result);
    }catch(err){
        res.status(502).json({error:(err as Error).message})
    }
}

export async function on_ramp(req:Request,res:Response):Promise<void>{
    const {asset,amount} = req.body;
    
    if(typeof asset !== "string" || typeof amount !== "number"){
        res.status(400).json({error:"invalid asset or amount"})
        return;
    }
    
    if(amount<=0){
        res.status(400).json({error:"amount must be positivie"})
        return
    }
    
    try{
       const result = await sendToEngine("deposit", {
        userId: req.userId,
        asset,
        amount
       }, req.queue)
       
       if(result && typeof result ==="object" && "error" in result){
            res.status(400).json(result);
            return
       }

       res.json(result);
       
    }catch(err){
        res.status(502).json({error: (err as Error).message})
    }
    
}

export async function get_balance(req: Request, res: Response): Promise<void> {
    try {
        const result = await sendToEngine("get_user_balance", {
            userId: req.userId,
        }, req.queue);

        if (result && typeof result === "object" && "error" in result) {
            res.status(400).json(result);
            return;
        }
    } catch (e) {
        res.status(500).json({ error: "internal server error" })
    }
}

export async function get_single_position(req:Request, res:Response):Promise<void>{
    const {market} = req.params;

    try{
        const result = await sendToEngine("get_position",{
            userId: req.userId,
            market
        }, req.queue);

        if(result && typeof result === "object" && "error" in result){
            res.status(400).json(result);
            return;
        }
        res.json(result);
    }catch(err){
        res.status(502).json({error:(err as Error).message})
    }
}