import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./../util/supabase";

export default function Auth({children}){
    const[loading,setLoading]=useState(true);
    const navigate=useNavigate();

    useEffect(()=>{
        async function checkUser() {
            const{data}=await supabase.auth.getUser();
            if(data.user){
                navigate('/Home');
            }
            
            setLoading(false);
        }
        checkUser();
    },[]);
    // if(loading){
    //     return <p>Please Wait....</p>
    // }
    return children;
}