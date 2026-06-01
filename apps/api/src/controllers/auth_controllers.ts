import type {Request,Response} from "express"
import { prisma } from '@cex/db'
import bcrypt from 'bcrypt'


const jwt_secret = "topSecret"



export async function signup(req:Request,res:Response):Promise<void>{
    const parsedBody = req.body;  //add zod
    if(!parsedBody.success) {
        res.status(400).json({error:parsedBody.error})
        return
    }

    const {username,password,name,email} = parsedBody.data; 

    const hashed_password = await bcrypt.hash(password,10)
    try{

        const user = await prisma.user.create({
            data:{username,
                password:hashed_password,
                name,
                email   
            }
            })

        res.status(201).json({
            message:"user registered successfully",
            userId:user.id
        })
    }catch(e){
        res.status(400).json({e:"user already exists or internal server error"})
    }
}

