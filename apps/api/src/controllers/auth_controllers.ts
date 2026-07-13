import type {Request,Response} from "express"
import { prisma } from '@cex/db'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'


export async function signup(req:Request,res:Response):Promise<void>{
    const { username, password, name, email } = req.body;
    
    if (!username || !password || !name || !email) {
        res.status(400).json({ error: "missing fields" })
        return
    }

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
        console.log(e)
        res.status(400).json({e:"user already exists or internal server error"})
    }
}


export async function signin(req:Request,res:Response):Promise<void>{
    const {username,password} = req.body;  //add zod
    if(!username || !password) {
        res.status(400).json({error:"missing fields"})
        return
    }    
    
    try{
        const user = await prisma.user.findUnique({
            where:{username}
        })
        if(!user){
            res.status(401).json({error:"user not found"})
            return
        }
        
        const password_match = bcrypt.compare(password,user?.password)
        if(!password_match){
            res.status(401).json({error:"invalid password or username"})
        }
    
        const token = jwt.sign({user:user.id},process.env.JWT_SECRET!, {expiresIn:"1d"}) //used ! here,correct it
        res.status(200).json({token})
    }catch(e){
        console.error(e)
        res.status(500).json({error:"interval server error"})
    }
}

export async function me(req: Request, res: Response): Promise<void> {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.userId },
            select: { id: true, username: true, email: true, name: true }
        })
        res.json(user)
    } catch (e) {
        res.status(500).json({ error: "internal server error" })
    }
}