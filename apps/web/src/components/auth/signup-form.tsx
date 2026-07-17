import {useState} from "react";
import {useRouter} from "next/navigation";
import {signup_schema} from "@cex/validation"

export function signup_form(){
    const router = useRouter();
    const [email,setEmail] = useState("");
    const [name,setName] = useState("");
    const [username,setUsername] = useState("");
    const [password,setPassword] = useState("");
    const [message,setMessage] = useState("");
    
    async function handle_submit(e:React.SubmitEvent<HTMLFormElement>){
        e.preventDefault();
        setMessage("");
        
        const result = signup_schema.safeParse({name,email,username,password});
        if(!result.success){
            setMessage(result.error.issues[0].message);
            return;
        }

        const res = await fetch("http://localhost3001/auth/singup",{
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body:JSON.stringify(result.data),
        });

        const data = await res.json();

        if(!res.ok){
            setMessage(data.message || "Singup Failed");
            return
        }
        setMessage("signup successful")
    }
    return(
    <>
        <form onSubmit={handle_submit}>
            <input 
                placeholder="name"
                value={name}
                onChange={(e)=>setName(e.target.value)} 
            />
            <input 
                placeholder="username"
                value={name}
                onChange={(e)=>setUsername(e.target.value)} 
            />
            <input 
                placeholder="Email"
                value={name}
                onChange={(e)=>setEmail(e.target.value)} 
            />
            <input 
                placeholder="password"
                value={name}
                onChange={(e)=>setPassword(e.target.value)} 
            />

            <button type="submit">Sign Up</button>
            {message && <p>{message}</p>}
        </form>
    </>
    )
    
}