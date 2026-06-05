import { Request,Response,NextFunction } from "express";
import jwt from 'jsonwebtoken'

export function authMiddleware(req:Request,res:Response,next:NextFunction){
    const auth_header = req.headers.authorization;
    if(!auth_header){
        res.status(401).json({error:"Unauthorized"})
        return
    }

    const token = auth_header.split(' ')[1];

    try{
        const og_payload = jwt.verify(token,process.env.JWT_SECRET!) as {
            userId:string
        }
        
        req.userId = og_payload.userId;
        next()
    }catch(e){
        res.status(401).json({error:"invalid credentials"})
    }
    
}