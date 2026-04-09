import { useEffect, useState } from "react";
import { supabase } from "../../../../../util/supabase";
import dayjs from "dayjs";
import { toast } from "react-toastify";

export default function useWeeklyCompletedTasks() {
  const [weeklyData, setWeeklyData] = useState([]);

  const fetchWeeklyData = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user.id;

    const { data: tasks, error } = await supabase
      .from("tasks")
      .select("actual_completed_at")
      .eq("user_id", userId);

    if (error) return toast(error.message);

    const today = dayjs();
    const last7Days = Array.from({ length: 7 }, (_, i) =>
      today.subtract(i, "day").format("YYYY-MM-DD")
    ).reverse(); 

    const chartData = last7Days.map(date => ({
      day: dayjs(date).format("ddd"),
      tasks: tasks.filter(t => dayjs(t.actual_completed_at).format('YYYY-MM-DD') === date).length
    }));

    setWeeklyData(chartData);
  }

  useEffect(() => {
    fetchWeeklyData();
  }, []);

  return weeklyData;
}