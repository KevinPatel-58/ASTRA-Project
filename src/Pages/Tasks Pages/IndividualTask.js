import { FaBell, FaCalendarDay, FaCircleCheck, FaClipboardCheck, FaClock, FaClockRotateLeft, FaHourglassHalf, FaRegCircleUser } from 'react-icons/fa6';
import './IndividualTask.scss';
import logo from '../../assets/astra-logo.svg';
import Nav from './Nav';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../util/supabase';
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import customParseFormat from "dayjs/plugin/customParseFormat";
import { GrAlarm } from 'react-icons/gr';
import { PiReadCvLogoBold } from 'react-icons/pi';
import AddTask from './AddTask';
import { toast } from 'react-toastify';
import { LuShapes } from 'react-icons/lu';
import { useVoice } from '../../context/VoiceContext';
dayjs.extend(customParseFormat);

export default function IndividualTask(){
    const[task,setTask]=useState({title:"",description:"",category:"",status:"",due_date:"",due_time:"",reminder_time:""});
    const navigate=useNavigate();
    const[isModalMode,setModalMode]=useState(false);
    const{id}=useParams();
    const{theme,setTheme,voiceTaskData,setVoiceTaskData,speak, startListening, stopListening}=useVoice();

    function iconclick(){
        navigate('/profile')
    }

    // useEffect(() => {
    //   localStorage.setItem("theme", theme);
    // }, [theme]);

    const executeVoice = async () =>{
        if (!voiceTaskData.action || !id) return;
        console.log("executing voice: ",voiceTaskData.action)
        switch (voiceTaskData.action) {
            case "UPDATE_STATUS":

                const{error:statusError}=await supabase
                    .from('tasks')
                    .update({status:voiceTaskData.status, checked:voiceTaskData.checked, actual_completed_at:voiceTaskData.actual_completed_at})
                    .eq("id",id);

                if(!statusError){
                    setTask(prev=>({
                        ...prev,status:voiceTaskData.status, checked:voiceTaskData.checked
                    }));
                    toast.success("Task Status Updated Via Voice!")
                }
                break;

            case "DELETE_TASK":
                if (voiceTaskData.confirmed) {
                    const{error:deleteError}=await supabase
                        .from('tasks')
                        .delete()
                        .eq('id',id);

                        if(deleteError) return toast(deleteError.message);
                        else{
                            toast.error("Task Deleted Successfully!");
                            setVoiceTaskData({});
                        }
                }
                break;

            case "UPDATE_TITLE":
                const{error:titleError}=await supabase
                    .from('tasks')
                    .update({title:voiceTaskData.title})
                    .eq("id",id);
                    if(!titleError){
                        setTask(prev=>({
                            ...prev,title:voiceTaskData.title
                        }));
                        toast.success("Task Title Updated via voice!!");
                    }
                break;

            case "EDIT_TASK":
                setModalMode(true);
                break;

            case "READ_DESCRIPTION":
                speak(task.description);
                break;

            default:
                break;
        }
        setVoiceTaskData({});
    };

    useEffect(()=>{
        if (voiceTaskData.action) {
            executeVoice();
        }
    },[voiceTaskData]);

    useEffect(()=>{
        startListening();

        return()=>stopListening();
    },[])


    const toggleTheme = () => {
      setTheme(prev => 
        prev === "dark" ? "light" : "dark"
      );
    };

    const fetchData = async () => {
        const{data,error}=await supabase
            .from('tasks')
            .select('*')
            .eq("id",id)
            .single();
        
            if(error) return toast(error.message);
            else setTask(data);
    }

    useEffect(()=>{
        fetchData();
    },[]);

    const toggleComplete = async () => {
        const newChecked=!task.checked;
        const newStatus=newChecked ? "Completed" : "To Do";
        const{error}=await supabase
            .from('tasks')
            .update({checked:newChecked,status:newStatus,actual_completed_at: newChecked ? new Date() : null})
            .eq("id",task.id)

            if(!error){
                setTask(prev=>({
                    ...prev,checked:newChecked,status:newStatus
                }));
            }
    }

    const handleDelete = async () => {
        const confirmDelete=window.confirm(`Are you Sure You want to delete ${task.title} task?`);
        if(!confirmDelete) return;

        const{error}=await supabase
            .from('tasks')
            .delete()
            .eq('id',task.id);

            if(error) return toast(error.message);
            else{
                toast("Task Deleted Successfully!");
                navigate(-1);
            }
    }

    const stripHtml = (html) => {
        return html?.replace(/<[^>]*>?/gm, '') || "";
    };

    return(
        <div className="individual">
            <div className='header'>
                <span className='flex'>
                    <div className='title'>
                        <img src={logo} alt='Astra Logo' className='logo' />
                        <p>ASTRA</p>
                    </div>
                
                    <div className='links'>
                        <Nav />
                    </div>
                    <div className='user-head'>
                        <div className='user'>
                            <FaRegCircleUser className='icon' onClick={iconclick} />
                        </div>
                        <button onClick={toggleTheme} className="theme-btn">
                            {theme === "dark" ? "🌙" : "☀️"}
                        </button>
                    </div>
                </span>
            </div>
            <div className='space'>
                <div className='page-container'>
                    <span>
                        <p>Task Details</p>
                        <div className='edits'>
                            <p onClick={handleDelete}>Delete</p>
                            <button className='edit-btn' onClick={()=>setModalMode(true)}>Edit Task</button>
                        </div>
                    </span>
                    <div className='task-container'>
                        <div className='main-task'>
                            <div className='task-detail'>
                                <div className='task-title-row'>
                                    <h2>{task.title}</h2>
                                    <PiReadCvLogoBold className='title-icon' />
                                </div>
                                <div className='above'>
                                    <p className='desc'>DESCRIPTION</p>
                                    <p className='describe'>{stripHtml(task.description)}</p>
                                </div>
                                <div className='horizontal-zone'>
                                    <div className='first-row'>
                                        <div className='category-zone'>
                                            <div className='zone-container'>
                                                <LuShapes className='zone-icon' />
                                                <div className='zone-text'>
                                                    <p className='title-name'>CATEGORY</p>
                                                    <p className='title-info'>{task.category}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className='due-zone'>
                                            <div className='zone-container'>
                                                <FaCalendarDay className='zone-icon' />
                                                <div className='zone-text'>
                                                    <p className='title-name'>DUE DATE</p>
                                                    <p className='title-info'>{new Date(task.due_date).toLocaleDateString("en-IN",{
                                                                                day: "2-digit" ,
                                                                                month: "short" ,
                                                                                year: "numeric",
                                                    })}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className='second-row'>
                                        <div className='reminder-zone'>
                                            <div className='zone-container'>
                                                <GrAlarm className='zone-icon' />
                                                <div className='zone-text'>
                                                    <p className='title-name'>DUE TIME</p>
                                                    <p className='title-info'>{dayjs(task.due_time,'HH:mm:ss').format("hh:mm A")}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className='created-zone'>
                                            <div className='zone-container'>
                                                <FaClockRotateLeft className='zone-icon' />
                                                <div className='zone-text'>
                                                    <p className='title-name'>CREATED ON</p>
                                                    <p className='title-info'>{dayjs(task.created_at).format("DD MMM YYYY • hh:mm A")}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                            </div>
                            <div className='task-progress'>
                                <p className='status'>{task.status === "Completed" ? <FaClipboardCheck className='task-icon' /> : <FaHourglassHalf className='task-icon' />}
                                 Task has {task.status}...</p>
                                <button className='mark-complete' onClick={toggleComplete}>{task.status==="Completed" ? "Mark as Not Complete" : "Mark as Complete"}</button>
                            </div>
                        </div>
                        
                        <div className='right-panel'>
                            <div className='voice-task'>
                                <div >
                                    <p className='voice-title'>Voice Command</p>
                                </div>
                                <div >
                                    <p className='voice-detail'>"Listening for Commands... Try saying one of the Following.."</p>
                                </div>
                                <div>
                                    <p className='complete-card'> <FaCircleCheck className='vsc' /> "Mark As Complete"</p>
                                    <p className='reschedule-card'><FaClock className='vsc'/>"Reschedule to Tomorrow"</p>
                                    <p className='reminder-card'><FaBell className='vsc' />"Set Reminder for 5 PM"</p>
                                </div>
                            </div>
                            <button className='previous' onClick={()=>navigate(-1)}>Go Back</button>
                        </div>
                    </div>
                    
                </div>
            </div>

            {isModalMode && (
                <div className='modal-overlay'>
                    <div className='modal-box'>
                        <AddTask 
                            modalMode={true}
                            onClose={()=>{setModalMode(false); fetchData();}}
                            mode='edit'
                            taskData={task} />
                    </div>
                </div>
            )}
            
        </div>
    )
}