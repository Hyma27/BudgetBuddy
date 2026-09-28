import { NavLink,useNavigate } from "react-router-dom";
import "./Sidebar.css";

function Sidebar() {
  const navigate = useNavigate();

   const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");

    navigate("/login");
  };

  return (
    <aside className="sidebar">

      {/* Brand */}
      <div className="brand">
        <div className="brand-icon">₹</div>

        <div>
          <h2>BudgetBuddy</h2>
          <span>Student Finance</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">

        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `nav-item ${isActive ? "active" : ""}`
          }
        >
          <span>⌂</span>
          Dashboard
        </NavLink>

        <NavLink
          to="/expenses"
          className={({ isActive }) =>
            `nav-item ${isActive ? "active" : ""}`
          }
        >
          <span>↗</span>
          Expenses
        </NavLink>

        <NavLink
          to="/income"
          className={({ isActive }) =>
            `nav-item ${isActive ? "active" : ""}`
          }
        >
          <span>↙</span>
          Income
        </NavLink>

        <NavLink
          to="/budgets"
          className={({ isActive }) =>
            `nav-item ${isActive ? "active" : ""}`
          }
        >
          <span>◫</span>
          Budgets
        </NavLink>

        <NavLink
          to="/notifications"
          className={({ isActive }) =>
            `nav-item ${isActive ? "active" : ""}`
          }
        >
          <span>🔔</span>
          Notifications
        </NavLink>

        <NavLink
  to="/reports"
  className={({ isActive }) =>
    `nav-item ${isActive ? "active" : ""}`
  }
>
  <span>▣</span>
  Reports
</NavLink>
      </nav>

      {/* Bottom */}
      <div className="sidebar-bottom">

  <div className="sidebar-tip">
    <span>💡</span>

    <div>
      <strong>Smart Finance</strong>
      <p>Stay on top of your spending.</p>
    </div>
  </div>

  <button
    className="logout-btn"
    onClick={handleLogout}
  >
    <span>↪</span>
    Logout
  </button>

</div>

    </aside>
  );
}

export default Sidebar;