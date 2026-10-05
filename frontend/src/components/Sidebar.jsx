import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "./Sidebar.css";

// SVG Outline Icons (Clean Finance/Dashboard Style)
const DashboardIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const ExpensesIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="20" height="14" rx="3" />
    <line x1="2" y1="10" x2="22" y2="10" />
    <path d="M12 14l-3 3m0 0l-3-3m3 3V12" stroke="#f43f5e" strokeWidth="2" />
  </svg>
);

const IncomeIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="20" height="14" rx="3" />
    <line x1="2" y1="10" x2="22" y2="10" />
    <path d="M12 17v-5m0 0l-3 3m3-3l3 3" stroke="#10b981" strokeWidth="2" />
  </svg>
);

const BudgetsIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
    <path d="M22 12A10 10 0 0 0 12 2v10z" />
  </svg>
);

const SavingsGoalsIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" fill="currentColor" />
  </svg>
);

const TransactionsIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 2v20l3-2 3 2 3-2 3 2 3-2 3 2V2l-3 2-3-2-3 2-3-2-3 2-3-2z" />
    <line x1="8" y1="8" x2="16" y2="8" />
    <line x1="8" y1="12" x2="16" y2="12" />
    <line x1="8" y1="16" x2="12" y2="16" />
  </svg>
);

const NotificationsIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    <circle cx="18" cy="4" r="3.5" fill="#f43f5e" stroke="#060e1e" strokeWidth="1.5" />
  </svg>
);

const ReportsIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="8" y1="18" x2="8" y2="14" />
    <line x1="12" y1="18" x2="12" y2="11" />
    <line x1="16" y1="18" x2="16" y2="16" />
  </svg>
);

const ProfileIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="8.5" cy="7" r="3.5" />
    <circle cx="18" cy="13" r="2.5" />
    <path d="M18 9.5v1m0 5v1m-3.5-3.5h1m5 0h1" />
  </svg>
);

const LogoutIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

function Sidebar() {
  const navigate = useNavigate();

  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem("budgetbuddy_sidebar_collapsed") === "true";
  });

  useEffect(() => {
    const width = isCollapsed ? "75px" : "260px";
    document.documentElement.style.setProperty("--sidebar-width", width);
    document.body.classList.toggle("sidebar-collapsed", isCollapsed);
    localStorage.setItem("budgetbuddy_sidebar_collapsed", isCollapsed ? "true" : "false");
  }, [isCollapsed]);

  const toggleSidebar = () => {
    setIsCollapsed((prev) => !prev);
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    navigate("/login");
  };

  return (
    <aside className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
      {/* Brand Header */}
      <div className="brand">
        <div className="brand-logo-area">
          <div className="brand-icon">₹</div>
        </div>
        <div className="brand-text">
          <h2>
            <span className="brand-budget">Budget</span>
            <span className="brand-buddy">Buddy</span>
          </h2>
        </div>
        <button
          className="sidebar-toggle"
          onClick={toggleSidebar}
          aria-label={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? "»" : "«"}
        </button>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `nav-item ${isActive ? "active" : ""}`
          }
          data-tooltip="Dashboard"
        >
          <span className="nav-icon"><DashboardIcon /></span>
          <span className="nav-label">Dashboard</span>
        </NavLink>

        <NavLink
          to="/expenses"
          className={({ isActive }) =>
            `nav-item ${isActive ? "active" : ""}`
          }
          data-tooltip="Expenses"
        >
          <span className="nav-icon"><ExpensesIcon /></span>
          <span className="nav-label">Expenses</span>
        </NavLink>

        <NavLink
          to="/income"
          className={({ isActive }) =>
            `nav-item ${isActive ? "active" : ""}`
          }
          data-tooltip="Income"
        >
          <span className="nav-icon"><IncomeIcon /></span>
          <span className="nav-label">Income</span>
        </NavLink>

        <NavLink
          to="/budgets"
          className={({ isActive }) =>
            `nav-item ${isActive ? "active" : ""}`
          }
          data-tooltip="Budgets"
        >
          <span className="nav-icon"><BudgetsIcon /></span>
          <span className="nav-label">Budgets</span>
        </NavLink>

        <NavLink
          to="/savings-goals"
          className={({ isActive }) =>
            `nav-item ${isActive ? "active" : ""}`
          }
          data-tooltip="Savings Goals"
        >
          <span className="nav-icon"><SavingsGoalsIcon /></span>
          <span className="nav-label">Savings Goals</span>
        </NavLink>

        <NavLink
          to="/transactions"
          className={({ isActive }) =>
            `nav-item ${isActive ? "active" : ""}`
          }
          data-tooltip="Transactions"
        >
          <span className="nav-icon"><TransactionsIcon /></span>
          <span className="nav-label">Transactions</span>
        </NavLink>

        <NavLink
          to="/notifications"
          className={({ isActive }) =>
            `nav-item ${isActive ? "active" : ""}`
          }
          data-tooltip="Notifications"
        >
          <span className="nav-icon"><NotificationsIcon /></span>
          <span className="nav-label">Notifications</span>
        </NavLink>

        <NavLink
          to="/reports"
          className={({ isActive }) =>
            `nav-item ${isActive ? "active" : ""}`
          }
          data-tooltip="Reports"
        >
          <span className="nav-icon"><ReportsIcon /></span>
          <span className="nav-label">Reports</span>
        </NavLink>

        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `nav-item ${isActive ? "active" : ""}`
          }
          data-tooltip="Profile Settings"
        >
          <span className="nav-icon"><ProfileIcon /></span>
          <span className="nav-label">Profile Settings</span>
        </NavLink>
      </nav>

      {/* Bottom */}
      <div className="sidebar-bottom">
        <div className="sidebar-tip">
          <span className="tip-icon">💡</span>
          <div className="tip-text">
            <strong>Smart Finance</strong>
            <p>Stay on top of your spending.</p>
          </div>
        </div>

        <button
          className="logout-btn"
          onClick={handleLogout}
          data-tooltip="Logout"
        >
          <span className="logout-icon"><LogoutIcon /></span>
          <span className="logout-label">Logout</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;