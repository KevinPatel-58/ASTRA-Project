import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid
} from "recharts";

export default function BarGraph({ data,view }) {
    const title =
        view === "Weekly" ? "Weekly Task Completion" : "Monthly Task Completion";
    const barRadius = [6, 6, 0, 0];
  return (
    <>
    <h3>{title}</h3>
    <ResponsiveContainer width="95%" height={300}>
      <BarChart data={data} margin={{top: 5, right: 5, left: -20, bottom: 5}}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" tick={{ fontSize: window.innerWidth < 500 ? 10 : 12 }} interval={0} />
        <YAxis />
        <Tooltip cursor={{ fill: '#c4c4fd75', radius: [6, 6, 0, 0] }} />
        <Legend />

        <Bar dataKey="Completed" fill="#4F5BD5" radius={barRadius} barSize={70} /> 
        <Bar dataKey="To Do" fill="#FFC107" radius={barRadius} barSize={70} /> 
        <Bar dataKey="Missed" fill="#FF4D4F" radius={barRadius} barSize={70} /> 
      </BarChart>
    </ResponsiveContainer>
    </>
  );
}