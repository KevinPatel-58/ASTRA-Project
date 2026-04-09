import { useEffect, useState } from "react";
import { supabase } from "../util/supabase";

export default function useProfile(){
    const[profile,setProfile]=useState(null);
    const[loading,setLoading]=useState(true);

    useEffect(()=>{
        async function fetchUser(){
            const{data:userData}=await supabase.auth.getUser();
            if(!userData.user) return;

            const userId=userData.user.id;

            const{data,error}=await supabase
                .from('users')
                .select('*')
                .eq("id",userId)
                .single();

            if(!error){
                setProfile({
                    ...data,email:userData.user.email
                });
            }

            setLoading(false);
            
        }
        fetchUser();
    },[])
    return {profile,setProfile,loading};
}