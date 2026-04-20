import { useEffect, useState } from 'react';
import '../Sign up Page/Signup.scss';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from "../../util/supabase";
import { toast } from 'react-toastify';
import { IoEyeOffOutline, IoEyeOutline } from 'react-icons/io5';

export default function Login(){
    const[user,setUser]=useState({email:"",password:""});
    const[error,setError]=useState({});
    const [showPassword, setShowPassword] = useState(false);
    const navigate=useNavigate();

    const Validation = () => {
        let isValid=true;
        if(!user.email){
            setError((prev)=>({
                ...prev,email:"Enter Email"
            }));
            isValid=false;
        }

        if(!user.password){
            setError((prev)=>({
                ...prev,password:"Enter Password"
            }));
            isValid=false;
        }

        return isValid;
    }

    const login = async () => {
        if (!Validation()) return;

        const{data,error}=await supabase.auth.signInWithPassword({
            email:user.email,
            password:user.password
        });
        if(error){
            toast(error.message);
            return;
        }
        try {
            
            const playerId = window.OneSignal.User.PushSubscription.id;
            
            if (playerId) {
                
                await supabase
                    .from('users')
                    .update({ onesignal_player_id: playerId })
                    .eq('id', data.user.id);
            }
        } catch (e) {
            console.log('nope');
            console.error("Could not sync player_id:", e);
        }
            navigate("/taskMenu");
    }

    useEffect(()=>{
        function handleClick(e){
            if(e.key==="Enter"){
                login();
            }
        };
        window.addEventListener("keydown",handleClick);
        return()=>window.removeEventListener("keydown",handleClick);
    },[])

    function handleOnChange(e){
        const{name,value}=e.target;
        setUser({...user,[name]:value});
        setError({...error,[name]:""})
    }

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return(
        <div className='app'>
           
            <h1>Login</h1>
            <br />
            <div className='grid'>
                <div className='email-input'>
                    <label htmlFor='email'>Email: </label>
                    <input type='text' name='email' value={user.email} onChange={(e)=>handleOnChange(e)} className='input-field' />
                </div>
                <p className='error'>{error.email}</p>
                
                <div className='password-input'>
                    <label htmlFor='password'>Password: </label>
                    <div className='password-wrapper'>
                    <input type={showPassword ? 'text' : 'password'} name='password' value={user.password} onChange={(e)=>handleOnChange(e)} className='input-field' />
                    <span onClick={togglePasswordVisibility} className='password-toggle-icon'>
                        {showPassword ? <IoEyeOffOutline size={20} /> : <IoEyeOutline size={20} />}
                    </span>
                    </div>
                </div>
                <p className='error'>{error.password}</p>
                
                <button className='btn' onClick={login}>Log In</button>
                
                <Link to='/ResetPasswordRequest' className='auth-text-link'>Forget Password?</Link>
                
                <p className='auth-text'>Not an User? Click to Sign Up!!</p>
                <Link to='/' className='auth-link'>Sign Up</Link>
            </div>
        </div>
    )
}