"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"

import { Input } from "@/components/ui/input"





export function SignupForm({ ...props }: React.ComponentProps<typeof Card>) {
  //states
  const router = useRouter();
  
  const [formData ,setFormData]= useState({
    username:"",
    name:"",
    email:"",
    password:"",
    confirmPassword:""})

  const [error,setError] = useState<string | null>(null)
  const [isLoading,setIsLoading] = useState(false)


  //handle Changes 
  function handleChanges(e:React.ChangeEvent<HTMLInputElement>){
    const {id,value} = e.target
    setFormData((prev)=>(
      {
        ...prev,
        [id]:value
      }
    ))
  }

  //handle Submit 
  async function handleSubmit(e:React.SubmitEvent<HTMLFormElement>){
    e.preventDefault()
    setError(null)
    
    
    if(formData.password !== formData.confirmPassword){ //password check
      setError("Passwords do not match")
      return
    }
    
    setIsLoading(true) //used in <button type = "submit">
    
    try{
      const res = await fetch("http://localhost:3000/auth/signup",{
        method:"POST",
        
        headers:{"Content-Type":"application/json"},
        
        body:JSON.stringify({
          username:formData.username,
          name:formData.name,
          email:formData.email,
          password:formData.password,
        }),
      })

      if(!res.ok){
        const data = await res.json().catch(()=>null)
        throw new Error(data.message ?? "signup failed")
      }
      
      
      router.push("/trade") //redirect to trade/page.tsx
   
    }catch(err){
      setError(err instanceof Error ? err.message:"Something went wrong")
   
    } finally {
      setIsLoading(false)
    }

  }

  return (
    <Card {...props}>
     
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            
            <Field>
              
              <FieldLabel htmlFor="username">Username</FieldLabel>
              
              <Input
                id="username"
                type="text"
                placeholder="johndoe"
                value={formData.username}
                onChange={handleChanges}
                required
              />

              <FieldDescription>
                This will be your public username.
              </FieldDescription>
            
            </Field>            

            <Field> 
              <FieldLabel htmlFor="name">Full Name</FieldLabel>
              
              <Input 
                id="name" 
                type="text" 
                placeholder="John Doe"
                value={formData.name} 
                onChange={handleChanges}
                required 
              />
            </Field>
            
            <Field>
        
              <FieldLabel htmlFor="email">Email</FieldLabel>
            
              <Input
                id="email"
                type="email"
                value={formData.email} 
                onChange={handleChanges}                
                placeholder="m@example.com"
                required
              />
            
              <FieldDescription>
                We will use this to contact you. We will not share your email
                with anyone else.
              </FieldDescription>
            
            </Field>


            <Field>
            
              <FieldLabel htmlFor="password">Password</FieldLabel>
            
              <Input 
              id="password" 
              type="password" 
              value={formData.password} 
              onChange={handleChanges}              
              required />
            
              <FieldDescription>
                Must be at least 8 characters long.
              </FieldDescription>
            
            </Field>
            

            <Field>
              
              <FieldLabel htmlFor="confirmPassword">
                Confirm Password
              </FieldLabel>
              
              <Input 
                id="confirmPassword" 
                type="password"
                value={formData.confirmPassword} 
                onChange={handleChanges}
                required 
               />
             
              <FieldDescription>Please confirm your password.</FieldDescription>
            
            </Field>


            <FieldGroup>
              <Field>
                {error && (
                <p className="text-sm text-red-500">{error}</p>
                 )}
            
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Creating..." : "Create Account"}
                </Button>
                
                <Button variant="outline" type="button">
                  Sign up with Google
                </Button>
                
                <FieldDescription className="px-6 text-center">
                  Already have an account? <a href="/login">Sign in</a>
                </FieldDescription>
              
              </Field>
            </FieldGroup>
          
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
