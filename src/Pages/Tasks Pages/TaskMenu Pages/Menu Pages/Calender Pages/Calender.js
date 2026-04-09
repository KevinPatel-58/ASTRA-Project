import { useState, useEffect } from "react";
import dayjs from "dayjs";
import './Calender.scss';
import { supabase } from "../../../../../util/supabase";
import AddTask from "../../../AddTask";
import { useVoice } from "../../../../../context/VoiceContext";

export default function Calender() {
  const {viewMode, setViewMode} = useVoice();
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [tasks, setTasks] = useState([]);
  const[isModalOpen,setIsModalOpen]=useState(false);
      
  const changeMonth = (direction) => {
    //setSelectedDate(selectedDate.add(direction,'month'));
    
    setCurrentMonth(currentMonth.add(direction, 'month'));
    //setSelectedDate(null);
  };

  const fetchTasks = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase.from('tasks').select('*').eq("user_id", user.id);
    setTasks(data || []);
  }

  useEffect(() => {
    fetchTasks();
  }, []);

  const selectedDateTasks = tasks.filter(task => 
    dayjs(task.due_date).isSame(selectedDate, 'day')
  );

  const renderGrid = () => {
    if (viewMode === 'Monthly') {
      const startOfMonth = currentMonth.startOf('month');
      const endOfMonth = currentMonth.endOf('month');
      const padding = startOfMonth.day();
      
      const days = [];
      for (let i = 0; i < padding; i++) days.push(<div key={`e-${i}`} className="day empty"></div>);
      for (let i = 1; i <= endOfMonth.date(); i++) {
        const d = startOfMonth.date(i);
        const isSelected=d.isSame(selectedDate,'day');
        const isToday=d.isSame(dayjs(),'day');
        const hasTasks = tasks.some(t =>dayjs(t.due_date).isSame(d, 'day'));
        days.push(
          <div key={i} className={`day ${isSelected ? 'selected' : ''} ${isToday ? 'is-today':''} ${hasTasks ? "has-task" : ""}`} onClick={() => setSelectedDate(prev =>prev && prev.isSame(d, 'day') ? null : d)}>
            {i}
          </div>
        );
      }
      return days;
    } else {
      const startOfWeek = selectedDate.startOf('week');
      return Array.from({ length: 7 }).map((_, i) => {
        const d = startOfWeek.add(i, 'day');
        const isToday=d.isSame(dayjs(),'day');

        const dayTasks = tasks.filter(t => dayjs(t.due_date).isSame(d, 'day'));
        const visibleTasks = dayTasks.slice(0, 3);
        const extraCount = dayTasks.length - 3;
        return (
          <div key={i} className={`week-day-card ${isToday ? 'active' : ''}`} onClick={() => setSelectedDate(d)}>
            <small>{d.format('ddd')}</small>
            <span>{d.date()}</span>

            <div className="task-labels-container">
              {visibleTasks.map(t => (
                <div key={t.id} className={`task-label cat-${t.category.toLowerCase()}`}>
                  {t.title.substring(0, 4)}...
                </div>
              ))}
              {extraCount > 0 && (
                <div className="more-count">+{extraCount} more</div>
              )}
            </div>

            <div className="task-dots">
              {tasks.filter(t => dayjs(t.due_date).isSame(d, 'day')).slice(0, 3).map(t => (
                <div key={t.id} className={`task-dot cat-${t.category.toLowerCase()}`}></div>
              ))}
            </div>
          </div>
        );
      });
    }
  };

  return (
    <div className="calender">
      <div className="calendar-header-main">
        <div>
          <p className="greet">Calendar View</p>
          <p className="info">Visual timeline of your tasks and events</p>
        </div>
        <div className="toggle-group">
          <button className={viewMode === 'Monthly' ? 'active' : ''} onClick={() => setViewMode('Monthly')}>Monthly</button>
          <button className={viewMode === 'Weekly' ? 'active' : ''} onClick={() => setViewMode('Weekly')}>Weekly</button>
        </div>
      </div>

      <div className="main-layout">
        <div className="calendar-container">
          <p className="calendar-mode">{viewMode} View </p>
          <div className={`calendar-card ${viewMode}`}>
            
            {viewMode === 'Monthly' && (
              <>
                <div className="calendar-header">

                  <button onClick={() => changeMonth(-1)}>‹</button>

                  <h3>{currentMonth.format('MMMM YYYY')}</h3>

                  <button onClick={() => changeMonth(1)}>›</button>

                </div>
                <div className="week-labels">
                  {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <span key={d}>{d}</span>)}
                </div>
              </>
            )}
            <div className="calendar-grid">{renderGrid()}</div>
          </div>
        </div>

        <div className="task-container">
          <div className="task-above">
            <h3>{selectedDate ? selectedDate.format('MMMM D') : 'Select a date'}</h3>
            <p className="para" onClick={()=>setIsModalOpen(true)}>&#128322;</p>
          </div>
          <div className="task-list">
            {selectedDateTasks.length > 0 ? (
                selectedDateTasks.map(task => (
                  <div key={task.id} className="task-card">
                    <p>{task.title}</p>
                    <span className={`tag cat-${task.category.toLowerCase()}`}>{task.category}</span>
                  </div>
                ))
              ) : (
                <div className="no-tasks">
                  <p className="no">No tasks for this date.</p>
                  <p className="adding" onClick={()=>setIsModalOpen(true)}>Add a task</p>
                </div>
              )}
          </div>
          <div className="category-legend">
            <h4>Categories</h4>
            {['Work', 'Personal', 'Study','Finance','Health'].map(cat => (
              <div key={cat} className="legend-item">
                <span className={`dot cat-${cat.toLowerCase()}`}></span> {cat}
              </div>
            ))}
          </div>
        </div>
      </div>
      {isModalOpen && (
          <div className='modal-overlay'>
            <div className='modal-box'>
              <AddTask modalMode={true} onClose={()=>{setIsModalOpen(false); fetchTasks();}} view="simple" initialDate={selectedDate.format('YYYY-MM-DD')} />
            </div>
          </div>
      )}
    </div>
  );
}