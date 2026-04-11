import { useEffect, useState } from 'react';
import './TaskMenu.scss';
import logo from '../../../assets/astra-logo.svg';
import { supabase } from '../../../util/supabase';
import { toast } from 'react-toastify';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import AddTask from '../AddTask';
import { FiMenu } from 'react-icons/fi';
import { FaArrowRightFromBracket, FaRegCircleUser } from 'react-icons/fa6';
import { LuBell, LuCalendar, LuChartColumn, LuCircleCheckBig, LuLayoutDashboard, LuMic, LuMicOff, LuSquareCheckBig } from 'react-icons/lu';
import { useVoice } from '../../../context/VoiceContext';
import { useNotification } from '../../../context/NotificationContext';
import dayjs from 'dayjs';
import { calculatePunctuality } from '../../../Hook/usePunctuality';
import { MdHelpOutline } from 'react-icons/md';

export default function TaskMenu(){
    const{notifications,fetchNotifications, fetchSettings, setUser}=useNotification();
    const unreadCount = notifications.filter(n => n &&!n.read).length;
    const[name,setName]=useState("");
    const[showAddModal,setShowAddModal]=useState(false);
    const [sidebarOpen,setSidebarOpen] = useState(false);
    const {theme,setTheme}=useVoice();
    const location=useLocation();
    const navigate = useNavigate();
    const{startListening,stopListening,isListening,isSpeaking,flow,refreshSignal,speak}=useVoice();
    const [punctuality, setPunctuality] = useState(0);
    const {setShowHelp}=useVoice();
    //const{isListening,isUserSpeaking} = useVoice();

    const initializeUserData = async () => {
        const { data: { user: activeUser } } = await supabase.auth.getUser();
        
        if (activeUser) {
            
            setUser(activeUser); 
            
            fetchNotifications(activeUser);
            fetchSettings(activeUser);
            
            const { data } = await supabase
                .from('users')
                .select("name")
                .eq("id", activeUser.id)
                .single();
            if (data) setName(data.name);
        }
    };

    useEffect(() => {
        initializeUserData();
    }, []);

    const fetchPunctuality = async () => {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) return;

        const { data, error } = await supabase
            .from('tasks')
            .select('status, due_date, due_time, actual_completed_at')
            .eq('user_id', userData.user.id);

        if (!error && data) {
            const score = calculatePunctuality(data);
            setPunctuality(score);
        }
    };

    useEffect(() => {
        fetchPunctuality();
    }, [location.pathname,refreshSignal]); 

    useEffect(()=>{
        startListening();

        return()=>stopListening();
    },[])

    const toggleTheme = () => {
      setTheme(prev => 
        prev === "dark" ? "light" : "dark"
      );
    };

    // const getUser = async () => {
    //         const{data:userData}=await supabase.auth.getUser();
    //         const userId=userData.user.id;
    //         const{data,error}=await supabase
    //             .from('users')
    //             .select("*")
    //             .eq("id",userId)
    //             .single();
    //         if(error){
    //             toast(error.message);
    //         }
    //         setName(data.name);
    // }

    // useEffect(()=>{
    //     getUser();
    // },[]);


    const getNavClass=({isActive})=> isActive ? 'menu-active' : 'menu';

    const closeAside=()=>{
        setSidebarOpen(false);
    }
    
    const logout = async () =>{
        await supabase.auth.signOut();
        navigate('/login');
        window.location.reload();
    }

    function detail(){
      if(!name) return;
      navigate("/profile");
    }

    useEffect(() => {
        if (flow === "addTask") {
            setShowAddModal(true);
        }else {
            setShowAddModal(false);
        }
    }, [flow]);

    return(
        <div className='task-page'>
            <div className={`aside ${sidebarOpen ? "active" : ""}`}>
                
                <div className='app-title'>
                    <img src={logo} alt='Astra Logo' className='logo' />
                    <h3>ASTRA</h3>
                </div>
                <div className='vertical-nav'>
                        <NavLink to="" end className={getNavClass} onClick={closeAside}><LuLayoutDashboard className='lu-icon' /> Dashboard</NavLink>
                        {/* <NavLink to="" end className={getNavClass} onClick={closeAside}><LuLayoutDashboard className='lu-icon' /> Dashboard</NavLink> */}
                        <NavLink to='view' className={getNavClass} onClick={closeAside}><LuSquareCheckBig className='lu-icon' /> View Tasks</NavLink>
                        <NavLink to='calender' className={getNavClass} onClick={closeAside}><LuCalendar className='lu-icon' /> Calender</NavLink>
                        <NavLink to='reports' className={getNavClass} onClick={closeAside}><LuChartColumn className='lu-icon' /> Reports/Analysis</NavLink>
                        <NavLink to='notification' className={getNavClass} onClick={closeAside}><LuBell className='lu-icon' /> Notification <span className='unread-count'>{unreadCount}</span></NavLink>
                </div>
                <div className='user-bar'>
                    <div className="u-info">
                        <FaRegCircleUser className="user" onClick={detail} />
                        <div className="u-detail">
                            <p className="user-name">{name}</p>
                        </div>
                    </div>
                    <button className='out' onClick={logout}><FaArrowRightFromBracket className='out-icon' /> Sign out</button>
                </div>
            </div>
            {sidebarOpen && (
                <div className="sidebar-overlay" onClick={()=>setSidebarOpen(false)}></div>
            )}
            <div className={`main-content ${sidebarOpen ? "blur" : ""}`}>
                <div className='header'>
                    
                    <div className='search'>
                        <div className='side-toggle'>
                            <FiMenu className='menu-toggle' onClick={()=>setSidebarOpen(true)} />
                        </div>
                        <div className='metrics-class'>
                            <div className="header-metrics">

                                <div className="date-display">
                                    <span className="today-text">{dayjs().format('dddd, DD MMMM')}</span>
                                </div>
                                
                                <div className="vertical-divider"></div>

                                <div className="punctuality-metric">
                                    <p className="metric-label">Punctuality Score</p>
                                    <div className="metric-value-container">
                                        <span className={`metric-value ${punctuality > 75 ? 'good' : 'warning'}`}>
                                            {punctuality}%
                                        </span>
                                        <div className="progress-mini">
                                            <div className="progress-fill" style={{ width: `${punctuality}%` }}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className='voice-class'>
                            <div className={`voice-container ${isListening || isSpeaking ? 'active' : ''}`}>
                                {isSpeaking ? (
                                    <div className="speaking-waves">
                                        <span></span>
                                        <span></span>
                                        <span></span>
                                        <span></span>
                                        <span></span>
                                    </div>
                                ) : isListening ? (
                                    <LuMic className="mic-idle-icon" />
                                ) : (
                                    <LuMicOff className="mic-off-icon" />
                                )}
                                <span className="voice-text">
                                    {isSpeaking ? "Astra is Speaking..." : isListening ? "Astra is Listening..." : "Voice Off"}
                                </span>
                            </div>
                        </div>
                        <div className='btn-class'>
                            <button onClick={toggleTheme} className="theme-btn">
                                {theme === "dark" ? "🌙" : "☀️"}
                            </button>

                            <button 
                                className="guide-btn" 
                                onClick={() => setShowHelp(true)}
                            >
                                <MdHelpOutline className='guide-icon' />
                                <span>Voice Guide</span>
                            </button>
                        </div>
                        
                    </div>
                    
                </div>
                <div className='area'>
                    <Outlet />
                </div>
                
            </div>

            {showAddModal && (
                <div className='modal-overlay'>
                    <div className='modal-box'>
                        <AddTask modalMode={true} onClose={()=>setShowAddModal(false)} view={location.pathname.includes('calender') ? 'simple' : 'full'} />
                    </div>
                </div>
            )}

        </div>
    )
}