import { useEffect, useState } from 'react';
import './ResetPasswordRequest.scss';
import { supabase } from '../../util/supabase';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
export default function ResetRequest(){
    const[user,setUser]=useState({email:""});
    const[error,setError]=useState({});

    const Validation = () => {
        let isValid=true;

        if(!user.email){
            setError((prev)=>({
                ...prev,email:"Email is Required"
            }));
            isValid=false;
        }
        return isValid;
    }

    const RequestLink = async () => {
        if(!Validation()) return;

        const{error}=await supabase.auth.resetPasswordForEmail(user.email,
            {redirectTo:'https://astra-project-cpqc.vercel.app/UpdatePassword'}
        );
        if(error){
            toast(error.message);
        }else{
            toast("Check Your Email for Reset Link..")
        }
    }

    useEffect(()=>{
        function handleClick(e){
            if(e.key==="Enter"){
                RequestLink();
            }
        };
        window.addEventListener("keydown",handleClick);
        return()=>window.removeEventListener("keydown",handleClick);
    },[user])

    function handleOnChange(e){
        const{name,value}=e.target;
        setUser({...user,[name]:value});
        setError({...error,[name]:""})
    }

    return(
        <div className="reset">
            <h1>Reset Password</h1>
            <div className='grid'>
                <div className='email-input'>
                    <label htmlFor='email'>Email: </label>
                    <input type='text' name='email' value={user.email} onChange={(e)=>handleOnChange(e)} className='input-field' />
                </div>
                <p className='error'>{error.email}</p>
                <button onClick={RequestLink} className='request-btn'>Get the Reset Password Link</button>  
                <Link to='/login' className='auth-link'>Go to Log In</Link>
            </div>
        </div>
    )
}