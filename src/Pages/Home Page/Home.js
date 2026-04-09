import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom";
import './Home.scss';
import { VscRobot } from "react-icons/vsc";
import { supabase } from "../../util/supabase";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import { useVoice } from "../../context/VoiceContext";
import Dashboard from "../Tasks Pages/TaskMenu Pages/Menu Pages/Dashboard Pages/Dashboard";

export default function Home(){
    const[profile,setProfile]=useState(null);
    const navigate=useNavigate();
    const[email,setEmail]=useState("");
    const [tasks, setTasks] = useState([]);
    // const [theme, setTheme] = useState(
    //   localStorage.getItem("theme") || "dark"
    // );
    const{startListening}=useVoice();
    // const [notifiedTasks, setNotifiedTasks] = useState({});


    // useEffect(() => {
    //   localStorage.setItem("theme", theme);
    // }, [theme]);

    // const toggleTheme = () => {
    //   setTheme(prev => {
    //     const newTheme = prev === "dark" ? "light" : "dark";
    //     localStorage.setItem("theme", newTheme);
    //     document.body.className = newTheme; // only for instant effect
    //     return newTheme;
    //   });
    // };

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

      // console.log("Today's tasks:", data);

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
        console.log("fetched data",data);
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

 
  // Assistant Speech
  
  // function speakText(text) {
  //   const message = new SpeechSynthesisUtterance(text);
  //   message.lang = "en-IN";

  //   const voices = window.speechSynthesis.getVoices();
  //   message.voice = voices[0];

  //   window.speechSynthesis.speak(message);
  // }

  // // Command Handler
  
  // const handleCommand = (command) => {
  //   console.log("User command:", command);

  //   if (command.includes("open task menu")) {
  //     speakText("Opening task menu");
  //     navigate("/taskMenu");

  //   } else if (command.includes("open add task")) {
  //     speakText("Opening add task page");
  //     navigate("/addTask");

  //   } else if (command.includes("open analysis")) {
  //     speakText("Opening analysis page");
  //     navigate("/analysis");

  //   } else {
  //     speakText("Sorry, page not found");
  //   }
  // }

  
  // // Command Listening
  
  // const startListening = () => {
  //   const SpeechRecognition =
  //     window.SpeechRecognition || window.webkitSpeechRecognition;

  //   if (!SpeechRecognition) {
  //     toast("Speech Recognition not supported");
  //     return;
  //   }

  //   const recognition = new SpeechRecognition();

  //   recognition.lang = "en-IN";
  //   recognition.continuous = false;
  //   recognition.interimResults = false;

  //   const timeout = setTimeout(() => {
  //     recognition.stop();
  //     speakText("Please give the input");
  //   }, 10000);

  //   recognition.start();

  //   recognition.onresult = (event) => {
  //     clearTimeout(timeout);

  //     const command =
  //       event.results[0][0].transcript.toLowerCase();

  //     handleCommand(command);
  //   };

  //   recognition.onerror = (event) => {
  //     console.log(event.error);
  //   };
  // }

  
  // // Wake Word Detection
  
  // useEffect(() => {
  //   if (!profile) return;

  //   const SpeechRecognition =
  //     window.SpeechRecognition || window.webkitSpeechRecognition;

  //   if (!SpeechRecognition) return;

  //   const recognition = new SpeechRecognition();

  //   recognition.continuous = true;
  //   recognition.lang = "en-IN";
  //   recognition.interimResults = false;

  //   recognition.start();

  //   recognition.onresult = (event) => {
  //     const speech =
  //       event.results[event.results.length - 1][0].transcript.toLowerCase();

  //     console.log("Heard:", speech);

  //     const wakeWord =
  //       "hello " + profile.assistant_name.toLowerCase();

  //     if (speech.includes(wakeWord)) {
  //       speakText("Yes, I am listening");
  //       startListening();
  //     }
  //   };

  //   recognition.onend = () => {
  //     console.log("Wake word listener ended. Restarting...");
      
  //     try {
  //       recognition.start();
  //     } catch (err) {
  //       console.log("Already started or error: ", err);
  //     }
  //   };

  //   recognition.onerror = (e) => {
  //     console.log(e.error);
  //   };


  //   return () => {
  //     recognition.onend=null;
  //     recognition.stop();
  //   }
  // }, [profile]);

    // function detail(){
    //   if(!profile) return;
    //   navigate("/profile");
    // }

    return (
      <div className="home">
        {!profile ? (
          <div>
            <p>Loading...</p>
            
          </div>
        ) : (
          <div>
            {/* <div className="header">
              <div className="u-info">
                <FaRegCircleUser className="user" onClick={detail} />
                <div className="u-detail">
                  <p className="user-name">{profile.name}</p>
                  <p className="user-email">{email}</p>
                </div>
              </div>
              <button className="outbtn" onClick={logout}>Logout</button>
              <div className="theme">
                <button onClick={toggleTheme} className="theme-btn">
                  {theme === "dark" ? "🌙" : "☀️"}
                </button>
              </div>
            </div> */}
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

                {/* <div className="quick-links">
                  <Link to='/taskMenu' className="link-card">
                    <h3>📋 Task Manager</h3>
                    <p>Manage, update and track all your daily tasks</p>
                  </Link>
                  <Link to='/addTask' className="link-card">
                    <h3>➕ Add New Task</h3>
                    <p>Create tasks with reminders and smart scheduling</p>
                  </Link>
                  <Link to="/taskMenu/reports" className="link-card">
                    <h3>📊 Task Insights</h3>
                    <p>Analyze your productivity and completion trends</p>
                  </Link>
                </div> */}

              </div>

            </div>
          </div>
        )}
      </div>
    );
}