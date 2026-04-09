import dayjs from "dayjs";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../util/supabase";

export function calculatePunctuality(tasks) {
    const completedTasks = tasks.filter(t => t.status === 'Completed');
    if (completedTasks.length === 0) return 0;

    const onTimeTasks = completedTasks.filter(task => {
        if (!task.actual_completed_at) return false;

        const dueDate = dayjs(`${task.due_date} ${task.due_time || '23:59'}`);
        const completedDate = dayjs(task.actual_completed_at);

        // Task is on time if completed before or exactly at the due date/time
        return completedDate.isBefore(dueDate) || completedDate.isSame(dueDate);
    });

    return Math.round((onTimeTasks.length / completedTasks.length) * 100);
};

export const usePunctuality = (refreshSignal, viewMode = "All") => {
    const [stats, setStats] = useState({ score: 0, onTimeCount: 0, completedTotal: 0 });

    const fetchScore = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        let query = supabase
            .from('tasks')
            .select('status, due_date, due_time, actual_completed_at')
            .eq('user_id', user.id);

        const now = dayjs();
        if (viewMode === "Weekly") {
            const startOfWeek = now.startOf('week').format('YYYY-MM-DD');
            query = query.gte('due_date', startOfWeek);
        } else if (viewMode === "Monthly") {
            const startOfMonth = now.startOf('month').format('YYYY-MM-DD');
            query = query.gte('due_date', startOfMonth);
        }

        const { data, error } = await query;
        if (!error && data) {
            const completedTasks = data.filter(t => t.status === 'Completed');
            const onTimeTasks = completedTasks.filter(task => {
                if (!task.actual_completed_at) return false;
                const dueDate = dayjs(`${task.due_date} ${task.due_time || '23:59'}`);
                const completedDate = dayjs(task.actual_completed_at);
                return completedDate.isBefore(dueDate) || completedDate.isSame(dueDate);
            });

            const score = completedTasks.length === 0 ? 0 : Math.round((onTimeTasks.length / completedTasks.length) * 100);
            
            setStats({
                score,
                onTimeCount: onTimeTasks.length,
                completedTotal: completedTasks.length
            });
        }
    }, [viewMode,refreshSignal]);

    useEffect(() => {
        fetchScore();
    }, [fetchScore]);

    return stats;
};