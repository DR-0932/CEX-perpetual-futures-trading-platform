import type {Request,Response} from "express"
import { prisma } from '@cex/db'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { signup_schema,login_schema } from "@cex/validation"

export async function signup(req:Request,res:Response):Promise<void>{
    const parsedBody = signup_schema.safeParse(req.body);
    
    if(!parsedBody.success){
        res.status(400).json({error:"Validation Error"})
        // console.log(parsedBody.error)
        return;
    }

    const {username,password,email,name} = parsedBody.data
    try{
        const hashed_password = await bcrypt.hash(password,10)
        const user = await prisma.user.create({
            data:{
                name,
                username,
                password:hashed_password,
                email   
            }
        })
        res.status(201).json({
            message:"user registered successfully",
            userId:user.id
        })
    }catch(e){
        console.log(e)
        res.status(400).json({e:"user already exists or internal server error"})
    }
}


export async function login(req:Request,res:Response):Promise<void>{
    const parsedBody = login_schema.safeParse(req.body);  //add zod
   
    if(!parsedBody.success){
        res.status(400).json({error:"Validation Error"})
        // console.log(parsedBody.error)
        return;
    } 
    const {identifier , password} = parsedBody.data
    try{
        const user = await prisma.user.findFirst({
                where: {
                OR: [
                    { username: identifier },
                    { email: identifier }
                ]
            }
        });

        if(!user){
            res.status(401).json({error:"user not found"})
            return;
        }
        
        const password_match =await bcrypt.compare( password, user?.password )
        if(!password_match){
            res.status(401).json({ error:"invalid password or username/email" })
            return
        }
    
        const token = jwt.sign(
            { user:user.id },
            process.env.JWT_SECRET!, //used ! here,need to correct it
            { expiresIn:"1d" }
        ) 
        
        res.status(200).json({ token })
    
    }catch(e){
        console.error(e)
        res.status(500).json({ error:"interval server error" })
    }
}

export async function me(req: Request, res: Response): Promise<void> {
    try {
        console.log("req.userId:", req.userId);
        const user = await prisma.user.findUnique({
            where: { id: req.userId },
            select: { id: true, username: true, email: true, name: true }
        })
        res.json(user)
   
    } catch (e) {
        res.status(500).json({ error: "internal server error",e })
    }
}