import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer
} from "recharts";

export default function DashboardGraph({data}) {
  return (
    <div className="graph-card">
      <h3>Weekly Tasks Completion</h3>
      <ResponsiveContainer width="95%" height={280}>
        <LineChart data={data} margin={{top: 5, right: 5, left: -20, bottom: 5}}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="day" />
          <YAxis />
          <Tooltip labelStyle={{color:'black'}} />
          <Line
            type="monotone"
            dataKey="tasks"
            stroke="#4f46e5"
            strokeWidth={3}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}