
import Select from 'react-select';
import Toggle from '../../../../../Components/Toggle';
import './Notification.scss';
import { useNotification } from '../../../../../context/NotificationContext';
import { useState } from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);
export default function Notification(){
    const {notifications, settings, updateSettings, markAllRead, clearAll, markAsRead, deleteNotification} = useNotification();
    const unreadCount = notifications.filter(n => !n.read).length;
    const [filter,setFilter]=useState("all");
    const reminderOptions = [
        { value: 5, label: "5 Minutes Before" },
        { value: 10, label: "10 Minutes Before" },
        { value: 15, label: "15 Minutes Before" }
    ];

    const filteredNotifications =
    filter === "unread"
      ? notifications.filter((n) => !n.read)
      : notifications;

    return(
        <div className="notification">
            <div className='not-head'>
                <div>
                    <p className='greet'>Notification & Reminder</p>
                    <p className='info'>Manage your alerts and task reminders</p>
                </div>
                <div>
                    {unreadCount>0 && <span className='unread-badge'>{unreadCount} Unread</span>}
                </div>
            </div>
            <div className='notification-container'>
                <div className='enable'>
                    <p className='head'>Notification Setting</p>
                    <Toggle label='&#128365; Enable reminder' subLabel='Receive Task alerts' checked={settings?.enable_reminder} onChange={(val)=>updateSettings({enable_reminder:val})} />
                    <hr />
                    <div className="selector">
                        <label htmlFor="reminder">Default Reminder Time: </label>
                        <Select name="reminder" className="selector-field" classNamePrefix="custom-select"
                            options={reminderOptions} 
                            value={reminderOptions.find((opt)=>(opt.value===settings?.default_time))}
                            onChange={(opt) => updateSettings({ default_time: opt.value })}
                        />
                    </div>
                    <hr />

                    <div className='notification-type'>
                        <p className='notification-header'>Notification Type</p>
                        <Toggle
                            label="Tasks Due Alerts"
                            checked={settings?.due_alerts}
                            onChange={(checked) =>
                                updateSettings({ due_alerts: checked })
                            }
                        />

                        <Toggle
                            label="Completion Updates"
                            checked={settings?.completion_updates}
                            onChange={(checked) =>
                                updateSettings({ completion_updates: checked })
                            }
                        />

                        <Toggle
                            label="Show Subtitles"
                            checked={settings?.show_subtitles}
                            onChange={(checked) =>
                                updateSettings({ show_subtitles: checked })
                            }
                        />
                    </div>
                    <hr />
                    <div className='quick'>
                        <p>Quick Actions</p>
                        <button className='mark-read' onClick={markAllRead}>Mark All as Read</button>
                        <button className='delete-all' onClick={clearAll}>Clear All</button>
                    </div>
                </div>
                <div className='task-notification'>
                    <div className="filter-tabs">
                        <p className='recent'>Recent Notifications</p>
                        <div className='btns'>
                            <button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>
                                All
                            </button>
                            <button className={filter === "unread" ? "active" : ""} onClick={() => setFilter("unread")}>
                                Unread
                            </button>
                        </div>
                    </div>

                    {/* Notification List */}
                    <div className="notification-list">
                        {filteredNotifications.length === 0 ? (
                            <p className="empty">🔕 No notifications</p>
                            ) : (
                                filteredNotifications.map((n) => (
                                    <div key={n.id} className={`notification-card ${n.type} ${n.read ? "read" : ""}`}>
      
                                        <div className="icon">
                                            {n.type === "warning" && "⏰"}
                                            {n.type === "success" && "✅"}
                                            {n.type === "info" && "🔔"}
                                        </div>

                                        <div className="content">
                                            <p className="title">
                                            {n.type === "warning" && "Task Due Soon"}
                                            {n.type === "success" && "Task Completed"}
                                            {n.type === "info" && "Reminder"}
                                            </p>

                                            <p className="message">{n.message}</p>
                                            <p className="time">
                                            {dayjs(n.created_at).fromNow()}
                                            </p>
                                        </div>

                                        <div className="actions">
                                            <span className="close" onClick={()=>deleteNotification(n.id)}>✖</span>
                                            {!n.read && <span className="mark" onClick={()=>markAsRead(n.id)}>Mark as read</span>}
                                        </div>

                                    </div>
                                ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}




