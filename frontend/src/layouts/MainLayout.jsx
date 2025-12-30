import { Link } from "react-router-dom";

function MainLayout({ children }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <div
        style={{
          width: "220px",
          background: "#f5f7fb",
          padding: "20px",
        }}
      >
        <h3>Smart Scheduler</h3>
        <nav style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <Link to="/">Dashboard</Link>
          <Link to="/subjects">Subjects</Link>
          <Link to="/topics">Topics</Link>
          <Link to="/scheduler">Scheduler</Link>
        </nav>
      </div>

      <div style={{ flex: 1, padding: "30px" }}>{children}</div>
    </div>
  );
}

export default MainLayout;
