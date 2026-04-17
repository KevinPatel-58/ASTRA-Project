import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer
} from "recharts";

const COLORS = ["#4F5BD5", "#FF4D79", "#9C27B0", "#4CAF50", "#FFC107"];


export default function MyPieChart({ data,view }) {
  const title =
    view === "Weekly"
      ? "Weekly Task Categories Distribution"
      : "Monthly Task Categories Distribution";
  return (
    <div>
      <h3>{title}</h3>

      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            label={({ name, value }) => `${name}: ${value}%`}
            outerRadius={100}
            dataKey="value"
            isAnimationActive={false}
          >
            {data.map((entry, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>

          <Tooltip isAnimationActive={false} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}