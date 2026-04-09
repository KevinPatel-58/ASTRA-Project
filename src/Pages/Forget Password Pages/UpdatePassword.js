import { useEffect, useState } from 'react'
import './ResetPasswordRequest.scss'
import { supabase } from '../../util/supabase';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
export default function UpdatePassword(){
    const[password,setPassword]=useState("");
    const[error,setError]=useState({});
    const[setLoading]=useState(false);
    // const[allow,setAllow]=useState(false);
    const navigate=useNavigate();

    const Validation = () => {
        let isValid=true;

        if(!password){
            setError((prev)=>({
                ...prev,password:"Password is Required"
            }));
            isValid=false;
        }
        return isValid;
    }

    const updatePassword = async () => {
        
        if (!Validation()) return;
        setLoading(true);
        
        const{error}=await supabase.auth.updateUser({password});
        if(error){
            toast(error.message);
        }else{
            toast("Password Updated Successfully..");
            await supabase.auth.signOut();
            setLoading(false);
            navigate('/login');
        }
    } 


    // useEffect(()=>{
    //     async function checkSession(){
    //         const{data:{session}}=await supabase.auth.getSession();

    //         if(session && session.user){
    //             setAllow(true);
    //         }else{
    //             navigate('/Home');
    //         }
    //     }
    //     checkSession();
    // },[navigate]);

    useEffect(()=>{
        function handleClick(e){
            if(e.key==="Enter"){
                updatePassword();
            }
        };
        window.addEventListener("keydown",handleClick);
        return()=>window.removeEventListener("keydown",handleClick)
    },[password])

    function handleOnChange(e){
        setPassword(e.target.value);
        setError({...error,password:""});
    }

    // if(!allow){
    //     return <p>Loading...</p>
    // }

    return(
        <div className="reset">
            <h1>Set New Password</h1>
            <div className='grid'>
                <div className='password-input'>
                    <label htmlFor='password'>Password: </label>
                    <input type='password' name='password' value={password} onChange={(e)=>handleOnChange(e)} className='input-field' />
                </div>
                <p className='error'>{error.password}</p>
                <button className='request-btn' onClick={updatePassword}>Update Password</button>
            </div>
        </div>
    )
}