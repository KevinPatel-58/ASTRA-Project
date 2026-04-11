import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom";
import useProfile from "../../Hook/useProfile";
import updateProfile from "../../Services/updateProfile";
import './UpdateUser.scss';
import { toast} from "react-toastify";
import Select from "react-select";

export default function Update(){
    const[user,setUser]=useState({name:"",email:"",assistant_name:"",voice:""});
    const[error,setError]=useState({});
    const{profile}=useProfile();
    const navigate=useNavigate();
    const voiceOptions = [
        { value: "male", label: "Male" },
        { value: "female", label: "Female" }
    ];

    const Validation = () => {
        let isValid=true;

        if(!user.name){
            setError((prev)=>({
                ...prev,name:<p>&#9888; Name is Required</p>
            }));
            isValid=false;
        }
        if(!user.email){
            setError((prev)=>({
                ...prev,email:<p>&#9888; Email is Required</p>
            }));
            isValid=false;
        }
        if(!user.assistant_name){
            setError((prev)=>({
                ...prev,assistant_name:<p>&#9888; Assistant Name is Required</p>
            }));
            isValid=false;
        }
        if(!user.voice){
            setError((prev)=>({
                ...prev,voice:<p>&#9888; Assistant Voice is Required</p>
            }));
            isValid=false;
        }
        return isValid;
    }

    const update = async () => {
        if(!Validation()) return;

        const result=await updateProfile(user);

        if(result.error){
            toast (result.error.message);
            return;
        }
        toast("Profile Updated Successfully!!");
        navigate('/Profile');
    }

    useEffect(()=>{
        if(profile){
            setUser({
                name: profile.name || "",
                email: profile.email || "",
                assistant_name: profile.assistant_name || "",
                voice: ""
            });
        }

        function handleClick(e){
            if(e.key==="Enter"){
                update();
            }
        };
        window.addEventListener("keydown",handleClick);
        return()=>window.removeEventListener("keydown",handleClick);
    },[profile])

    function handleOnChange(e){
        const{name,value}=e.target;
        setUser({...user,[name]:value});
        setError({...error,[name]:""});
    }
    return(
        <div className="form">
            <h1>Update User Info</h1>
            <div className="grid">
                <div className="name-input">
                    <label htmlFor="name">Name:</label>
                    <input type="text" name="name" value={user.name} onChange={(e)=>handleOnChange(e)} className="input-field" />
                </div>
                <p className="error">{error.name}</p>
                
                <div className="email-input">
                    <label htmlFor="email">Email: </label>
                    <input type="text" name="email" value={user.email} onChange={(e)=>handleOnChange(e)} className="input-field" />
                </div>
                <p className="error">{error.email}</p>
                
                <div className="assistant-input">
                    <label htmlFor="assistant_name">Assistant Name: </label>
                    <input type="text" name="assistant_name" value={user.assistant_name} onChange={(e)=>handleOnChange(e)} className="input-field" />
                </div>
                <p className="error">{error.assistant_name}</p>
                
                <div className="input-selector">
                    <label htmlFor="voice">Assistant Voice: </label>
                    <Select
                        name="voice"
                        className="selector-field"
                        classNamePrefix="update-select"
                        options={voiceOptions}
                        placeholder="Select Voice"
                        value={voiceOptions.find(opt => opt.value === user.voice)}
                        onChange={(opt) =>
                            setUser({ ...user, voice: opt.value })
                        }
                    />
                </div>
                <p className="error">{error.voice}</p>
                
                <button className="update-btn" onClick={update}>Update</button>
                 
                <Link to='/profile' className="auth-link">Go to Profile</Link>
            </div>
        </div>
    )
}