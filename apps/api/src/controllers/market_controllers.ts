import type { Response,Request } from "express";
import { sendToEngine } from "../utils/brokers.js";

export async function get_depth(req:Request, res:Response):Promise<void>{
    const market = req.params.symbol;

    if(typeof market !== "string" || market.length ===0){
        res.status(400).json({error:"symbol path params req"});
        return
    }

    try{
        const result = await sendToEngine("get_depth",{market},req.queue);
        if(result && typeof result  === "object" && "error" in result){
            res.status(400).json(result);
            return;
        }
        res.json(result);
    }catch(err){
        res.status(502).json({error:(err as Error).message});
        return;
    }
}

