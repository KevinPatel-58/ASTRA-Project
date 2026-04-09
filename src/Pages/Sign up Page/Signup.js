import './Signup.scss';
import { useEffect, useState } from 'react';
import { supabase } from "../../util/supabase";
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

function App() {
  const[user,setUser]=useState({name:"",email:"",password:"",assistant_name:"",voice:""});
  const[error,setError]=useState({});
  const navigate=useNavigate();
  // const[data,setData]=useState([]);
  
  const Validation = () => {
    let isValid=true;
    if(!user.name){
      setError((prev)=>(
        {...prev, name:"Enter Name..."}
      ));
      isValid=false;
    }

    if(!user.email){
      setError((prev)=>({
        ...prev,email:"Please Enter Email.."
      }));
      isValid=false;
      // const isDuplicate=data.some((u)=>u.email===user.email);
      // if(isDuplicate){
      //   setError((prev)=>({
      //     ...prev,email:"Email Exist!!"
      //   }));
      //   isValid=false;
      // }
    }

    if(!user.password){
      setError((prev)=>({
        ...prev,password:"Please Enter Password"
      }));
      isValid=false;
    }
    return isValid;
  }

  const signup = async () => {
    if (!Validation()) return;

    const {data,error}=await supabase.auth.signUp({
      email:user.email,
      password:user.password,
    });

    if(error){
      toast(error.message);
      return;
    }
    const userId=data.user;
    const{error:insertError}=await supabase
      .from('users')
      .insert([
        {
          id:userId.id,
          name:user.name,
          assistant_name:user.assistant_name,
          voice:user.voice,
        }]
      );

      if(insertError){
        toast(insertError.message);
      }else{
        toast("SignUp successfull!!");
        navigate("/login");
        setUser({name:"",email:"",password:"",assistant_name:"",voice:""});
      }
  }

   useEffect(()=>{
    function handleClick(e){
      if(e.key==="Enter"){
        signup();
      }
    };
    window.addEventListener("keydown",handleClick);
    return()=>window.removeEventListener("keydown",handleClick);
  })
 

  function handleOnChange(e){
    const{name,value}=e.target;
    setUser({...user,[name]:value});
    setError({...error,[name]:""})
  }
  return (
    <div className="app">
      <h1>Sign Up</h1>
      <div className='grid'>

        <div className='name-input'>
          <label htmlFor='name'>Name: </label>
          <input type='text' name='name' value={user.name} onChange={(e)=>handleOnChange(e)} className='input-field'></input>
        </div>
        <p className='error'>{error.name}</p>

        <div className='email-input'>
          <label htmlFor='email'>Email: </label>
          <input type='text' name='email' value={user.email} onChange={(e)=>handleOnChange(e)} className='input-field' />
        </div>
        <p className='error'>{error.email}</p>
        
        <div className='password-input'>
          <label htmlFor='password'>Password: </label>
          <input type='password' name='password' value={user.password} onChange={(e)=>handleOnChange(e)} className='input-field' />
        </div>
        <p className='error'>{error.password}</p>
        
        <div className='assistant-input'>
          <label htmlFor='assistant'>Assitant Name: </label>
          <input type='text' name='assistant_name' value={user.assistant_name} onChange={(e)=>handleOnChange(e)} className='input-field' />
        </div>
        <p className='error'>{error.assistant}</p>
      
        <div className='input-selector'>
          <label htmlFor='voice'>Assistant Voice: </label>
          <select name='voice' value={user.voice} onChange={(e)=>handleOnChange(e)} className='selector-field'>
            <option value="">Select Voice</option>
            <option value='male'>Male</option>
            <option value='female'>Female</option>
          </select>
        </div>
      
        <button className='btn' onClick={signup}>Sign Up</button>
      
        <p className='auth-text'>Already an User? Click to Log In!!</p>
      
        <Link to='/login' className='auth-link'>Log In</Link>
      </div>
    </div>
  );
}

export default App;
