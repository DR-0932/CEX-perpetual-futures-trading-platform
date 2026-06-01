import type {Request,Response} from "express"
import { prisma } from '@cex/db'

export async function signup(req:Request,res:Response):Promise<void>{
    const parsedBody = req.body;  //add zod
    if(!parsedBody.success) {
        res.status(400).json({error:parsedBody.error})
    }

    const {username,password,name,email} = parsedBody.data; 

    const user_data = prisma
}

