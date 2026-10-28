import type { Response, Request } from "express";



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