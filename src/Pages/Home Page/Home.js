import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom";
import './Home.scss';
import { VscRobot } from "react-icons/vsc";
import { supabase } from "../../util/supabase";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import { useVoice } from "../../context/VoiceContext";
import Dashboard from "../Tasks Pages/TaskMenu Pages/Menu Pages/Dashboard Pages/Dashboard";
import HomeSkeleton from "../../Components/HomeSkeleton";

export default function Home(){
    const[profile,setProfile]=useState(null);
    const navigate=useNavigate();
    const[email,setEmail]=useState("");
    const [tasks, setTasks] = useState([]);
    const{startListening}=useVoice();
    // const [notifiedTasks, setNotifiedTasks] = useState({});
    const [showGuideTip, setShowGuideTip] = useState(false);


    const fetchTasks = async () => {

      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user.id;
      const today=dayjs().format('YYYY-MM-DD');

      const { data,error } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", userId)
        .eq("due_date",today);

      if(error){
        return toast("Task fetch error:", error);
      }

      setTasks(data || []);

    };

    useEffect(() => {
      fetchTasks();
      const refresh = setInterval(() => {
        fetchTasks();
      }, 30000);
      return () => clearInterval(refresh);
    }, []);
    
    const cardClick = (id)=>{
        navigate(`/individualtask/${id}`);
    }

    const getUserdata = async () => {
        const{data:userData}=await supabase.auth.getUser();

        setEmail(userData.user.email);
        const userId=userData.user.id;

        const{data,error}=await supabase
            .from('users')
            .select("*")
            .eq("id",userId)
            .maybeSingle();
        if(error){
            toast(error.message);
        }
            setProfile(data);
    }

    useEffect(()=>{
      getUserdata();
    },[]);

    // async function logout(){
    //     await supabase.auth.signOut();
    //     navigate("/login");
    // }

    const handleAssistantClick = () => {
      if (!profile) return;
      const message = new SpeechSynthesisUtterance(
        `Hello ${profile.name}. I'm ${profile.assistant_name}. How can i help you?`,
      );
      message.lang = "en-IN";
      message.pitch = 1;
      message.rate = 1;

      const voices = window.speechSynthesis.getVoices();
      if (profile.voice === "Female") {
          message.voice = voices.find(v => v.name.toLowerCase().includes("Female")) || voices[0];
      } else {
          message.voice = voices.find(v => v.name.toLowerCase().includes("Male")) || voices[0];
      }

      message.onend = () => {
        startListening(); // start listening AFTER speaking
      };

      window.speechSynthesis.speak(message);
    }

    useEffect(() => {
      const hasSeen = localStorage.getItem("astra_guide_seen");
      if (!hasSeen) {
        setShowGuideTip(true);
      }
    }, []);

    const handleDismissTip = () => {
      setShowGuideTip(false);
      localStorage.setItem("astra_guide_seen", "true");
    };

    return (
      <div className="home">
        {!profile ? (
          <div>
            <HomeSkeleton />
            
          </div>
        ) : (
          <div>
            {showGuideTip && (
              <div className="guide-onboarding-tip">
                <p>
                  ✨ <strong>New here?</strong> Click the 
                  <span> Voice Guide </span> 
                  to see how your assistant works.
                </p>
                <button onClick={handleDismissTip}>&times;</button>
              </div>
            )}
            <div className="hero">
              <div className="hero-text">
                <h1>Welcome back, {profile.name} <span className="wave">👋</span> </h1>
                <p>Your AI assistant <b className="assistant-name">{profile.assistant_name}</b> is ready to help</p>
              </div>

              <div className="quick-stats">
                <div className="stat">
                  <p>Tasks Today</p>
                  <h3>{tasks.length}</h3>
                </div>
                <div className="stat">
                  <p>Assistant</p>
                  <h3>Active</h3>
                </div>
              </div>
            </div>

              <Dashboard />
            <div className="home-grid">
              
              {/* LEFT SIDE - TASKS */}
              <div className="tasks-section">
                <h3>Today's Tasks</h3>

                {tasks.length === 0 ? (
                  <p>No tasks for today</p>
                ) : (
                  tasks.map(task => (
                    <div key={task.id} className="task-card" onClick={()=>cardClick(task.id)}>
                      <div>
                        <p className="task-title">{task.title}</p>
                        <span className="task-time">
                          {dayjs(task.due_time,'HH:mm:ss').format('hh:mm A')}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* RIGHT SIDE */}
              <div className="right-panel">

                <div className="assistant-box">
                  <VscRobot className="icon" onClick={handleAssistantClick} />
                  <p>Click to talk with {profile.assistant_name}</p>
                </div>

              </div>

            </div>
          </div>
        )}
      </div>
    );
}