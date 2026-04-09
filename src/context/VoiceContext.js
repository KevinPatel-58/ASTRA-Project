// import { createContext, useContext, useState, useRef, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import '../App.scss'; 

// const VoiceContext = createContext();

// export const VoiceProvider = ({ children }) => {
//   const navigate = useNavigate();
//   const recognitionRef = useRef(null);
//   const isListeningRef = useRef(false);
//   const [flow, setFlow] = useState(null);
//   //const [step, setStep] = useState(0);
//   const [voiceTaskData, setVoiceTaskData] = useState({});
//   const lastCommandRef = useRef("");
//   const stepRef = useRef(0);
//   const flowRef = useRef(null);
//   const isSpeakingRef = useRef(false);
//   const [viewMode, setViewMode] = useState("Monthly");
//   const [refreshSignal, setRefreshSignal] = useState(0);
//   const [isSpeaking,setIsSpeaking]=useState(false);
//   const [currentStep, setCurrentStep] = useState(0);
//   const[assistantSubtitle,setAssistantSubtitle]=useState("");
//   const[userSubtitle,setUserSubtitle]=useState("");
//   const [theme, setTheme] = useState(
//     localStorage.getItem("theme") || "dark"
//   );

//   const triggerRefresh = () => setRefreshSignal(prev => prev + 1);


//   // Inside VoiceProvider in voicecontext.js
//   // useEffect(() => {
//   //   // This will try to start listening whenever the app/page loads
//   //   startListening();
    
//   //   // Cleanup on unmount
//   //   //return () => stopListening();
//   // }, []);

//   const speak = (text) => {
//     window.speechSynthesis.cancel();
//     setIsSpeaking(true);
//     setAssistantSubtitle(text);
//     //setUserSubtitle("");
//     isSpeakingRef.current = true;

//     const msg = new SpeechSynthesisUtterance(text);
//     msg.lang = "en-IN";
//     msg.rate = 1.0;

//     msg.onend = () => {
//       setIsSpeaking(false);
//     // 🎤 Resume listening after speaking
//       isSpeakingRef.current=false;
//       setAssistantSubtitle("");
//       lastCommandRef.current = "";
//       //setUserSubtitle(text);

//       if (isListeningRef.current) {
//         try {
//           recognitionRef.current.start();
//         } catch (e) {
//           // Recognition might already be started, ignore error
//         }
//       }
//     };

//     window.speechSynthesis.speak(msg);
//   };

//   const normalizeCategory = (input) =>{
//     if(input.includes('work')) return 'work';
//     if(input.includes('health')) return "health";
//     if(input.includes("personal")) return 'personal';
//     if(input.includes("study")) return 'study';
//     if(input.includes('finance')) return 'finance';
//     return "";
//   };

//   const parseTimeTo24H = (timeStr) => {
//     if (!timeStr) return "";
    
//     // Remove dots/extra characters like "2:00 pm." -> "2:00 pm"
//     let cleanTime = timeStr.toLowerCase().replace(/\./g, '').trim();
    
//     // Use a regex to find hours, minutes, and am/pm
//     const timeRegex = /(\d+)(?::(\d+))?\s*(am|pm)?/;
//     const match = cleanTime.match(timeRegex);

//     if (!match) return "";

//     let hours = parseInt(match[1]);
//     const minutes = match[2] ? match[2].padStart(2, '0') : "00";
//     const ampm = match[3];

//     if (ampm === "pm" && hours < 12) hours += 12;
//     if (ampm === "am" && hours === 12) hours = 0;

//     return `${String(hours).padStart(2, '0')}:${minutes}`;
//   };

//   const resetFlow = () => {
//     setFlow(null);
//     flowRef.current = null;
//     stepRef.current = 0;
//     setVoiceTaskData({});
//   };

//   useEffect(() => {
//     document.body.className = theme;
//     localStorage.setItem("theme", theme);
//   }, [theme]);

//   const handleAddTaskFlow = (input) =>{
//     if(!input.trim()){
//         speak("Please provide input to continue..");
//         return;
//     }

//     if (input.includes("cancel") || input.includes("go back") || input.includes("stop")) {
//       resetFlow();
//       speak("Action cancelled. Closing the task window.");
//       return; // Exit the function immediately
//     }

//     switch(stepRef.current){
//         case 1:
//             setVoiceTaskData((prev)=>({...prev,title:input}));
//             stepRef.current = 2;
//             speak('Select Category. work, health, personal, study, finance ?');
            
//             break;
        
//         case 2:
//             const cat = normalizeCategory(input);
//             if(!cat){
//                 speak("Please Say Valid Category..");
//                 return;
//             }
//             setVoiceTaskData((prev)=>({...prev,category:cat}));

//             const isCalendar = window.location.pathname.includes("calender");
    
