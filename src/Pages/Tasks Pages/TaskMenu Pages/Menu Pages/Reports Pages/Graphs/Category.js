import '../../../../../../App.scss';

const COLORS = ["#4F5BD5", "#FF4D79", "#9C27B0", "#4CAF50", "#FFC107"];

export default function CategoryBreakdown({ data,view,totalTasks,avgTasksPerDay }) {

  const title =
    view === "Weekly"
      ? "Weekly Category Breakdown"
      : "Monthly Category Breakdown";

  const total = data.reduce((acc, item) => acc + item.value, 0);

  const mostActive =
    data.length > 0
      ? data.reduce((prev, curr) =>
          prev.value > curr.value ? prev : curr
        )
      : null;

  return (
    <div>
      <h3>{title}</h3>

      {data.map((item, index) => {
        const color = COLORS[index % COLORS.length];

        return (
          <div key={item.name} style={{ marginBottom: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{fontSize:'large'}}>{item.name}</span>
              <span style={{ color:"var(--subtext)", fontSize:'large' }}>{item.value}%</span>
            </div>

            <div
              style={{
                height: 8,
                background: "#eee",
                borderRadius: 5,
                marginTop: 6
              }}
            >
              <div
                style={{
                  width: `${item.value}%`,
                  background: color, 
                  height: "100%",
                  borderRadius: 5
                }}
              />
            </div>
          </div>
        );
      })}

      <hr style={{ margin: "30px 0", borderColor:'rgb(245, 245, 255)' }} />

      <div style={{ display: "flex", justifyContent: "space-between",color: "black",fontSize:'large',marginTop:'30px' }}>
        <span style={{color:'var(--subtext)'}}>Total Tasks</span>
        <span style={{color:'var(--text)'}}>{totalTasks} Tasks</span>
      </div>

      {mostActive && (
        <div style={{ display: "flex", justifyContent: "space-between",color: "black",fontSize:'large',marginTop:'10px' }}>
          <p style={{color:'var(--subtext)'}}>Most Active</p>
          <p style={{color:'var(--text)'}}>
            {mostActive.name} ({mostActive.value}%)
          </p>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 'large',marginTop:"10px"}}>
        <span style={{ color: 'var(--subtext)' }}>Avg. Tasks / Day</span>
        <span style={{ color: 'var(--text)' }}>{avgTasksPerDay}</span>
      </div>

    </div>
  );
}