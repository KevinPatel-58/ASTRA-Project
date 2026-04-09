import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./../util/supabase";

export default function Protected({children}){
    const[user,setUser]=useState(null);
    const[loading,setLoading]=useState(true);
    const navigate=useNavigate();

    useEffect(()=>{
        async function checkUser(){
            const{data}=await supabase.auth.getUser();

            if(!data.user){
                navigate("/login");
            }else{
                setUser(data.user);
            }
            
            setLoading(false);
        }
        checkUser();
    },[]);
    if(loading){
        return <p>Please wait...</p>
    }
    return user ? children : null;
}