//             if (isCalendar) {
//                 speak("Got it. Should I save this task to your calendar?");
//                 stepRef.current = 6; // Skip directly to confirmation
//             } else {
//                 speak("Give Description");
//                 stepRef.current = 3;
//             }
//             break;
        
//         case 3:
//             setVoiceTaskData((prev)=>({...prev,description:input}));
//             stepRef.current = 4;
//             speak("Tell due date & time");
//             break;
        
//         case 4:
//             // 1. Remove the trailing period and extra commas
//             const cleanDateInput = input.replace(/\./g, '').trim(); 
            
//             // 2. Validate if it's a real date
//             const testDate = new Date(cleanDateInput);
            
//             if (!isNaN(testDate.getTime())) {
//                 // We save the full string so AddTask.js can turn it into a Date object
//                 setVoiceTaskData((prev) => ({ ...prev, due_date: cleanDateInput }));
//                 stepRef.current = 5;
//                 speak("Tell Reminder Time");
//             } else {
//                 speak("I couldn't understand that date. Please say it again like March 24,2026, 2 PM.");
//             }
//             break;

//         case 5:
//             const formattedTime = parseTimeTo24H(input);
    
//             if (!formattedTime) {
//                 speak("I couldn't understand that time. Please say something like 2 PM or 14:30.");
//                 return; 
//             }

//             setVoiceTaskData((prev) => ({ ...prev, reminder_time: formattedTime }));
//             stepRef.current = 6;
//             speak("Do you want to save this task?");
//             break;

//         case 6:
//             if(input.includes("yes")){
//                 const isEditMode = window.location.pathname.includes("individualtask");
//                 speak(isEditMode ? "Updating your task details now." : "Saving your new task.");
//                 setVoiceTaskData(prev => ({ ...prev, confirmed: true }));
//             }else{
//                 speak("Task Cancelled");
//                 resetFlow();
//             }
//             setFlow(null);
//             flowRef.current = null;
//             stepRef.current=0;
//             break;
        
//         default:
//             break;
//     }
//     if (stepRef.current === 1) {
//       stepRef.current = 2;
//       setCurrentStep(2); // Synchronize state with ref
//       speak('Select Category...');
//     }
//   };

//   const handleCommand = (command) => {
//     command = command.toLowerCase();
//     const isTaskDetailPage=window.location.pathname.includes("/individualtask/");
//     let commandfound=false;

//     // --- INDIVIDUAL TASK PAGE BEHAVIOR ---
//     if (isTaskDetailPage) {
//       if (command.includes("mark as done") || command.includes("complete task") || command.includes("done")) {
//         speak("Marking this task as completed.");
//         setVoiceTaskData({ action: "UPDATE_STATUS", status: "Completed", checked: true,actual_completed_at: new Date() });
//         //return;
//         commandfound=true;
//       }

//       if (command.includes("delete this task") || command.includes("remove task") || command.includes("delete")) {
//         speak("Are you sure you want to delete this task?");
//         setFlow("deleteConfirm");
//         flowRef.current = "deleteConfirm";
//         //return;
//         commandfound=true;
//       }

//       if(command.includes("edit")||command.includes("edit task")||command.includes("edit this task")){
//         speak("opening edit task. what is new title?");
//         setVoiceTaskData({action:"EDIT_TASK"});
//         setFlow("addTask");
//         flowRef.current = "addTask";
//         stepRef.current = 1; 
//         commandfound = true;
//       }

//       if (command.includes("change title to")) {
//         const newTitle = command.split("change title to")[1].trim();
//         speak(`Changing title to ${newTitle}.`);
//         setVoiceTaskData({ action: "UPDATE_TITLE", title: newTitle });
//         //return;
//         commandfound=true;
//       }
      
//       if (command.includes("read description")) {
//         // You'll need a way to pass the task's current description to the context
//         // Or handle the 'speak' trigger inside the component itself.
//         setVoiceTaskData({ action: "READ_DESCRIPTION" });
//         //return;
//         commandfound=true;
//       }
//     }

//     //GLOBAL COMMAND//
//     if(!commandfound){
//       if (command.includes("open task menu")) {
//         speak("Opening task menu");
//         navigate("/taskMenu");
//       } else if (command.includes("add task")||command.includes("add a task")||command.includes("add")) {
//         //navigate("/addTask");
//         speak("Opening add task page. What is the task title?");
//         setFlow("addTask");
//         flowRef.current = "addTask";
//         stepRef.current = 1;
//         setVoiceTaskData({});

//       } else if (command.includes("analysis")) {
//         speak("Opening analysis");
//         navigate("/taskMenu/reports");

//       } else if (command.includes("dark mode")) {
//         setTheme("dark");
//         document.body.className = "dark";
//         localStorage.setItem("theme", "dark");
//         speak("Dark mode enabled");

