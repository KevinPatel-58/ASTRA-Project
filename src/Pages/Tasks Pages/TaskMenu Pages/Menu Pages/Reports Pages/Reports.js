import { useEffect, useState } from "react";
import CategoryBreakdown from "./Graphs/Category";
import MyPieChart from "./Graphs/TaskDistribution";
import logo from '../../../../../assets/Astra.svg'
import "./Reports.scss";
import { supabase } from "../../../../../util/supabase";
import BarGraph from "./Graphs/BarGraph";
import { TfiStatsDown, TfiStatsUp } from "react-icons/tfi";
import { useVoice } from "../../../../../context/VoiceContext";
import { calculatePunctuality, usePunctuality } from "../../../../../Hook/usePunctuality";
import ReportSkeleton from "../../../../../Components/ReportSkeleton";
import { HiOutlineDownload } from "react-icons/hi";

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
    // DATE HELPERS
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
    // FETCH TASKS
    // -------------------------
    const { data: tasks, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user.id)
      .or(`due_date.gte.${startRange.toISOString()},actual_completed_at.gte.${startRange.toISOString()},status.eq.To-Do`)
      .lte("due_date", endRange.toISOString());

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
    // SPLIT CURRENT / PREVIOUS
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
    // COUNT FUNCTION
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
    // GRAPH DATA (CALENDAR BASED)
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
    // CATEGORY DATA
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
    // FINAL STATE
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

  // const handleExport = () => {
  //   // Prepare CSV content
  //   // const headers = ["Category", "Count", "Percentage"];
  //   // const rows = data.categories.map(cat => [cat.name, cat.count, `${cat.value}%`]);
    
  //   // // Add summary rows
  //   // rows.push([]);
  //   // rows.push(["Metric", "Value"]);
  //   // rows.push(["Total Tasks", data.totalTasks]);
  //   // rows.push(["Completion Rate", `${data.completionRate}%`]);
  //   // rows.push(["Punctuality Score", `${punctualityScore}%`]);

  //   // const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    
  //   // // Download logic
  //   // const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  //   // const url = URL.createObjectURL(blob);
  //   // const link = document.createElement("a");
  //   // link.setAttribute("href", url);
  //   // link.setAttribute("download", `ASTRA_Report_${viewMode}_${new Date().toLocaleDateString()}.csv`);
  //   // link.click();

  //   const originalTitle = document.title;
  //   document.title = `ASTRA_${viewMode}_Report_${new Date().toLocaleDateString()}`;
    
  //   //window.print();
  //   window.scrollTo(0, 0);
    
  //   setTimeout(() => {
  //       window.print();
  //   }, 500);
    
  //   // Restore original title after print dialog closes
  //   document.title = originalTitle;
  // };

  const handleExportPDF = () => {
  
    const content = document.getElementById("printable-report").innerHTML;
    const logo="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjIiIGhlaWdodD0iNjEiIHZpZXdCb3g9IjAgMCA2MiA2MSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTExLjY0MDYgNTZMMjAuNDU5IDE2LjIxNDhIMjEuNDg0NEwyNS41ODU5IDM1LjM1NTVMMjEuMDc0MiA1NkgxMS42NDA2Wk0yNi4yMDEyIDUwLjE4OTVMMjguMjUyIDQwLjc1NTlIMzAuNzEyOUwyMy40NjY4IDguMTQ4NDRIMzIuOTY4OEw0NC4yNDggNTZIMzQuNjc3N0wzMy4zMTA1IDUwLjE4OTVIMjYuMjAxMloiIGZpbGw9IiNERTA5RDAiLz4KPGxpbmUgeDE9IjkuOTk4MjUiIHkxPSI1LjI2NTciIHgyPSI0OS45OTgyIiB5Mj0iNS4yNjU3IiBzdHJva2U9IiNCODM3QTkiIHN0cm9rZS13aWR0aD0iMTAiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgo8cGF0aCBvcGFjaXR5PSIwLjciIGQ9Ik0zOC42NDg3IDM3LjI3MjhMMzUuNzI3IDI5LjY0ODVMNDMuMzUxMyAyNi43MjY4TDQ2LjI3MyAzNC4zNTExTDM4LjY0ODcgMzcuMjcyOFpNNTIuMzMxNiA2LjU4NzU0TDUzLjI0NDkgNi45OTQ4TDQxLjkxMzMgMzIuNDA3MUw0MSAzMS45OTk4TDQwLjA4NjcgMzEuNTkyNkw1MS40MTgzIDYuMTgwMjlMNTIuMzMxNiA2LjU4NzU0WiIgZmlsbD0iI0NDMzU4RiIvPgo8cGF0aCBvcGFjaXR5PSIwLjciIGQ9Ik0zNyAzMi42NjM2TDU3LjQ3MjEgNTQuNjE2MSIgc3Ryb2tlPSIjRDkyOEFDIiBzdHJva2Utd2lkdGg9IjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgo8L3N2Zz4K";
    const printWindow = document.createElement('iframe');
    printWindow.style.position = 'fixed';
    printWindow.style.right = '0';
    printWindow.style.bottom = '0';
    printWindow.style.width = '0';
    printWindow.style.height = '0';
    printWindow.style.border = '0';
    document.body.appendChild(printWindow);

    const doc = printWindow.contentWindow.document;

    doc.write(`
        <html>
            <head>
                <title>ASTRA Productivity Report</title>
                
                <style>
                    body { font-family: sans-serif; padding: 20px; color: #333; }
                    .logo {
                      height: 50px;
                      width: 50px;
                    }
                    .card-container { 
                        display: grid; 
                        grid-template-columns: 1fr 1fr; 
                        gap: 20px; 
                        margin-bottom: 40px; 
                    }
                    .task-card { 
                        border: 1px solid #eee; 
                        padding: 15px; 
                        border-radius: 10px; 
                    }
                    .num { font-size: 24px; font-weight: bold; margin: 10px 0; }
                    .head { color: #666; font-size: 14px; text-transform: uppercase; }

                    .better, .positive { color: #22c55e !important; } /* Green */
                    .poor, .negative { color: #ef4444 !important; }
                    
                    .graph-container, .pie-graph, .horizontal-bar { 
                      width: 100% !important; 
                      page-break-inside: avoid; 
                      margin-bottom: 50px;
                      display: block;
                      border: 1px solid #e0e0e0;
                      border-radius: 15px;
                      padding: 10px;
                    }

                    .report-meta {
                      text-align: right;
                      color: #666;
                      font-size: 14px;
                      margin-bottom: 20px;
                    }
                  
                    .graph-container svg.recharts-surface {
                      width: 55% !important;
                    }
                      
                    .recharts-legend-wrapper {
                        width: 25% !important;
                        left: 17% !important;
                        display: flex !important;
                        justify-self: center !important;
                    }

                    .recharts-cartesian-axis-tick-value {
                        font-size: 25px !important;
                        text-anchor: middle !important; /* Forces X-axis text to stay centered under bars */
                    }

                    h2 { border-left: 4px solid fuchsia; padding-left: 10px; margin-bottom: 20px; }
                </style>
            </head>
            <body>
              <div style="display:flex; align-items:center; gap:15px; margin-bottom:30px; justify-self:center;">
                <img src='${logo}' alt='Astra Logo' className='logo' />
                <h2>ASTRA</h2>
              </div>
              <div class="report-meta">
                  <strong>${viewMode} Report</strong><br />
                  Generated on ${new Date().toLocaleDateString()}
              </div>
                ${content}
            </body>
        </html>
    `);

    doc.close();

    // 4. Print and Cleanup
    printWindow.contentWindow.focus();
    setTimeout(() => {
        printWindow.contentWindow.print();
        document.body.removeChild(printWindow);
    }, 500);
};

  return (
    <div className="reports">
      <div className="report-header">
        <div>
          <p className="greet">Reports & Analysis</p>
          <p className="info">Insights into your productivity trends</p>
        </div>
        <button className="export-btn" onClick={() => handleExportPDF()}>
          <HiOutlineDownload />
          <span>Export Report</span>
        </button>
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
        <ReportSkeleton />
      ) : (
        <div className="card" id="printable-report">
          <div className="card-container" >
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