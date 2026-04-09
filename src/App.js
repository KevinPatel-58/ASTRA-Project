import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import Signup from "./Pages/Sign up Page/Signup";
import Login from "./Pages/Login Page/login";
import Home from "./Pages/Home Page/Home";
import Protected from "./Components/Protected";
import Auth from "./Components/AuthProtected";
import Profile from "./Pages/Profile Page/Profile";
import UpdateUser from "./Pages/Update User Page/UpdateUser";
import ResetRequest from "./Pages/Forget Password Pages/ResetPasswordRequest";
import UpdatePassword from "./Pages/Forget Password Pages/UpdatePassword";
import TaskMenu from "./Pages/Tasks Pages/TaskMenu Pages/TaskMenu";
import AddTask from "./Pages/Tasks Pages/AddTask";

import IndividualTask from "./Pages/Tasks Pages/IndividualTask";
import Dashboard from "./Pages/Tasks Pages/TaskMenu Pages/Menu Pages/Dashboard Pages/Dashboard";
import Tasks from "./Pages/Tasks Pages/TaskMenu Pages/Menu Pages/All Tasks Pages/TaskPage";
import Calender from "./Pages/Tasks Pages/TaskMenu Pages/Menu Pages/Calender Pages/Calender";
import Reports from "./Pages/Tasks Pages/TaskMenu Pages/Menu Pages/Reports Pages/Reports";
import Notification from "./Pages/Tasks Pages/TaskMenu Pages/Menu Pages/Notification Pages/Notification";
import { useEffect, useState } from "react";

import { initOneSignal } from "./onesignal";
import OneSignal from "react-onesignal";
import { supabase } from "./util/supabase";
import { toast, ToastContainer } from "react-toastify";
import { useVoice, VoiceProvider } from "./context/VoiceContext";
import NotificationProvider from "./context/NotificationContext";

