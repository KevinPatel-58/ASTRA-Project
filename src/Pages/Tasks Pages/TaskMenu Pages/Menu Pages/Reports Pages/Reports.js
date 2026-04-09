import { useEffect, useState } from "react";
import CategoryBreakdown from "./Graphs/Category";
import MyPieChart from "./Graphs/TaskDistribution";

import "./Reports.scss";
import { supabase } from "../../../../../util/supabase";
import BarGraph from "./Graphs/BarGraph";
import { TfiStatsDown, TfiStatsUp } from "react-icons/tfi";
import { useVoice } from "../../../../../context/VoiceContext";
import { calculatePunctuality, usePunctuality } from "../../../../../Hook/usePunctuality";

export default function Reports() {
  const {viewMode, setViewMode,refreshSignal} = useVoice();
  const [loading, setLoading] = useState(true);

  const [data, setData] = useState({
    completed: 0,
    todo: 0,
    missed: 0,
    completionRate: 0,
    categories: [],
    changes: {
      completed: 0,
      todo: 0,
      missed: 0,
      completionRate: 0
    }
  });

  const { score: punctualityScore, onTimeCount, completedTotal } = usePunctuality(refreshSignal, viewMode);
  const [punctualityChange, setPunctualityChange] = useState(0);

  useEffect(() => {
    if (data.currentTasksRaw && data.previousTasksRaw) {
        const currentPunc = calculatePunctuality(data.currentTasksRaw);
        const prevPunc = calculatePunctuality(data.previousTasksRaw);
        
        let change;
        if (prevPunc === 0) {
          change = currentPunc === 0 ? 0 : 100;
        } else {
          const rawChange = Math.round(((currentPunc - prevPunc) / prevPunc) * 100);
          // Clamp it here too
          change = Math.min(100, Math.max(-100, rawChange));
        }
        setPunctualityChange(change);
    }
  }, [data]);

  useEffect(() => {
    fetchReportData();
  }, [viewMode]);

  const fetchReportData = async () => {
    setLoading(true);

    const user = (await supabase.auth.getUser()).data.user;
    if (!user) {
      setLoading(false);
      return;
    }

    const now = new Date();

    // -------------------------
    // 🗓️ DATE HELPERS
    // -------------------------
    const getMonday = (date) => {
      const d = new Date(date);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      return new Date(d.setDate(diff));
    };

    let startRange, endRange;
    let currentStart, currentEnd, previousStart, previousEnd;

    if (viewMode === "Weekly") {
      // Current week (Mon-Sun)
      currentStart = getMonday(now);
      currentStart.setHours(0, 0, 0, 0);

      currentEnd = new Date(currentStart);
      currentEnd.setDate(currentStart.getDate() + 6);
      currentEnd.setHours(23, 59, 59, 999);

      // Previous week
      previousStart = new Date(currentStart);
      previousStart.setDate(currentStart.getDate() - 7);

      previousEnd = new Date(currentStart);
      previousEnd.setMilliseconds(-1);

      // Fetch last 4 weeks (for graph)
      startRange = new Date(currentStart);
      startRange.setDate(currentStart.getDate() - 21);

      endRange = currentEnd;
    } else {
      // Current month
      currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
      currentEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      currentEnd.setHours(23, 59, 59, 999);

      // Previous month
      previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      previousEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      previousEnd.setHours(23, 59, 59, 999);

      // Fetch last 6 months (for graph)
      startRange = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      endRange = currentEnd;
    }

    // -------------------------
    // 📦 FETCH TASKS
    // -------------------------
    const { data: tasks, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user.id)
      .or(`due_date.gte.${startRange.toISOString()},actual_completed_at.gte.${startRange.toISOString()},status.eq.To-Do`);

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    const getTaskTargetDate = (task) => {
      
      if (task.status === "Completed" && task.actual_completed_at) {
        return new Date(task.actual_completed_at);
      }
      
      return new Date(task.due_date || task.created_at);
    };

    // -------------------------
    // ✂️ SPLIT CURRENT / PREVIOUS
    // -------------------------
    const currentTasks = [];
    const previousTasks = [];

    tasks.forEach((task) => {
      const targetDate = getTaskTargetDate(task);

      if (targetDate >= currentStart && targetDate <= currentEnd) {
        currentTasks.push(task);
      } else if (targetDate >= previousStart && targetDate <= previousEnd) {
        previousTasks.push(task);
      }
    });

    // -------------------------
    // 📊 COUNT FUNCTION
    // -------------------------
    const getCounts = (taskList) => {
      let completed = 0,
        todo = 0,
        missed = 0;

      taskList.forEach((t) => {
        if (t.status === "Completed") completed++;
        else if (t.status === "To-Do" || t.status==="To Do") todo++;
        else if (t.status === "Missed") missed++;
      });

      const total = completed + todo + missed;
      const completionRate =
        total === 0 ? 0 : Math.round((completed / total) * 100);

      return { completed, todo, missed, completionRate };
    };

    const current = getCounts(currentTasks);
    const previous = getCounts(previousTasks);

    const calcChange = (curr, prev) => {
      if (prev === 0) return curr === 0 ? 0 : 100;
      const rawChange = Math.round(((curr - prev) / prev) * 100);
      return Math.min(100, Math.max(-100, rawChange));
    };

    const changes = {
      completed: calcChange(current.completed, previous.completed),
      todo: calcChange(current.todo, previous.todo),
      missed: calcChange(current.missed, previous.missed),
      completionRate: calcChange(
        current.completionRate,
        previous.completionRate
      ),
    };

    // -------------------------
    // 📊 GRAPH DATA (CALENDAR BASED)
    // -------------------------
    let grouped = {};

    tasks.forEach((task) => {
      const targetDate = getTaskTargetDate(task);
      let key = "";
      let weekStartRaw = null;

      if (viewMode === "Weekly") {
        const weekStart = getMonday(targetDate);
        weekStart.setHours(0,0,0,0); // Normalize to start of day
        weekStartRaw = weekStart;
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);

        // Format: "09 - 15 Mar"
        const startStr = weekStart.toLocaleDateString("en-GB", { day: "2-digit" });
        const endStr = weekEnd.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
        });

        key = `${startStr}-${endStr}`;
      } else {
        key = `${targetDate.getFullYear()}-${targetDate.getMonth()}`;
        weekStartRaw = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
      }

      if (!grouped[key]) {
        grouped[key] = {
          Completed: 0,
          "To Do": 0,
          Missed: 0,
          label: key,
          sortValue: weekStartRaw,
        };
      }

      if (task.status === "Completed") grouped[key].Completed++;
      else if (task.status === "To Do") grouped[key]["To Do"]++;
      else if (task.status === "Missed") grouped[key].Missed++;
    });

    const graphData = Object.values(grouped)
      .map((item) => {
        if (viewMode === "Monthly") {
          const [year, month] = item.label.split("-");
          const date = new Date(year, month);
          return {
            name: date.toLocaleString("default", { month: "short" }),
            Completed: item.Completed,
            "To Do": item["To Do"],
            Missed: item.Missed,
            sortKey: date,
          };
        } else {
          return {
            name: item.label,
            Completed: item.Completed,
            "To Do": item["To Do"],
            Missed: item.Missed,
            sortKey: item.sortValue,
          };
        }
      })
      .sort((a, b) => a.sortKey - b.sortKey);

      const limitedGraphData = graphData.slice(-4);

    // -------------------------
    // 🥧 CATEGORY DATA
    // -------------------------
    let completed = 0;
    let todo = 0;
    let missed = 0;
    
    const currentCount = getCounts(currentTasks);
    const totalCurrentTasks = currentTasks.length;

    const daysInPeriod = viewMode === "Weekly" ? 7 : 30;
    const avgTasksPerDay = totalCurrentTasks === 0 ? 0 : (totalCurrentTasks / daysInPeriod).toFixed(1);

    let categoryMap = {};
    currentTasks.forEach((task) => {
      const category = task.category || "Other";

      if (task.status === "Completed") completed++;
      else if (task.status === "To-Do" || task.status === "To Do") todo++;
      else if (task.status === "Missed") missed++;

      categoryMap[category] = (categoryMap[category] || 0) + 1;
    });

    const total = completed + todo + missed;

    const categories = Object.keys(categoryMap).map((key) => ({
      name: key,
      count: categoryMap[key],
      value: total === 0 ? 0 : Math.round((categoryMap[key] / total) * 100),
    }));
    categories.sort((a, b) => b.value - a.value);

    const completionRate =
      total === 0 ? 0 : Math.round((completed / total) * 100);

    // -------------------------
    // ✅ FINAL STATE
    // -------------------------
    setData({
      completed,
      todo,
      missed,
      totalTasks: total, // New
      avgTasksPerDay,
      completionRate,
      categories,
      graphData:limitedGraphData,
      changes,
      currentTasksRaw: currentTasks, 
      previousTasksRaw: previousTasks
    });

    setLoading(false);
  };

  return (
    <div className="reports">
      <div>
        <p className="greet">Reports & Analytics</p>
        <p className="info">Insights into your productivity trends</p>
      </div>

      <div className="toggle">
        <button
          onClick={() => setViewMode("Weekly")}
          className={viewMode === "Weekly" ? "active" : ""}
        >
          Weekly
        </button>
        <button
          onClick={() => setViewMode("Monthly")}
          className={viewMode === "Monthly" ? "active" : ""}
        >
          Monthly
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="card">
          <div className="card-container">
            {[
              { label: "Completed", key: "completed" },
              { label: "Missed", key: "missed" },
              { label: "Completion Rate", key: "completionRate", isPercent: true },
              { label: "Punctuality Score", key: "punctuality", isPercent: true, customValue: punctualityScore, customChange: punctualityChange },
            ].map((item) => {
                const displayValue = item.customValue !== undefined ? item.customValue : data[item.key];
                const displayChange = item.customChange !== undefined ? item.customChange : data.changes[item.key];
                //const colorClass = item.isPercent ? getScoreColor(displayValue) : "";
                
              return(
              <div className="task-card" key={item.key}>
                <div className="task-change">
                  <p className="head">{item.label}</p>
                  <p
                    className={`change ${
                      displayChange >= 0 ? "up" : "down"
                    }`}
                  >
                    {displayChange >= 0 ? <TfiStatsUp className="better" /> : <TfiStatsDown className="poor" />}
                    
                  </p>
                </div>
                <div className="fit">
                  <p className='num'>{item.key === "completed" || item.key === "missed"
                    ? `${displayValue}/${data.totalTasks}`
                    : `${displayValue}${item.isPercent ? "%" : ""}`}
                  </p>

                  {item.label === "Punctuality Score" && (
                      <p className="sub-num-info">
                          {onTimeCount} / {completedTotal} tasks on time
                      </p>
                  )}

                  <p
                    className={`small ${
                      displayChange > 0
                        ? "positive"
                        : displayChange < 0
                        ? "negative"
                        : ""
                    }`}>
                    {displayChange > 0
                      ? `+${displayChange}%`
                      : `${displayChange}%`} {Math.abs(displayChange) === 100 && " (max)"} from last {viewMode === "Weekly" ? "week" : "month"}
                  </p>
                </div>
              </div>
            );
          })}
          </div>

          <div className="graph-container">
            <BarGraph data={data.graphData} view={viewMode} />
          </div>

          <div className="graphs">
            <div className="pie-graph">
              <MyPieChart data={data.categories} view={viewMode} />
            </div>

            <div className="horizontal-bar">
              <CategoryBreakdown data={data.categories} view={viewMode} totalTasks={data.totalTasks} avgTasksPerDay={data.avgTasksPerDay} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}