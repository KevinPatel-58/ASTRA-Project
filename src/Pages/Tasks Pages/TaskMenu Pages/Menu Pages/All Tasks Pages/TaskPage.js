import { useEffect, useState } from 'react';
import './TaskPage.scss';
import AddTask from '../../../AddTask';
import { VscTrash } from 'react-icons/vsc';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../../../../util/supabase';
import dayjs from 'dayjs';
import { toast } from 'react-toastify';
import { useChannel } from '../../../../../Hook/useChannel';
import { useVoice } from '../../../../../context/VoiceContext';
import { useNotification } from '../../../../../context/NotificationContext';

export default function Tasks() {
    const{triggerRefresh,refreshSignal}=useVoice();
    const [tasks,setTasks] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('All');
    const[showAddModal,setShowAddModal]=useState(false);
    const [notifiedTasks, setNotifiedTasks] = useState({});
    const navigate=useNavigate();
    const{id}=useParams();
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(5);
    const{createNotification,removeNotification}=useNotification();

    useChannel('task_reminder',payload=>{
        toast(`Reminder: ${payload.taskName} is due now...`);
    });

    function speakText(text) {
        const message = new SpeechSynthesisUtterance(text);
        message.lang = "en-IN";

        const voices = window.speechSynthesis.getVoices();
        message.voice = voices[0];
        message.rate = 0.9; 
        message.pitch = 1; 

        window.speechSynthesis.speak(message);
    }

    const checkReminders = () => {
            const now = dayjs();
            const todaystr=now.format('YYYY-MM-DD');
            const todayFormatted=now.format('DD MMM YYYY');
            
            tasks.forEach(task => {
                const reminder = dayjs(`${todaystr} ${task.reminder_time}`);
                if (task.reminder_time && 
                    !notifiedTasks[task.id] && 
                    task.status !== 'Completed' &&     
                    task.deadline === todayFormatted && 
                    now.isAfter(reminder)) 
                {

                    speakText(`Reminder: It is time for your task, ${task.title}`);

                    if (Notification.permission === "granted") {
                    new Notification("Task Reminder", { body: task.title });
                    }

                    supabase
                        .channel("task-broadcast")
                        .send({
                            type: "broadcast",
                            event: "task_reminder",
                            payload: { taskId: task.id, taskName: task.title }
                        });
                    setNotifiedTasks(prev => ({ ...prev, [task.id]: true }));
                }
            });
    }; 

    useEffect(() => {
        checkReminders();
        const interval = setInterval(checkReminders, 10000);
        return () => clearInterval(interval);
    }, [tasks,notifiedTasks]);

    const fetchTasks = async () => {
        const{data:userData}=await supabase.auth.getUser();

        const userId=userData.user.id;

        const{data,error}=await supabase
            .from('tasks')
            .select('*')
            .eq("user_id",userId)
            .order('created_at',{ascending:false});

            if(error){
                return toast(error.message);
            }else{
                const allTasks=data.map(task=>({
                    id:task.id,
                    title:task.title,
                    category:task.category,
                    deadline:new Date(task.due_date).toLocaleDateString("en-IN",{
                                    day: "2-digit" ,
                                    month: "short" ,
                                    year: "numeric",
                    }),
                    status:task.status,
                    checked:task.checked,
                    reminder_time: task.reminder_time, 
                    due_time: task.due_time,
                }));
                setTasks(allTasks);

                updateStatuses(allTasks);
            }
    }

    useEffect(()=>{
        fetchTasks();
        
    },[refreshSignal]);

    async function updateStatuses(tasksToCheck) {
        const now = dayjs();
        let hasChanges=false;
        for (let task of tasksToCheck) {
            const due = dayjs(`${task.deadline} ${task.due_time || '23:59'}`, 'DD MMM YYYY HH:mm'); // default 23:59 if due_time missing
            let newStatus = task.status;
            
            if (task.checked) {
                newStatus = "Completed";
                //await createNotification('success',`You completed the task: ${task.title}`,task.id);
            } else if (now.isAfter(due)) {
                newStatus = "Missed";
                //await createNotification('info', `You missed the deadline for: ${task.title}`, task.id);
                // if (task.status !== "Missed") {
                //     await createNotification('info', `You missed the deadline for: ${task.title}`, task.id);
                // }
            } else {
                newStatus = "To Do";
                await removeNotification(task.id,'warning');
            }

            if (newStatus !== task.status) {
                hasChanges=true;
                await supabase
                    .from('tasks')
                    .update({ status: newStatus })
                    .eq('id', task.id);

                if (newStatus === "Missed") {
                    await createNotification('info', `You missed the deadline for: ${task.title}`,task.id);
                }else if (newStatus === "To Do") {
                    // Remove the "Missed" notification if the deadline is extended
                    await removeNotification(task.id, 'info');
                }
            }
        }
        if (hasChanges) fetchTasks();
    }

    useEffect(() => {
        const interval = setInterval(() => {
            updateStatuses(tasks);
        }, 60000);

        return () => clearInterval(interval);
    }, [tasks]);

    const handleToggleTask = async (e,id) => {
        e.stopPropagation();
        const task = tasks.find(t => t.id === id);
        const newChecked = !task.checked;

        const { error } = await supabase
            .from("tasks")
            .update({
                checked:newChecked,
                status:newChecked ? "Completed" : "To Do",
                actual_completed_at:newChecked ? new Date() : null,
            })
            .eq("id",id);

            if(!error){
                if (newChecked) {
                    console.log("Attempting to create notification...");
                    await createNotification('success', `Task "${task.title}" marked as completed!`,id);
                }else{
                    await removeNotification(id,'success')
                }
                fetchTasks();
                triggerRefresh();
            }
    };

    const handleDeleteTask = async (e,id) => {
        e.stopPropagation();
        const{error}=await supabase
            .from('tasks')
            .delete()
            .eq('id',id);

            if(!error){
                setTasks(tasks.filter(task=>task.id!==id));
            }
    };

    const filteredTasks = tasks.filter(task => {
        const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
        const today = dayjs().startOf('day');

        const taskDate = dayjs(task.deadline, 'DD MMM YYYY').startOf('day');

        let matchesTab = true;
        if (activeTab === 'Today') matchesTab = taskDate.isSame(today,'day');
        if (activeTab === 'Upcoming') matchesTab = taskDate.isAfter(today,'day');
        if (activeTab === 'Completed') matchesTab = task.status === 'Completed';
        if (activeTab === 'Missed') matchesTab = task.status === 'Missed';

        return matchesSearch && matchesTab;
    });

    const totalPage = Math.ceil(filteredTasks.length / itemsPerPage);

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = filteredTasks.slice(startIndex, endIndex);

    useEffect(() => {
        if (currentPage > totalPage) {
            setCurrentPage(1);
        }
    }, [filteredTasks.length, totalPage, currentPage]);

    function createtask(){
        setShowAddModal(true);
    }

    function Rowclicked(id){
        navigate(`/individualtask/${id}`);
    }

    return (
        <div className="all-tasks">
            <div className="task-header">
                <div>
                    <p className='greet'>Task Management</p>
                    <p className='info'>Create, organize and manage all your tasks</p>
                </div>
                <button className="add-task-btn" onClick={createtask}>+  Add Task</button>
            </div>

            <div className="task-card">
                
                <div className="search-bar">
                    <input 
                        type="text" 
                        placeholder="Search tasks..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="tabs">
                    {['All', 'Today', 'Upcoming', 'Completed','Missed'].map(tab => (
                        <button 
                            key={tab} 
                            className={activeTab === tab ? 'active' : ''} 
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <table className="task-table">
                    <thead>
                        <tr>
                            <th></th>
                            <th>Task Name</th>
                            <th>Category</th>
                            <th>Deadline</th>
                            <th>Status</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentItems.map(task => (
                            <tr key={task.id} className={task.status === 'Completed' ? 'completed-row' : 'non-completed'} onClick={()=>Rowclicked(task.id)}>
                                <td><input type="checkbox" checked={task.checked} onClick={(e)=>handleToggleTask(e,task.id)} onChange={()=>{}} /></td>
                                <td className="task-name">{task.title}</td>
                                <td><span className={`tag cat-${task.category.toLowerCase()}`}>{task.category}</span></td>
                                <td>{task.deadline}</td>
                                <td><span className={`status-pill ${task.status.replace(/\s+/g, '-').toLowerCase()}`}>{task.status}</span></td>
                                <td><button className="del-btn" onClick={(e)=>handleDeleteTask(e,task.id)}><VscTrash className='trash' /></button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className='pagination'>
                    <button className='pager-btn' onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1}>
                        Previous
                    </button>
                    
                    <span>
                        Page <strong>{currentPage}</strong> of <strong>{totalPage}</strong> Pages
                    </span>
                    <button className='pager-btn' onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPage}>
                        Next
                    </button>
                </div>
            </div>

            {showAddModal && (
                <div className='modal-overlay'>
                    <div className='modal-box'>
                        <AddTask modalMode={true} onClose={()=>{setShowAddModal(false); fetchTasks();}} />
                    </div>
                </div>
            )}
        </div>
    );
}