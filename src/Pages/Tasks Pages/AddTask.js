import { useNavigate } from 'react-router-dom';
import './AddTask.scss'
import { useEffect, useRef, useState } from 'react';
import { supabase } from '../../util/supabase';
import { toast } from 'react-toastify';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { useVoice } from '../../context/VoiceContext';
import SunEditor from 'suneditor-react';
import 'suneditor/dist/css/suneditor.min.css';
import plugins from 'suneditor/src/plugins'
const VoiceIndicator = () => (
  <div className="voice-bars">
    <div className="bar"></div>
    <div className="bar"></div>
    <div className="bar"></div>
  </div>
);
export default function AddTask({modalMode=false, onClose, mode="add", taskData=null, view='full',initialDate=null}){
    const{voiceTaskData,setVoiceTaskData,flow,triggerRefresh,isSpeaking,currentStep}=useVoice();
    const categoryRef=useRef(null);
    const[task,setTask]=useState({title:"",description:"",category:"",due_date:"",due_time:"",reminder_time:""});
    const[error,setError]=useState({});
    const[now,setNow]=useState(initialDate ? new Date(initialDate) : new Date());
    const navigate=useNavigate();
    const [startDate, setStartDate] = useState(new Date());

    useEffect(() => {
        if (flow === "addTask" && currentStep > 0) {
        // Find the input field that has the 'voice-active' class
        const activeField = document.querySelector('.voice-active');
        
        if (activeField) {
            activeField.scrollIntoView({
            behavior: 'smooth',
            block: 'center', // Puts the field in the middle of the screen
            });
        }
        }
    }, [currentStep, flow]);

    useEffect(() => {
    // When voice reaches Category step
        if (currentStep === 2 && isSpeaking) {
            categoryRef.current?.focus(); 
        }
    }, [currentStep, isSpeaking]);

    const handleDateChange = (date) => {
        setStartDate(date);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');

        setTask(prev => ({
            ...prev,
            due_date: `${year}-${month}-${day}`,
            due_time: `${hours}:${minutes}`
        }));
    };

    useEffect(() => {
        if (!initialDate) {
            const timer = setInterval(() => {
                setNow(new Date());
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [initialDate]);

    useEffect(() => {
        if (flow === "addTask" && voiceTaskData) {
            setTask((prev) => ({
            ...prev,
            ...voiceTaskData,
            }));

            if (voiceTaskData.due_date) {
                const parsedDate = new Date(voiceTaskData.due_date);
                
                // Check if the date is actually valid before setting it
                if (!isNaN(parsedDate.getTime())) {
                    setStartDate(parsedDate);
                    
                    // Also ensure the task object has the split date/time for the DB
                    const year = parsedDate.getFullYear();
                    const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
                    const day = String(parsedDate.getDate()).padStart(2, '0');
                    const hours = String(parsedDate.getHours()).padStart(2, '0');
                    const minutes = String(parsedDate.getMinutes()).padStart(2, '0');

                    setTask(prev => ({
                        ...prev,
                        due_date: `${year}-${month}-${day}`,
                        due_time: `${hours}:${minutes}`
                    }));
                }
            }
        }
    }, [voiceTaskData,flow]);

    const Validation = () => {
        let isValid=true;
        if(!task.title){
            setError((prev)=>({
                ...prev,title:"Please Enter the Title..."
            }));
            isValid=false;
        }

        if(!task.category){
            setError((prev)=>({
                ...prev,category:"Please Enter the category..."
            }));
            isValid=false;
        }

        if(view==='full'){
            if(!task.description){
                setError((prev)=>({
                    ...prev,description:"Please Enter Description..."
                }));
                isValid=false;
            }

            if(!task.due_date){
                setError((prev)=>({
                    ...prev,due_date:"Please Enter Due Date of task..."
                }));
                isValid=false;
            }

            if(!task.due_time){
                setError((prev)=>({
                    ...prev,due_time:"Please Enter Due Time of Task..."
                }));
                isValid=false;
            }

            if(!task.reminder_time){
                setError((prev)=>({
                    ...prev,reminder_time:"Please Enter Reminder Time for Task..."
                }));
                isValid=false;
            }
        }

        return isValid;
    }

    useEffect(()=>{
        if(mode==="edit" && taskData){
            setTask({
                title: taskData.title,
                description: taskData.description,
                category: taskData.category,
                due_date: taskData.due_date,
                due_time: taskData.due_time,
                reminder_time: taskData.reminder_time,
            });
        }else if (mode === "add" && initialDate) {
            setTask(prev => ({ ...prev, due_date: initialDate }));
        }
    },[mode,taskData,initialDate]);

    const savedTask = async () => {
        if(!Validation()) return;

        const{data:userData}=await supabase.auth.getUser();

        const userId=userData.user.id;

        if(mode==='edit' && taskData){
            const{error}=await supabase
                .from('tasks')
                .update({
                    title:task.title,
                    description:task.description || null,
                    category:task.category,
                    due_date:task.due_date || null,
                    due_time:task.due_time || null,
                    reminder_time:task.reminder_time || null,
                    reminder_count: 0, // RESET THIS
                    last_reminded_at: null,
                })
                .eq("id",taskData.id);

                if(error) return toast(error.message);
                else {
                    const { error: deleteError } = await supabase
                        .from('notifications')
                        .delete()
                        .eq('task_id', taskData.id);

                    if (deleteError) {
                        console.error("Failed to clear old notification:", deleteError.message);
                    }
                    toast.success("Task Updated Successfully");
                }
        }else{
            const{error}=await supabase
                .from('tasks')
                .insert({
                    user_id:userId,
                    title:task.title,
                    description:task.description || null,
                    category:task.category,
                    due_date:task.due_date || null,
                    due_time:task.due_time || null,
                    reminder_time:task.reminder_time || null,
                })
                .select();
                if(error){
                    return toast(error.message);
                }else{
                    toast("Task Added Successfully!!");
                    
                }
        }
        if(triggerRefresh) triggerRefresh();
        if(modalMode){
            onClose();
        }
        setTask({title:"",description:"",category:"",due_date:"",due_time:"",reminder_time:""});

    }

    function handleOnChange(e){
        const{name,value}=e.target;
        setTask({...task,[name]:value});
        setError({...error,[name]:""});
    }

    const handleDescriptionChange = (content) => {
        setTask(prev => ({ ...prev, description: content }));
    };

    function back(){
        if(modalMode){
            onClose();
        }
        setTask({title:"",description:"",category:"",due_date:"",due_time:"",reminder_time:""});
        setVoiceTaskData({});
    }

    function handleBack(){
        navigate(-1);
    }

    useEffect(() => {
        if (flow === null && voiceTaskData?.confirmed) {
                savedTask();
                // Clear the confirmed flag so it doesn't save twice
                setVoiceTaskData({}); 
        }
    }, [flow,voiceTaskData?.confirmed]);

    const content=(
        <div className='background'>
            {/* {userSubtitle && (
                <div className="user-subtitle-container">
                    <p className="user-text">“You : {userSubtitle}”</p>
                </div>
            )}  */}
            <div className='container'>
                <h1>{mode === 'edit' ? 'Edit Task' : 'Create/Add Task'}</h1>
                <div>
                    <p>Created On  {now.toLocaleTimeString("en-IN",{
                        year:"numeric",
                        month:"long",
                        day:"numeric",
                        hour:"2-digit",
                        minute:"2-digit"
                    })}</p>
                </div>

                <form onSubmit={(e)=>{e.preventDefault(); savedTask();}}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA' && !e.target.classList.contains('se-wrapper-inner')) {
                            e.preventDefault();
                            savedTask();
                        }
                    }}>
                    <div className='field-wrapper'>
                    <label htmlFor='title'>Task Title: {flow === 'addTask' && currentStep === 1 && isSpeaking && <VoiceIndicator />} </label>
                    <input type='text' name='title' value={task.title} className={`input-field ${flow === 'addTask' && currentStep === 1 ? 'voice-active' : ''}`} onChange={(e)=>handleOnChange(e)} />
                    <p className='error'>{error.title}</p>

                    <label htmlFor='category'>Category: {flow === 'addTask' && currentStep === 2 && isSpeaking && <VoiceIndicator />}</label>
                    <select name='category' ref={categoryRef} value={task.category} className={`input-field native-select ${flow === 'addTask' && currentStep === 2 ? 'voice-active' : ''}`} onChange={(e)=>handleOnChange(e)} size={(currentStep === 2 && isSpeaking) ? 3 : 1} >
                        <option value=''>Select the Category</option>
                        <option value="work">Work</option>
                        <option value='health'>Health</option>
                        <option value='personal'>Personal</option>
                        <option value='study'>Study</option>
                        <option value='finance'>Finance</option>
                    </select> 
                    <p className='error'>{error.category}</p>

                    {view==='full' && (
                        <>
                            <label htmlFor='description'>Description: {flow === 'addTask' && currentStep === 3 && isSpeaking && <VoiceIndicator />}</label>
                            <div className={`sun-wrapper ${flow === 'addTask' && currentStep === 3 ? 'voice-active' : ''}`}>
                                <SunEditor 
                                    setContents={task.description} 
                                    onChange={handleDescriptionChange}
                                    setOptions={{
                                        plugins: plugins,
                                        height: 200,
                                        maxWidth:580,
                                        popupDisplay:'local',
                                        buttonList: [
                                            ['undo', 'redo'],
                                            ['font', 'fontSize', 'formatBlock'],
                                            ['paragraphStyle', 'blockquote'],
                                            ['bold', 'underline', 'italic', 'strike', 'subscript', 'superscript'],
                                            ['fontColor', 'hiliteColor'],
                                            ['list', 'align', 'link', 'table']
                                        ]
                                    }}
                                />
                            </div> 
                            <p className='error'>{error.description}</p>
                            
                            <label>Due Date & Time: {flow === 'addTask' && currentStep === 4 && isSpeaking && <VoiceIndicator />}</label>
                            <DatePicker
                                selected={startDate}
                                onChange={handleDateChange}
                                showTimeSelect
                                timeFormat="hh:mm"
                                timeIntervals={15}
                                dateFormat="MMMM d, yyyy h:mm aa"
                                className={`input-field ${flow === 'addTask' && currentStep === 4 ? 'voice-active' : ''}`}
                            />
                            <p className='error'>{error.due_datetime}</p>
                            
                            <label htmlFor='reminder'>Reminder Time: {flow === 'addTask' && currentStep === 5 && isSpeaking && <VoiceIndicator />}</label>
                            <input type='time' name='reminder_time' value={task.reminder_time} className={`input-field ${flow === 'addTask' && currentStep === 5 ? 'voice-active' : ''}`} onChange={(e)=>handleOnChange(e)}></input>
                            <p className='error'>{error.reminder_time}</p>
                        </>
                    )}
                    
                    <button className={`save-btn ${currentStep === 6 && !voiceTaskData.confirmed ? 'glow-save' : ''}`} type='submit'>Save Task</button>

                    {modalMode && (
                        
                        <button className={'back-btn'} type='button' onClick={back}>Cancel</button>
                        
                    )}
                    </div>
                </form>
            </div>  
            {/* { (assistantSubtitle || userSubtitle) && (
                <div className="voice-hud">
                    {userSubtitle && <p className="user-text">You: “{userSubtitle}”</p>}
                    {assistantSubtitle && <p className="assistant-text">Assistant: “{assistantSubtitle}”</p>}
                </div>
            )} */}
            
        </div>
    );

    if(modalMode){
        return content;
    }

    return(
        <div>
            {content}
            <div className='btn'>
                <button className='back' onClick={handleBack}>Back</button>
            </div>
        </div>
    )
}