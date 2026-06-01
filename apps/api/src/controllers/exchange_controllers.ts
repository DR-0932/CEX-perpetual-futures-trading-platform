import type { Request,Response } from "express";
import { prisma } from '@cex/db'


type onRamp = {
    userId:string,
    amount:bigint,

}


async function on_ramp(on_ramp_data:onRamp):Promise<void>{
    const {userId,amount} = on_ramp_data

    const cltrl = await prisma.collateral.findFirst({
        where:{userId}
    })
    if(!cltrl){
        throw new Error("Record not found or Unable to access database")
        return
    }
    const new_total = cltrl?.available +amount
    
    await prisma.collateral.create({
        data:{
            userId,
            total:new_total,
            available:amount,
        }
    })

}