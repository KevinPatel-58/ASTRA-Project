import { supabase } from "../util/supabase";

export default async function updateProfile(updatedUser){
    const{data:userData}=await supabase.auth.getUser();
    const userId=userData.user.id;

    const{error:mailError}=await supabase.auth.updateUser({
        email:updatedUser.email
    });
    if(mailError) return {error:mailError};

    const {error}=await supabase
        .from('users')
        .update({
            name:updatedUser.name,
            assistant_name:updatedUser.assistant_name,
            voice:updatedUser.voice,
        })
        .eq("id",userId);

    if(error) return{error};

    return{success:true};
}