//       } else if (command.includes("light mode")) {
//         setTheme("light");
//         document.body.className = "light";
//         localStorage.setItem("theme", "light");
//         speak("Light mode enabled");

//       } else if (command.includes("go back")) {
//         speak("Going to Previous Page");
//         navigate(-1);

//       } else if (command.includes("home page")||command.includes('homepage')) {
//         speak("Opening home page");
//         navigate("/home");

//       } else if (command.includes("give all tasks")) {
//         speak("Opening All Tasks");
//         navigate("/taskMenu/view");

//       } else if (command.includes("open calendar")) {
//         speak("Opening calendar");
//         navigate("/taskMenu/calender");

//       } else if (command.includes("monthly")||command.includes("month view")) {
//         speak("Switching to monthly view.");
//         setViewMode('Monthly');

//       } else if (command.includes("weekly")||command.includes("week view")) {
//         speak("Switching to weekly view.");
//         setViewMode('Weekly');

//       } else if (command.includes("profile page")||command.includes("want to see my profile")) {
//         speak("Rendering to you profile.");
//         navigate("/profile");

//       } else if (command.includes("open notification")) {
//         speak("Rendering to notification page.");
//         navigate("/taskMenu/notification");

//       } else {
//         if (!flowRef.current && command.length > 0) {
//           speak("Command not recognized");
//         }
//       }
//     }
    
//   };

//   const startListening = () => {
//     if(isListeningRef.current) return;
//     const SpeechRecognition =
//       window.SpeechRecognition || window.webkitSpeechRecognition;

//     if (!SpeechRecognition) return;

//     const recognition = new SpeechRecognition();
//     recognition.lang = "en-IN";
//     recognition.continuous = true; // Key: Keep it running
//     recognition.interimResults = false;

//     // recognition.onstart = () => {
//     //   console.log("🎤 Microphone is LIVE (Dot should be visible now)");
//     //   isListeningRef.current = true;
//     // };

//     recognition.onresult = (e) => {
//         const result = e.results[e.results.length - 1][0];
//         const command = result.transcript.toLowerCase().trim();
//         const confidence = result.confidence;
//         const isFinal = e.results[e.results.length - 1].isFinal;

//         setUserSubtitle(command);

//         setTimeout(()=>setUserSubtitle(""),7000)
        
//         console.log("user: ",command);

//         console.log("Voice:", command, "Confidence:", confidence);
//         if (isSpeakingRef.current || window.speechSynthesis.speaking) return;
//         if (confidence < 0) return;

//         if (command.length < 2) return;

//         if (command === lastCommandRef.current && isFinal) return;
//         lastCommandRef.current = command;

//         const handleDeleteFlow = (input) => {
//           if (input.includes("yes") || input.includes("confirm")) {
//             speak("Deleting task now.");
//             setVoiceTaskData({ action: "DELETE_TASK", confirmed: true });
//             setFlow(null);
//             flowRef.current=null;
//             navigate("/taskMenu/view"); // Go back to the list
//           } else {
//             speak("Delete cancelled.");
//             resetFlow();
//           }
//         };

//         console.log("Current Flow:", flowRef.current, "Step:", stepRef.current, "Input:", command);
      
//         if (flowRef.current === "addTask") {
//             handleAddTaskFlow(command);
//         } else if (flowRef.current === "deleteConfirm") {
//             handleDeleteFlow(command);
//         } else {
//             handleCommand(command);
//         }
//     };

//     recognition.onend = () => {
//       if (isListeningRef.current && !isSpeakingRef.current && !window.speechSynthesis.speaking) {
//         recognition.start();
//       }
//     };

//     recognition.start();

//     recognitionRef.current = recognition;
//     isListeningRef.current = true;
  
//   };

//   const stopListening = () => {
//     if (recognitionRef.current) {
//       recognitionRef.current.stop();
//       recognitionRef.current = null;
//     }
//   };

//   return (
//     <VoiceContext.Provider value={{ startListening,stopListening, speak,voiceTaskData,setVoiceTaskData, flow,viewMode, setViewMode, refreshSignal, triggerRefresh,isSpeaking,currentStep:stepRef.current,assistantSubtitle,setAssistantSubtitle,userSubtitle,setUserSubtitle,theme, setTheme }}>
//       {children}
//       <div className="global-voice-overlay">
//         {userSubtitle && (
//           <div className="subtitle user-speech">
//             <span className="label">You:</span> {userSubtitle}
//           </div>
//         )}
        
//         {assistantSubtitle && (
//           <div className="subtitle assistant-speech">
//             <span className="label">Assistant:</span> {assistantSubtitle}
//           </div>
//         )}
//       </div>
//     </VoiceContext.Provider>
//   );
// };

// export const useVoice = () => useContext(VoiceContext);






