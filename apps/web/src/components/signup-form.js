"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignupForm = SignupForm;
const react_1 = require("react");
const navigation_1 = require("next/navigation");
const button_1 = require("@/components/ui/button");
const card_1 = require("@/components/ui/card");
const field_1 = require("@/components/ui/field");
const input_1 = require("@/components/ui/input");
function SignupForm({ ...props }) {
    //states
    const router = (0, navigation_1.useRouter)();
    const [formData, setFormData] = (0, react_1.useState)({
        username: "",
        name: "",
        email: "",
        password: "",
        confirmPassword: ""
    });
    const [error, setError] = (0, react_1.useState)(null);
    const [isLoading, setIsLoading] = (0, react_1.useState)(false);
    //handle Changes 
    function handleChanges(e) {
        const { id, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [id]: value
        }));
    }
    //handle Submit 
    async function handleSubmit(e) {
        e.preventDefault();
        setError(null);
        if (formData.password !== formData.confirmPassword) { //password check
            setError("Passwords do not match");
            return;
        }
        setIsLoading(true); //used in <button type = "submit">
        try {
            const res = await fetch("http://localhost:3000/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: formData.username,
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => null);
                throw new Error(data.message ?? "signup failed");
            }
            router.push("/trade"); //redirect to trade/page.tsx
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        }
        finally {
            setIsLoading(false);
        }
    }
    return (<card_1.Card {...props}>
     
      <card_1.CardHeader>
        <card_1.CardTitle>Create an account</card_1.CardTitle>
        <card_1.CardDescription>
        </card_1.CardDescription>
      </card_1.CardHeader>
      
      <card_1.CardContent>
        <form onSubmit={handleSubmit}>
          <field_1.FieldGroup>
            
            <field_1.Field>
              
              <field_1.FieldLabel htmlFor="username">Username</field_1.FieldLabel>
              
              <input_1.Input id="username" type="text" placeholder="johndoe" value={formData.username} onChange={handleChanges} required/>

              <field_1.FieldDescription>
                This will be your public username.
              </field_1.FieldDescription>
            
            </field_1.Field>            

            <field_1.Field> 
              <field_1.FieldLabel htmlFor="name">Full Name</field_1.FieldLabel>
              
              <input_1.Input id="name" type="text" placeholder="John Doe" value={formData.name} onChange={handleChanges} required/>
            </field_1.Field>
            
            <field_1.Field>
        
              <field_1.FieldLabel htmlFor="email">Email</field_1.FieldLabel>
            
              <input_1.Input id="email" type="email" value={formData.email} onChange={handleChanges} placeholder="m@example.com" required/>
            
              <field_1.FieldDescription>
                We will use this to contact you. We will not share your email
                with anyone else.
              </field_1.FieldDescription>
            
            </field_1.Field>


            <field_1.Field>
            
              <field_1.FieldLabel htmlFor="password">Password</field_1.FieldLabel>
            
              <input_1.Input id="password" type="password" value={formData.password} onChange={handleChanges} required/>
            
              <field_1.FieldDescription>
                Must be at least 8 characters long.
              </field_1.FieldDescription>
            
            </field_1.Field>
            

            <field_1.Field>
              
              <field_1.FieldLabel htmlFor="confirmPassword">
                Confirm Password
              </field_1.FieldLabel>
              
              <input_1.Input id="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChanges} required/>
             
              <field_1.FieldDescription>Please confirm your password.</field_1.FieldDescription>
            
            </field_1.Field>


            <field_1.FieldGroup>
              <field_1.Field>
                {error && (<p className="text-sm text-red-500">{error}</p>)}
            
                <button_1.Button type="submit" disabled={isLoading}>
                  {isLoading ? "Creating..." : "Create Account"}
                </button_1.Button>
                
                <button_1.Button variant="outline" type="button">
                  Sign up with Google
                </button_1.Button>
                
                <field_1.FieldDescription className="px-6 text-center">
                  Already have an account? <a href="/login">Sign in</a>
                </field_1.FieldDescription>
              
              </field_1.Field>
            </field_1.FieldGroup>
          
          </field_1.FieldGroup>
        </form>
      </card_1.CardContent>
    </card_1.Card>);
}
