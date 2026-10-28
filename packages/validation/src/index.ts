import {z} from 'zod';

export const base_schema = z.object({
    email:z.string().email("Invalid email address"),
    username:z.string().min(3,"Username must have atleast 3 characters").max(40),
    password:z.string().min(6,"Password must be atleast 6 characters").max(30),
})

export const login_schema = z.object({
    password:base_schema.shape.password,
    identifier:z.union([
        base_schema.shape.username,
        base_schema.shape.email
    ])
})

export const signup_schema = base_schema.extend({
    name:z.string().min(3,"Name must be atleast 3 characters long"),
    //age
    //photoId proof
})

export const createOrderSchema = z.object({
    market: z.string().min(1),
    side: z.enum(["buy","sell"]),
    price: z.number().positive(),
    quantity: z.number().positive(),
    orderType: z.enum(["limit","market"]).default("limit"),
    leverage: z.number().positive().max(125).optional().default(1),
    reduceOnly: z.boolean().optional().default(false),
});

export const cancelOrderSchema = z.object({
    market: z.string().min(1),
    orderId: z.string().min(1),
});


export type loginInput = z.infer<typeof login_schema>
export type signupInput  = z.infer<typeof signup_schema>

export type createOrderSchema = z.infer<typeof createOrderSchema>
export type cancelOrderSchema = z.infer<typeof cancelOrderSchema>