import { createContext, useContext, useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import '../App.scss'; 
import { supabase } from "../util/supabase";
import { useNotification } from "./NotificationContext";
import { toast } from "react-toastify";
//import { toast } from "react-toastify";

const VoiceContext = createContext();

export const VoiceProvider = ({ children }) => {
  const navigate = useNavigate();
  //const[profile,setProfile]=useState({});
  const notificationContext = useNotification();
  const settings = notificationContext?.settings;
  const recognitionRef = useRef(null);
  const isListeningRef = useRef(false);
  const [flow, setFlow] = useState(null);
  //const [step, setStep] = useState(0);
  const [voiceTaskData, setVoiceTaskData] = useState({});
  const lastCommandRef = useRef("");
  const stepRef = useRef(0);
  const flowRef = useRef(null);
  const isSpeakingRef = useRef(false);
  const [viewMode, setViewMode] = useState("Monthly");
  const [refreshSignal, setRefreshSignal] = useState(0);
  const [isSpeaking,setIsSpeaking]=useState(false);
  //const [currentStep, setCurrentStep] = useState(0);
  const[assistantSubtitle,setAssistantSubtitle]=useState("");
  const[userSubtitle,setUserSubtitle]=useState("");
  const [theme, setTheme] = useState(
    localStorage.getItem("theme") || "dark"
  );
  const [waitingForInput, setWaitingForInput] = useState(false);
  const waitingForInputRef = useRef(false);
  const voiceTaskDataRef = useRef({});
  const [isListening, setIsListening] = useState(false);
  const[profile,setProfile]=useState({});
  const profileRef = useRef({});
  const [showHelp, setShowHelp] = useState(false);
  //const showHelpRef = useRef(false);

  const getData = async () => {
    const{data:userData, error: authError}=await supabase.auth.getUser();

    if (authError || !userData) {
      setProfile({}); 
      profileRef.current = {};
      return; 
    }

    const userId =userData.user.id;

    const{data,error}=await supabase
      .from('users')
      .select('*')
      .eq('id',userId)
      .single();

      if(error){
        toast(error.message);
      }
      setProfile(data);
      profileRef.current=data;
      //console.log(data.name);
  }

  useEffect(()=>{
    getData();
  },[]);

  // Create a helper to update both state and ref simultaneously
  const updateVoiceTaskData = (newData) => {
    const updated = typeof newData === 'function' ? newData(voiceTaskDataRef.current) : newData;
    voiceTaskDataRef.current = updated;
    setVoiceTaskData(updated);
  };

  const triggerRefresh = () => setRefreshSignal(prev => prev + 1);


  const handleScroll = (direction) => {
    const pageClasses = ['.home', '.all-tasks', '.calender', '.reports', '.notification', '.area'];
    // We target '.area' because it's the main container for your Outlet
    let scrollContainer = null;
    for (const className of pageClasses) {
      const element = document.querySelector(className);
      if (element) {
          scrollContainer = element;
          break; // Stop once we find the top-most active container
      }
    }
    const scrollAmount = 500;
    const distance = direction === 'down' ? scrollAmount : -scrollAmount;

    if (scrollContainer) {
        scrollContainer.scrollBy({
            top: distance,
            behavior: 'smooth'
        });
    } else {
        // Fallback for pages that might not be inside TaskMenu (like Landing/Login)
        window.scrollBy({
            top: distance,
            behavior: 'smooth'
        });
    }
  };

  // Inside VoiceProvider in voicecontext.js
  // useEffect(() => {
  //   // This will try to start listening whenever the app/page loads
  //   startListening();
    
  //   // Cleanup on unmount
  //   //return () => stopListening();
  // }, []);

  const speak = (text) => {
    
    window.speechSynthesis.cancel();
    setIsSpeaking(true);
    setAssistantSubtitle(text);
    //setUserSubtitle("");
    isSpeakingRef.current = true;

    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = "en-IN";
    msg.rate = 1.0;

    msg.onend = () => {
      setIsSpeaking(false);
    // 🎤 Resume listening after speaking
      isSpeakingRef.current=false;
      setAssistantSubtitle("");
      lastCommandRef.current = "";
      //setUserSubtitle(text);

      if (isListeningRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          // Recognition might already be started, ignore error
        }
      }
    };

    window.speechSynthesis.speak(msg);
  };

  const normalizeCategory = (input) =>{
    if(input.includes('work')) return 'work';
    if(input.includes('health')) return "health";
    if(input.includes("personal")) return 'personal';
    if(input.includes("study")) return 'study';
    if(input.includes('finance')) return 'finance';
    return "";
  };

  const parseTimeTo24H = (timeStr) => {
    if (!timeStr) return "";
    
    // Remove dots/extra characters like "2:00 pm." -> "2:00 pm"
    let cleanTime = timeStr.toLowerCase().replace(/\./g, '').trim();
    
    // Use a regex to find hours, minutes, and am/pm
    const timeRegex = /(\d+)(?::(\d+))?\s*(am|pm)?/;
    const match = cleanTime.match(timeRegex);

    if (!match) return "";

    let hours = parseInt(match[1]);
    const minutes = match[2] ? match[2].padStart(2, '0') : "00";
    const ampm = match[3];

    if (ampm === "pm" && hours < 12) hours += 12;
    if (ampm === "am" && hours === 12) hours = 0;

    return `${String(hours).padStart(2, '0')}:${minutes}`;
  };

  const resetFlow = () => {
    setFlow(null);
    flowRef.current = null;
    stepRef.current = 0;
    setVoiceTaskData({});
  };

  useEffect(() => {
    document.body.className = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  const handleAddTaskFlow = (input) =>{
    const isEditMode = voiceTaskDataRef.current.action === "EDIT_TASK";
    
    if(!input.trim()){
        speak("Please provide input to continue..");
        return;
    }

    if (input.includes("cancel") || input.includes("go back") || input.includes("stop")) {
      speak("Action cancelled. Closing the task window.");
      console.log('cancelled');
      resetFlow();
      return; // Exit the function immediately
    }

    // if(profile && profile.assistant_name){
    //     console.log('assistant_name:', profile.assistant_name);
    //     if(input.includes(`hey, ${profile.assistant_name}`) || input.includes(`ayy, ${profile.assistant_name}`) || input.includes(`hello, ${profile.assistant_name}`)){
    //       speak(`hello ${profile.name}, How are you ?`);
    //       return;
    //     }
    //   }

    if (isEditMode) {
      if (stepRef.current >= 6) {
            // Confirmation Step
            if (input.includes("yes") || input.includes("save")) {
                speak("Updating your task details now.");
                updateVoiceTaskData(prev => ({ ...prev, confirmed: true }));
                setFlow(null);
                flowRef.current = null;
                stepRef.current = 0;
            } else {
                speak("Changes not saved.");
                resetFlow();
            }
            return;
      }
        if (!waitingForInputRef.current) {
            // Step A: Checking if user wants to edit this specific field
            if (input.includes("yes") || input.includes("yeah") || input.includes("sure")) {
                waitingForInputRef.current = true;
                setWaitingForInput(true);
                speak("Please provide the updated information.");
                return; // Wait for the next voice result
            } else if (input.includes("no") || input.includes("next") || input.includes("skip")) {
                goToNextEditStep();
                return;
            } else {
                speak("Please say yes to edit this field, or no to move to the next one.");
                
            }
            return;
        } else {
            // Step B: User said YES, now we are actually recording the data
            processFieldInput(input);
            waitingForInputRef.current = false;
            setWaitingForInput(false);
            goToNextEditStep();
            return;
        }
    }
    else{
      switch(stepRef.current){
          case 1:
              updateVoiceTaskData((prev)=>({...prev,title:input}));
              stepRef.current = 2;
              speak('Select Category. work, health, personal, study, finance ?');
              
              break;
          
          case 2:
              const cat = normalizeCategory(input);
              if(!cat){
                  speak("Please Say Valid Category..");
                  return;
              }
              updateVoiceTaskData((prev)=>({...prev,category:cat}));

              const isCalendar = window.location.pathname.includes("calender");
      
              if (isCalendar) {
                  speak("Got it. Should I save this task to your calendar?");
                  stepRef.current = 6; // Skip directly to confirmation
              } else {
                  speak("Give Description");
                  stepRef.current = 3;
              }
              break;
          
          case 3:
              updateVoiceTaskData((prev)=>({...prev,description:input}));
              stepRef.current = 4;
              speak("Tell due date & time");
              break;
          
          case 4:
              // 1. Remove the trailing period and extra commas
              const cleanDateInput = input.replace(/\./g, '').trim(); 
              
              // 2. Validate if it's a real date
              const testDate = new Date(cleanDateInput);
              
              if (!isNaN(testDate.getTime())) {
                  // We save the full string so AddTask.js can turn it into a Date object
                  updateVoiceTaskData((prev) => ({ ...prev, due_date: cleanDateInput }));
                  stepRef.current = 5;
                  speak("Tell Reminder Time");
              } else {
                  speak("I couldn't understand that date. Please say it again like March 24,2026, 2 PM.");
              }
              break;

          case 5:
              const formattedTime = parseTimeTo24H(input);
      
              if (!formattedTime) {
                  speak("I couldn't understand that time. Please say something like 2 PM or 14:30.");
                  return; 
              }

              updateVoiceTaskData((prev) => ({ ...prev, reminder_time: formattedTime }));
              stepRef.current = 6;
              speak("Do you want to save this task?");
              break;

          case 6:
              if(input.includes("yes")){
                  const isEditMode = window.location.pathname.includes("individualtask");
                  speak(isEditMode ? "Updating your task details now." : "Saving your new task.");
                  updateVoiceTaskData(prev => ({ ...prev, confirmed: true }));
              }else{
                  speak("Task Cancelled");
                  resetFlow();
              }
              setFlow(null);
              flowRef.current = null;
              stepRef.current=0;
              break;
          
          default:
              break;
      }
    }
  };

  // Helper to move through fields during Edit
  const goToNextEditStep = () => {
      stepRef.current += 1;
      const prompts = {
          2: "Do you want to change the category?",
          3: "Do you want to change the description?",
          4: "Do you want to change the due date and time?",
          5: "Do you want to change the reminder time?",
          6: "Everything looks good. Should I save these changes?"
      };
      speak(prompts[stepRef.current]);
  };

  // Helper to assign the input to the correct field
  const processFieldInput = (input) => {
      switch(stepRef.current) {
          case 1: updateVoiceTaskData(prev => ({...prev, title: input})); break;
          case 2: 
              const cat = normalizeCategory(input);
              if(cat) updateVoiceTaskData(prev => ({...prev, category: cat}));
              else speak("Category not recognized, keeping the old one.");
              break;
          case 3: updateVoiceTaskData(prev => ({...prev, description: input})); break;
          case 4: updateVoiceTaskData(prev => ({...prev, due_date: input})); break;
          case 5: updateVoiceTaskData(prev => ({...prev, reminder_time: parseTimeTo24H(input)})); break;
          default: break;
      }
  };

  const handleGreetingFlow = (input) => {
    if (input.includes("not good") || input.includes("bad") || input.includes("sad") || input.includes("terrible")) {
      speak("Oh, I'm sorry to hear that. What can I do for you today?");
    } else if (input.includes("good") || input.includes("great") || input.includes("fine") || input.includes("well") || input.includes("awesome")) {
      speak("Very well. What can I help you with today?");
    } else {
      speak("I see. How can I help you today?");
    }
    resetFlow();
  };

  const handleCommand = (command) => {
    command = command.toLowerCase();
    const isTaskDetailPage=window.location.pathname.includes("/individualtask/");
    let commandfound=false;

    // --- INDIVIDUAL TASK PAGE BEHAVIOR ---
    if (isTaskDetailPage) {
      if (command.includes("mark as done") || command.includes("complete task") || command.includes("done")) {
        speak("Marking this task as completed.");
        setVoiceTaskData({ action: "UPDATE_STATUS", status: "Completed", checked: true,actual_completed_at: new Date() });
        //return;
        commandfound=true;
      }

      if (command.includes("delete this task") || command.includes("remove task") || command.includes("delete")) {
        speak("Are you sure you want to delete this task?");
        setFlow("deleteConfirm");
        flowRef.current = "deleteConfirm";
        //return;
        commandfound=true;
      }

      if(command.includes("edit")||command.includes("edit task")||command.includes("edit this task")){
        speak("opening edit task. Do you want to change the title?");
        //setVoiceTaskData({action:"EDIT_TASK"});
        updateVoiceTaskData({ 
          ...voiceTaskDataRef.current, // Keep existing details (title, desc, etc.)
          action: "EDIT_TASK" 
        });
        setFlow("addTask");
        flowRef.current = "addTask";
        stepRef.current = 1;
        waitingForInputRef.current = false;
        setWaitingForInput(false); 
        commandfound = true;
      }

      if (command.includes("change title to")) {
        const newTitle = command.split("change title to")[1].trim();
        speak(`Changing title to ${newTitle}.`);
        setVoiceTaskData({ action: "UPDATE_TITLE", title: newTitle });
        //return;
        commandfound=true;
      }
      
      if (command.includes("read description")) {
        // You'll need a way to pass the task's current description to the context
        // Or handle the 'speak' trigger inside the component itself.
        setVoiceTaskData({ action: "READ_DESCRIPTION" });
        //return;
        commandfound=true;
      }
    }

    //GLOBAL COMMAND//
    if(!commandfound){
      const userProfile = profileRef.current;
      if (userProfile?.assistant_name) {
        const dbName=userProfile.assistant_name;
        const nameRegex = new RegExp(`(hey|hello|ayy|hi).*?${dbName}`, 'i');
        
        if (nameRegex.test(command)) {
          console.log(`Wake word detected for: ${dbName}`);
          speak(`Hello ${userProfile.name || 'User'}, how are you?`);
          setFlow("greeting");
          flowRef.current = "greeting";
          return;
        }
      }
      
      if (command.includes("open task menu") || command.includes("dashboard")) {
        speak("Opening task menu");
        navigate("/taskMenu");
        commandfound = true;
      } if (command.includes("add task")||command.includes("add a task")||command.includes("add")) {
        //navigate("/addTask");
        speak("Opening add task page. What is the task title?");
        setFlow("addTask");
        flowRef.current = "addTask";
        stepRef.current = 1;
        setVoiceTaskData({});
        commandfound = true;

      }else if (command.includes("analysis")) {
        speak("Opening analysis");
        navigate("/taskMenu/reports");
        commandfound = true;

      } else if (command.includes("dark mode")) {
        setTheme("dark");
        document.body.className = "dark";
        localStorage.setItem("theme", "dark");
        speak("Dark mode enabled");
        commandfound = true;

      } else if (command.includes("light mode")) {
        setTheme("light");
        document.body.className = "light";
        localStorage.setItem("theme", "light");
        speak("Light mode enabled");
        commandfound = true;

      } else if (command.includes("go back")) {
        speak("Going to Previous Page");
        navigate(-1);
        commandfound = true;

      } else if (command.includes("home page")||command.includes('homepage')) {
        speak("Opening home page");
        navigate("/home");
        commandfound = true;

      } else if (command.includes("give all tasks")||command.includes('all tasks') || command.includes('tasks')) {
        speak("Opening All Tasks");
        navigate("/taskMenu/view");
        commandfound = true;

      } else if (command.includes("open calendar") || command.includes("calendar")) {
        speak("Opening calendar");
        navigate("/taskMenu/calender");
        commandfound = true;

      } else if (command.includes("monthly")||command.includes("month view")) {
        speak("Switching to monthly view.");
        setViewMode('Monthly');
        commandfound = true;

      } else if (command.includes("weekly")||command.includes("week view")) {
        speak("Switching to weekly view.");
        setViewMode('Weekly');
        commandfound = true;

      } else if (command.includes("profile page")||command.includes("want to see my profile")) {
        speak("Rendering to you profile.");
        navigate("/profile");
        commandfound = true;

      } else if (command.includes("open notification")) {
        speak("Rendering to notification page.");
        navigate("/taskMenu/notification");
        commandfound = true;

      } else if (command.includes("scroll down")) {
        speak("Scrolling down");
        handleScroll('down');
        //window.scrollBy({ top: 500, behavior: 'smooth' });
        commandfound = true;
      } else if (command.includes("scroll up")) {
        speak("Scrolling up");
        handleScroll('up');
        //window.scrollBy({ top: -500, behavior: 'smooth' });
        commandfound = true;
      } else if (command.includes("scroll to top")) {
        speak("Going to the top");
        handleScroll('up');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        commandfound = true;
      } else if (command.includes("scroll to bottom")) {
        speak("Going to the bottom");
        handleScroll('down');
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        commandfound = true;
      } else if (command.includes("refresh") || command.includes("reload")) {
        speak("Reloading the page.");
        
        // Short delay to allow the voice to finish speaking before the page kills the script
        setTimeout(() => {
            window.location.reload();
        }, 1500);
        
        commandfound = true;
      } else if (command.includes("close help") || command.includes("hide help") || command.includes("close")) {
        speak("Closing help menu.");
        setShowHelp(false); // Close the menu
        commandfound = true;
      } else if (command.includes("help") || command.includes("show commands") || command.includes("what can you do")) {
        speak("Here is a list of commands you can use.");
        setShowHelp(true); // Open the menu
        commandfound = true;
      }

      // SIGN OUT COMMAND
        else if (command.includes("sign out") || command.includes("log out") || command.includes("signout") || command.includes("logout")) {
          speak("Signing you out of Astra. Goodbye!");
          
          
          const performSignOut = async () => {
            
            await supabase.auth.signOut();
            setProfile({});
            profileRef.current = {};
            navigate("/login"); 
            window.location.reload();
          };
          
          performSignOut();
          commandfound = true;
        }else {
        if (!flowRef.current && command.length > 0) {
          speak(`Okay, give me valid command, say "help" to see the commands guide..`);
        }
      }
    }
    if (commandfound && !command.includes("help") && showHelp) {
      console.log('menu closing...');
        setShowHelp(false);
    } else if (!commandfound && !flowRef.current && command.length > 0) {
      speak(`I didn't quite get that. Say "help" to see what I can do.`);
    }
  };

  const startListening = () => {
    if(isListeningRef.current) return;
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.continuous = true; // Key: Keep it running
    recognition.interimResults = false;

    recognition.onstart = () => {
        setIsListening(true);
        isListeningRef.current = true;
    };

    recognition.onresult = (e) => {
        const result = e.results[e.results.length - 1][0];
        const command = result.transcript.toLowerCase().trim();
        const confidence = result.confidence;
        const isFinal = e.results[e.results.length - 1].isFinal;

        setUserSubtitle(command);

        setTimeout(()=>setUserSubtitle(""),7000)
        
        console.log("user: ",command);

        console.log("Voice:", command, "Confidence:", confidence);
        if (isSpeakingRef.current || window.speechSynthesis.speaking) return;
        if (confidence < 0) return;

        if (command.length < 2) return;

        if (command === lastCommandRef.current && isFinal) return;
        lastCommandRef.current = command;

        const handleDeleteFlow = (input) => {
          if (input.includes("yes") || input.includes("confirm")) {
            speak("Deleting task now.");
            setVoiceTaskData({ action: "DELETE_TASK", confirmed: true });
            setFlow(null);
            flowRef.current=null;
            navigate("/taskMenu/view"); // Go back to the list
          } else {
            speak("Delete cancelled.");
            resetFlow();
          }
        };

        console.log("Current Flow:", flowRef.current, "Step:", stepRef.current, "Input:", command);
      
        if (flowRef.current === "addTask") {
            handleAddTaskFlow(command);
        } else if (flowRef.current === "deleteConfirm") {
            handleDeleteFlow(command);
        } else if (flowRef.current === "greeting") {
            handleGreetingFlow(command);
        }else {
            handleCommand(command);
        }
    };

    recognition.onend = () => {
      if (isListeningRef.current && !isSpeakingRef.current && !window.speechSynthesis.speaking) {
        try {
            recognition.start();
        } catch(e) {}
      } else if (!isListeningRef.current) {
        // 4. UPDATED: Set state to false if it's really stopped
        setIsListening(false);
      }
    };

    recognition.start();

    recognitionRef.current = recognition;
    isListeningRef.current = true;
  
  };

  const stopListening = () => {
    //isListeningRef.current = false; // Set ref first to prevent onend restart
    setIsListening(false);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
  };

  return (
    <VoiceContext.Provider value={{ startListening,stopListening,isListening, speak,voiceTaskData,setVoiceTaskData, flow,viewMode, setViewMode, refreshSignal, triggerRefresh,isSpeaking,currentStep:stepRef.current,assistantSubtitle,setAssistantSubtitle,userSubtitle,setUserSubtitle,theme, setTheme }}>
      {children}

      {/* --- NEW HELP MENU OVERLAY --- */}
      {showHelp && (
        <div className="help-voice-overlay" onClick={() => setShowHelp(false)}>
          <div className="help-box" onClick={(e) => e.stopPropagation()}>
            <div className="help-header">
              <h3>🎙️ Astra Voice Commands</h3>
              <button className="close-btn" onClick={() => setShowHelp(false)}>✕</button>
            </div>
            
            <div className="help-grid">
              <div className="help-column">
                <h4>🗺️ Navigation</h4>
                <ul>
                  <li>"Open task menu" / "home page" / "Dashboard"</li>
                  <li> "Add task" / "Add"</li>
                  <li>"Give all tasks" / "tasks" / "all tasks"</li>
                  <li>"Open calendar" / "caledar"</li>
                  <li>"Analysis"</li>
                  <li>"Profile page"</li>
                  <li>"open notification"</li>
                </ul>
              </div>
              
              <div className="help-column">
                <h4>📝 Task Actions</h4>
                <ul>
                  <li>"Mark as done"</li>
                  <li>"Edit task" / "Delete task"</li>
                  <li>"Change title to [text]"</li>
                  <li>"Read description"</li>
                </ul>
              </div>

              <div className="help-column">
                <h4>💬 Interaction</h4>
                <ul>
                  <li>"Hey/Hello {profile?.assistant_name}"</li>
                  <li>"How are you?"</li>
                  <li>"I am doing good/bad"</li>
                  <li>"Help" / "Show commands"</li>
                  <li>"Stop" / "Cancel"</li>
                </ul>
              </div>
              
              <div className="help-column">
                <h4>⚙️ System & View</h4>
                <ul>
                  <li>"Dark mode" / "Light mode"</li>
                  <li>"Monthly" / "Weekly" view</li>
                  <li>"Scroll down" / "Scroll up"</li>
                  <li>"Go back"</li>
                  <li>"Refresh" / "Reload"</li>
                  <li>"Sign out" / "Log Out"</li>
                </ul>
              </div>
            </div>
            <p className="help-footer">Say <strong>"Close help"</strong> to hide this menu.</p>
          </div>
        </div>
      )}

      {notificationContext?.settings?.show_subtitles !== false && (
        <div className="global-voice-overlay">
          {userSubtitle && (
            <div className="subtitle user-speech">
              <span className="label">You:</span> {userSubtitle}
            </div>
          )}
          
          {assistantSubtitle && (
            <div className="subtitle assistant-speech">
              <span className="label">Assistant:</span> {assistantSubtitle}
            </div>
          )}
        </div>
      )}
    </VoiceContext.Provider>
  );
};

export const useVoice = () => useContext(VoiceContext);