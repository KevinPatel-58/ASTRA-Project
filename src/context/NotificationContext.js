import { createContext, useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { supabase } from "../util/supabase";

const NotificationContext = createContext();
export const useNotification = () => useContext(NotificationContext);

export default function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [settings, setSettings] = useState(null);
  const [user, setUser] = useState(null);

  
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  }, []);

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false });

    setNotifications(data || []);
  };

  const fetchSettings = async () => {
    if (!user) return;

    // 1. Try to get existing settings
    const { data, error } = await supabase
      .from("notification_settings")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Fetch Error:", error.message);
      return;
    }

    // 2. If table is empty (data is null), create the row!
    if (!data) {
      console.log("No settings found. Creating default row for user:", user.id);
      
      const defaultSettings = {
        user_id: user.id,
        show_subtitles: true,      // Default ON
        enable_reminder: true,     // Default ON
        due_alerts: true,          // Default ON
        completion_updates: true    // Default ON
      };

      const { data: newRow, error: insertError } = await supabase
        .from("notification_settings")
        .upsert(defaultSettings, { onConflict: 'user_id' })
        .select()
        .single();

      if (insertError) {
        console.error("Failed to create default settings:", insertError.message);
      } else {
        setSettings(newRow);
      }
    } else {
      // 3. Row exists, just set the state
      setSettings(data);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchNotifications();
    fetchSettings();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
        .channel("notifications-realtime")
        .on(
        "postgres_changes",
        {
            event: "*", 
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`, 
        },
        (payload) => {
            console.log("Realtime:", payload);

            if (payload.eventType === "INSERT") {
              //setNotifications((prev) => [payload.new, ...prev]);
              setNotifications((prev) => {
                const isDuplicate = prev.some(n => n.id === payload.new.id);
                if (isDuplicate) return prev;
                return [payload.new, ...prev];
              });

              toast(payload.new.message, {
                toastId: payload.new.id,
                type: payload.new.type || "info",
              });
            
            }

            if (payload.eventType === "UPDATE") {
            setNotifications((prev) =>
                prev.map((n) =>
                n.id === payload.new.id ? payload.new : n
                )
            );
            }

            if (payload.eventType === "DELETE") {
            setNotifications((prev) =>
                prev.filter((n) => n.id !== payload.old.id)
            );
            }
        }
        )
        .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user?.id]);

  const markAllRead = async () => {
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id);

    setNotifications((prev) =>
        prev.map((n) => ({ ...n, read: true }))
    );
  };

  const clearAll = async () => {
    await supabase
      .from("notifications")
      .delete()
      .eq("user_id", user.id);
    setNotifications([]);
  };

  const markAsRead = async (id) => {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", id);

    if (!error) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    }
  };

  const deleteNotification = async (id) => {
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", id);

    if (!error) {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }
  };

  const updateSettings = async (newData) => {
    const updatedSettings = { ...settings, ...newData, user_id: user.id };
    setSettings(updatedSettings);
    const { error } = await supabase
      .from("notification_settings")
      .upsert( 
        updatedSettings, // Keep old settings
              // Overwrite with new ones
       { onConflict: 'user_id' })
      .select()
      .single();

    if (error) {
      console.error("Error updating settings:", error.message);
      // Rollback if DB update fails
      fetchSettings(); 
    }
  };
  
  const createNotification = async (type, message,taskId=null) => {
    //Check settings before sending
    // if (type === 'success' && settings?.completion_updates) return;
    // if (type === 'warning' && settings?.due_alerts) return;

    if (!user) return;
    if(settings.enable_reminder===false) return;

    if (settings) {
        if (type === 'success' && settings?.completion_updates === false) return;
        if (type === 'warning' && settings?.due_alerts === false) return;
    }

    // if (taskId) {
    //   await supabase
    //     .from("notifications")
    //     .delete()
    //     .match({ user_id: user.id, task_id: taskId, type: type });
    // }

    const { error } = await supabase
                      .from("notifications")
                      .upsert([
                        {
                          user_id: user.id,
                          task_id: taskId,
                          type: type,
                          message: message,
                          read: false,
                        }
                      ], { onConflict: "task_id, message" });
    if (error) console.error("Notification Upsert Error:", error.message);
  };

  const removeNotification = async (taskId, type) => {
    if (!user || !taskId) return;

    const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("task_id", taskId)
        .eq("type", type)
        .eq('user_id',user.id)

    if (error) console.error("Error removing notification:", error.message);
    else {
        // Optimistically update local state so it disappears instantly
        setNotifications((prev) => prev.filter((n) => !(n.task_id === taskId && n.type === type)));
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        settings,
        createNotification,
        removeNotification,
        updateSettings,
        markAllRead,
        clearAll,
        markAsRead,
        deleteNotification,
        unreadCount,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}