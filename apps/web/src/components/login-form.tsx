"use client"

import { cn } from "@/lib/utils"
import { useState } from "react";
import { login_schema } from "@cex/validation";
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
   const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");

    const result = login_schema.safeParse({ identifier, password });

    if (!result.success) {
      setMessage(result.error.issues[0].message);
      return;
    }

    const res = await fetch("http://localhost:3001/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result.data),
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data.message || "Login failed");
      return;
    }

    setMessage("Login successful!");
  }




  return (
    <form className={cn("flex flex-col gap-6", className)}
     onSubmit={handleSubmit}
    {...props}>
    
      <FieldGroup>
        
        <div className="flex flex-col items-center gap-1 text-center">
        
          <h1 className="text-2xl font-bold">Login to your account</h1>
    
          <p className="text-sm text-balance text-muted-foreground">
            Enter your email below to login to your account
          </p>
        
        </div>
        
        <Field>
          <FieldLabel htmlFor="identifier">Email</FieldLabel>
           <Input
            id="identifier"
            type="text"
            placeholder="m@example.com"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
          />
        </Field>
    
        <Field>
        
          <div className="flex items-center">
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <a  href="#" className="ml-auto text-sm underline-offset-4 hover:underline">
              Forgot your password?
            </a>
          </div>  
        
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        
        </Field>
       
       
        {message && (
          <p className="text-sm text-center text-destructive">{message}</p>
        )}
       
        <Field>
          <Button type="submit">Login</Button>
        </Field>
        
        <FieldSeparator>Or continue with</FieldSeparator>
        
        <Field> 
          <Button variant="outline" type="button">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
                    fill="currentColor"/>
            </svg>
            Login with GitHub
          </Button>
        
          <FieldDescription className="text-center">
            Don&apos;t have an account?{" "}
            <a href="#" className="underline underline-offset-4">
              Sign up
            </a>
          </FieldDescription>
        
        </Field>
      
      </FieldGroup>
    </form>
  )
}
