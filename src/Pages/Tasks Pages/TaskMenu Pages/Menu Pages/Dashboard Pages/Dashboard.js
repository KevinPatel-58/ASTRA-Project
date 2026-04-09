import './Dashboard.scss';
import DashboardGraph from "./DashboardGraph";
import { useEffect, useState } from "react";
import { supabase } from "../../../../../util/supabase";
import dayjs from "dayjs";
import useWeeklyCompletedTasks from "./WeeklyCompletedData";
import { toast } from "react-toastify";

export default function Dashboard(){
    const[name,setName]=useState("");
    const[task,setTask]=useState([]);
    const[card,setCard]=useState({total:0,completed:0});
    const[totalCompleted,setTotalCompleted]=useState(0);
    // const navigate=useNavigate();
    const weeklyData=useWeeklyCompletedTasks();

    const getUser = async () => {
            const{data:userData}=await supabase.auth.getUser();
            const userId=userData.user.id;
            const{data,error}=await supabase
                .from('users')
                .select("*")
                .eq("id",userId)
                .single();
            if(error){
                toast(error.message);
            }
            setName(data.name);
    }

    useEffect(()=>{
        getUser();
    },[]);

    // function back(){
    //     navigate('/home');
    // }

    const fetchTodayTasks = async () => {
        const{data:userData}=await supabase.auth.getUser();

        const userId=userData.user.id;

        const{data,error}=await supabase
            .from('tasks')
            .select('*')
            .eq('user_id',userId)
            .order('due_date',{ascending:true});

        if(error) return toast(error.message);

        const todaydt=dayjs().format("YYYY-MM-DD");

        const todayTasks=data.filter(task=>task.due_date===todaydt)
            .map(task=>({
                id:task.id,
                name:task.title,
                category:task.category,
                deadline:task.due_date,
                due_time:task.due_time,
                status:task.status,
                checked:task.checked
            }));
        
        const completedCount=todayTasks.filter(task=>task.status==="Completed").length;
            
        setTask(todayTasks);

        setCard({total:todayTasks.length,completed:completedCount});

        const allCompleted=data.filter(task=>task.status==="Completed").length;
        setTotalCompleted(allCompleted);
    }

    useEffect(()=>{
        fetchTodayTasks();
    },[]);

    // const cardClick = (id)=>{
    //     navigate(`/individualtask/${id}`);
    // }

    // const handleToggleTask = async (e,id) => {
    //     e.stopPropagation();
    //     const selectedTask = task.find(t => t.id === id);
    //     const newChecked = !selectedTask.checked;
    
    //     const { error } = await supabase
    //         .from("tasks")
    //         .update({
    //             checked:newChecked,
    //             status:newChecked ? "Completed" : "To Do",
    //             actual_completed_at:newChecked ? new Date() : null,
    //         })
    //         .eq("id",id);
    
    //         if(!error){
    //             fetchTodayTasks();
    //         }
    // };

    return(
        <div className="dashboard">
            {/* <div>
                <p className="greet">Welcome back, {name}</p>
                <p className="info">Here's your productivity overview for today</p>
            </div> */}
            <div className='card'>
                <div className="card-container">
                    <div className='task-card'>
                        <p className="head">Tasks Due today</p>
                        <div className="fit">
                            <p className="num">{card.total}</p>
                            <p className="small">{card.completed} completed</p>
                        </div>
                    </div>
                    <div className='task-card'>
                        <p className="head">Completed Tasks</p>
                        <div className="fit">
                            <p className="num">{totalCompleted}</p>
                            <p className="small">All time total</p>
                        </div>
                    </div>
                </div>
                <div className="graph-container">
                    <DashboardGraph data={weeklyData} />
                </div>
                {/* <div className="task-container">
                    <p className="title">Today's Tasks</p>
                    {task.length===0 ? 
                      (<p>No Tasks For Today...</p>)
                      : (
                        <div className="task-list">
                            {task.map(task=>(
                                <div key={task.id} className={`task-items ${task.checked ? "completed" :'task-items'}`} onClick={()=>cardClick(task.id)}>
                                    <input type="checkbox" className="checkbox" checked={task.checked} onClick={(e)=>handleToggleTask(e,task.id)} onChange={()=>{}} />
                                    <span className="task-name">{task.name}</span>
                                    <span className="task-time">{dayjs(task.due_time,'HH:mm:ss').format('hh:mm A')}</span>
                                    <span className={`category cat-${task.category.toLowerCase()}`}>{task.category}</span>
                                </div>
                            ))}
                        </div>
                      )
                    }
                </div>
                <div className='btn'>
                    <button onClick={back} className='back-btn'>Back</button>
                </div> */}
            </div>
        </div> 
    )
}