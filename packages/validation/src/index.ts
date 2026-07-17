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

export type loginInput = z.infer<typeof login_schema>
export type signupInput  = z.infer<typeof signup_schema>