function App() {
  const location=useLocation();
  const [theme, setTheme] = useState(
    localStorage.getItem("theme") || "dark"
  );
  const{startListening,stopListening}=useVoice();

  // const savePlayerId = async (playerId, userId) => {
  //   const { data, error } = await supabase
  //     .from("users")
  //     .update({ onesignal_player_id: playerId })
  //     .eq("id", userId);

  //   if (error) console.error("Error saving Player ID:", error);
  //   else console.log("Player ID saved:", data);
  // };

  const speakReminder = (notification) => {
    if ("speechSynthesis" in window) {
      // Stop any current speech so reminders don't overlap awkwardly
      window.speechSynthesis.cancel(); 

      const { type, message } = notification;
      let textToSpeak = "";

      if (type === 'success') {
        // Tone: Celebratory for task completion
        textToSpeak = `Great job! ${message}`;
        //startListening();
      } else if (type === 'info' || type === 'warning') {
        // Tone: Helpful/Alert for reminders or missed deadlines
        // If the message already contains "You missed...", we just read it.
        // Otherwise, we add a "Don't forget" prefix.
        textToSpeak = message.toLowerCase().includes("missed") 
          ? message 
          : `Pardon the interruption. ${message}`;

        //startListening();
      } else {
        // Fallback for generic messages
        textToSpeak = message;
        //startListening();
      }

      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = "en-IN";
      utterance.rate = 0.9; // Slightly slower for clarity
      utterance.pitch = 1;
      utterance.onstart=()=>{
        console.log('assistant speaking..mic paused...');
        stopListening();
      };
      utterance.onend=()=>{
        console.log('assistant stopped...listening to user..');
        setTimeout(() => {
        startListening();
      }, 100);
      }
      utterance.onerror = (event) => {
        console.log('error:',event);
        startListening();
      };
      
      window.speechSynthesis.speak(utterance);
    }
  };

  const setupNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const channel = supabase
      .channel('realtime-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}` 
        },
        async (payload) => {
          //const notification = payload.new;
          speakReminder(payload.new);

          // toast(notification.message, {
          //   position: "top-right",
          //   autoClose: 5000,
          // });
          //toast.error(notification.message);

          // await supabase
          //   .from('notifications')
          //   .update({ seen: true })
          //   .eq('id', notification.id);

          // const taskName = notification.message.replace("Reminder: ", "");
          // speakReminder(taskName);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  useEffect(()=>{
    setupNotifications();
  },[])

  useEffect(() => {

    const setupOneSignal = async () => {

      await initOneSignal();
      await OneSignal.Notifications.requestPermission();

      const{data:{user},error}=await supabase.auth.getUser();
      if(error){
        return toast(error.message);
      }

      const userId=user.id;

      const optedIn = await OneSignal.User.PushSubscription.optedIn;

      if (!optedIn) {
        console.log("User not subscribed yet");
        return;
      }

      const playerId = await OneSignal.User.PushSubscription.id;

      console.log("OneSignal Player ID:", playerId);

      if (playerId) {
        const{data,error}=await supabase
          .from('users')
          .update({onesignal_player_id:playerId})
          .eq('id',userId);

          if(error) return toast(error.message);
          else console.log("Played Id saved in supabase",data);
      }

    };

    setupOneSignal();

  }, []);

  useEffect(() => {
    const authRoutes = [
      "/",
      "/login",
      "/ResetPasswordRequest",
      "/UpdatePassword"
    ];

    if (authRoutes.includes(location.pathname)) {
      // Force LIGHT theme for auth pages
      document.body.className="light";
    } else {
      // Apply saved theme everywhere else
      const savedTheme = localStorage.getItem("theme") || "dark";
      document.body.className=savedTheme;
    }
  }, [location.pathname]);

  return (

    // <div className="min-h-screen  bg-transparent-gray-100 pr-7 pl-7  ">
    //   <nav className="bg-blue-500 text-white p-3 pr-7 pl-7 rounded-full mt-10 sticky">
    //     <div className="max-w-screen sticky">
    //       <h1 className="font-bold text-lg text-center">My site</h1>
    //       <div className=" space-x-6">
    //         <a href="#" className="hover:text-gray-400">Home</a>
    //         <a href="#" className="hover:text-blue-100">About</a>
    //       </div>
    //     </div>
    //   </nav>
    //   {/* <h1 className="text-3xl font-bold text-blue-600">
    //     Tailwind is Working 🚀
    //   </h1> */}
    // </div>
    <NotificationProvider>
      <VoiceProvider setTheme={setTheme}>

        <Routes>
          <Route path="/" element={
            <Auth>
            <Signup />
            </Auth>
            } />
          <Route path="/login" element={
            <Auth>
            <Login />
            </Auth>
            } />
          <Route path='/ResetPasswordRequest' element={
            <Auth>
              <ResetRequest />
            </Auth>
          } />
          <Route path="/UpdatePassword" element={
              <UpdatePassword />
          } />
          {/* <Route path="/home" element={
            <Protected>
              <Home />
            </Protected>
            } /> */}

          <Route path="/profile" element={
            <Protected>
              <Profile />
            </Protected>
            } />
          
          <Route path="/updateUser" element={
            <Protected>
              <UpdateUser />
            </Protected>
          } />

          <Route path="/taskMenu" element={
            <Protected>
              <TaskMenu />
            </Protected>
          }>
            <Route index element={<Home />} />
            <Route path="view" element={<Tasks />} />
            <Route path="calender" element={<Calender />} />
            <Route path="reports" element={<Reports />} />
            <Route path="notification" element={<Notification />} />
          </Route>

          <Route path="/addTask" element={
            <Protected>
              <AddTask />
            </Protected>
          } />

          {/* <Route path="/analysis" element={
            <Protected>
              <Analysis />
            </Protected>
          } /> */}

          <Route path="/individualtask/:id" element={
            <Protected>
              <IndividualTask />
            </Protected>
          } />

          <Route path="*" element={<Navigate to="/taskMenu" replace  />} />
        </Routes>
        <ToastContainer />
      </VoiceProvider>
    </NotificationProvider>
  );
}

export default App;