import { useEffect, useState } from "react"
import { supabase } from "../../util/supabase";
import { useNavigate } from "react-router-dom";
import { FaPenToSquare, FaRegCircleUser } from "react-icons/fa6";
import './Profile.scss';
import { toast } from "react-toastify";
import ProfileSkeleton from "../../Components/ProfileSkeleton";
//import {ProfileSkeleton} from '../../Components/ProfileSkeleton';

export default function Profile(){
    const[profile,setProfile]=useState(null);
    const[email,setEmail]=useState("");
    const navigate=useNavigate();
    const[preview,setPreview]=useState(false);

    const getData = async () => {
            const{data:userData}=await supabase.auth.getUser();
            setEmail(userData.user.email);

            const userId=userData.user.id;
            const{data,error}=await supabase
                .from("users")
                .select("*")
                .eq("id",userId)
                .single();
                
            if(error){
                toast(error.message)
            }
            setProfile(data);
            //console.log(profile);
    };

    useEffect(()=>{
        getData();
        //console.log({profile});
    },[]);

    async function logout() {
        await supabase.auth.signOut();
        navigate("/login");
    }

    const uploadImage = async (event) => {
      const File=event.target.files[0];
      console.log("File===",File)
      if(!File) return;
      try{
          const fileName=`private/${profile.id}/${File.name}`;
          const{error}=await supabase
          .storage
          .from('avatar')
          .upload(fileName,File,{upsert:true});
    
          if(error){
            toast(error.message);
            return;
          }
    
          const{data:urlData}= supabase
          .storage
          .from('avatar')
          .getPublicUrl(fileName);
    
          if (!urlData.publicUrl) return toast("Could not get public URL");
    
          const imageUrl=urlData.publicUrl;
    
          const{error:dbError}= await supabase
          .from('users')
          .update({avatar_url:imageUrl})
          .eq('id',profile.id);
    
          if (dbError) return toast("DB update failed: " + dbError.message);
    
          setProfile((prev)=>({...prev,avatar_url:imageUrl}));
          
          toast("image added!!");
        } catch (err) {
              toast("Unexpected error: " + err.message);
      }
        }
    
    function update(){
      navigate('/updateUser');
    }

    if(!profile){
        return <ProfileSkeleton />
        //<p>Loading...</p>
    }
    return (
      <div className="profile">
        <div className="header">
          <div className="profiler">
            
            <label htmlFor="img" className="p-wrapper">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="profile" className="photo" onClick={()=>setPreview(true)} />
              ) : (
                <FaRegCircleUser className="user" />
              )}
              <FaPenToSquare className="edit-icon"></FaPenToSquare>
            </label>

            <input
              type="file"
              id="img"
              style={{ display: "none" }}
              onChange={uploadImage}
            />
          </div>

          {
            preview && (
              <div className="image" onClick={()=>setPreview(false)}>
                <img src={profile.avatar_url} alt="user-image" className="imageview" />
              </div>
            )
          }

          <h1>User Profile</h1>
          <button className="outbtn" onClick={logout}>
            Log Out
          </button>
        </div>
        <div className="userdetail">
          <h3>Name: {profile.name}</h3>
          <hr />
          <h3>Email: {email}</h3>
          <hr />
          <h3>Assistant Name: {profile.assistant_name}</h3>
        </div>
        <button className="update" onClick={update}>Update Details</button>
        
        <button onClick={()=>navigate(-1)} className="back-link">
          Back
        </button>
      </div>
    );
}