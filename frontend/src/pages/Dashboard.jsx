import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import "./Dashboard.css";
import Sidebar from "../components/Sidebar";
import { API_BASE_URL } from "../config";
import {
  formatCurrency,
  formatCompactCurrency,
  formatDate,
  formatDateTime,
  formatMonthYear,
} from "../utils/formatters";

const NotificationBellIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const UserHeaderIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

function formatRelativeTime(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return "Just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} ${diffInHours === 1 ? "hour" : "hours"} ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays} ${diffInDays === 1 ? "day" : "days"} ago`;

  return formatDateTime(dateString);
}

function Dashboard() {
  const navigate = useNavigate();

  const [expenses, setExpenses] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [savingsGoals, setSavingsGoals] = useState([]);
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("Loading your financial overview...");
  const [userProfile, setUserProfile] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [notificationError, setNotificationError] = useState(false);

  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] = useState(false);

  const userDropdownRef = useRef(null);
  const notificationDropdownRef = useRef(null);

  const token = localStorage.getItem("access_token");

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target)
      ) {
        setIsUserDropdownOpen(false);
      }
      if (
        notificationDropdownRef.current &&
        !notificationDropdownRef.current.contains(event.target)
      ) {
        setIsNotificationDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleUserDropdown = () => {
    setIsUserDropdownOpen((prev) => !prev);
    setIsNotificationDropdownOpen(false);
  };

  const toggleNotificationDropdown = () => {
    setIsNotificationDropdownOpen((prev) => !prev);
    setIsUserDropdownOpen(false);
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    const loadDashboard = async () => {
      try {
        const protectedResponse = await fetch(
          `${API_BASE_URL}/api/protected/`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!protectedResponse.ok) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          navigate("/login");
          return;
        }

        const [
          expenseResponse,
          incomeResponse,
          budgetResponse,
          analyticsResponse,
          savingsResponse,
          profileResponse,
          notificationResponse,
        ] = await Promise.allSettled([
          fetch(`${API_BASE_URL}/api/expense/`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE_URL}/api/income/`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE_URL}/api/budget/`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE_URL}/api/analytics/`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE_URL}/api/savings-goal/`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE_URL}/api/profile/`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE_URL}/api/notifications/`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (
          expenseResponse.status === "rejected" ||
          !expenseResponse.value?.ok ||
          incomeResponse.status === "rejected" ||
          !incomeResponse.value?.ok ||
          budgetResponse.status === "rejected" ||
          !budgetResponse.value?.ok
        ) {
          throw new Error("Unable to load financial data");
        }

        const expenseData = await expenseResponse.value.json();
        const incomeData = await incomeResponse.value.json();
        const budgetData = await budgetResponse.value.json();

        setExpenses(Array.isArray(expenseData) ? expenseData : []);
        setIncomes(Array.isArray(incomeData) ? incomeData : []);
        setBudgets(Array.isArray(budgetData) ? budgetData : []);

        if (analyticsResponse.status === "fulfilled" && analyticsResponse.value?.ok) {
          const analyticsData = await analyticsResponse.value.json();
          setAnalytics(analyticsData);
        }

        if (savingsResponse.status === "fulfilled" && savingsResponse.value?.ok) {
          const savingsData = await savingsResponse.value.json();
          setSavingsGoals(Array.isArray(savingsData) ? savingsData : []);
        }

        if (profileResponse.status === "fulfilled" && profileResponse.value?.ok) {
          const profileData = await profileResponse.value.json();
          setUserProfile(profileData);
          if (profileData.username) {
            setUsername(profileData.username);
          }
        }

        if (notificationResponse.status === "fulfilled" && notificationResponse.value?.ok) {
          const notifData = await notificationResponse.value.json();
          setNotifications(Array.isArray(notifData) ? notifData : []);
          setNotificationError(false);
        } else {
          setNotificationError(true);
        }

        setMessage("Your financial overview is ready.");
      } catch (error) {
        console.error(error);
        setMessage("Unable to load dashboard data.");
      }
    };

    loadDashboard();
  }, [navigate, token]);

  const displayName = useMemo(() => {
    if (!username) return "User";
    return username.charAt(0).toUpperCase() + username.slice(1);
  }, [username]);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.is_read).length;
  }, [notifications]);

  const displayUnreadBadge = unreadCount > 9 ? "9+" : unreadCount;

  const latestNotifications = useMemo(() => {
    if (!notifications || notifications.length === 0) return [];
    const sorted = [...notifications].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );
    return sorted.slice(0, 2);
  }, [notifications]);

  const totalIncome = useMemo(() => {
    if (analytics?.summary?.total_income !== undefined) {
      return Number(analytics.summary.total_income);
    }
    return incomes.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  }, [incomes, analytics]);

  const totalExpenses = useMemo(() => {
    if (analytics?.summary?.total_expenses !== undefined) {
      return Number(analytics.summary.total_expenses);
    }
    return expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  }, [expenses, analytics]);

  const remainingAmount = useMemo(() => {
    if (analytics?.summary?.savings !== undefined) {
      return Number(analytics.summary.savings);
    }
    return totalIncome - totalExpenses;
  }, [totalIncome, totalExpenses, analytics]);

  const expenseChartData = useMemo(() => {
    if (analytics?.category_wise_expenses && analytics.category_wise_expenses.length > 0) {
      return analytics.category_wise_expenses.map((item) => ({
        name: item.category,
        value: Number(item.total || 0),
      }));
    }

    const categoryTotals = {};
    expenses.forEach((expense) => {
      const category = expense.category || "Miscellaneous";
      categoryTotals[category] =
        (categoryTotals[category] || 0) + Number(expense.amount || 0);
    });

    return Object.entries(categoryTotals).map(([name, value]) => ({
      name,
      value,
    }));
  }, [expenses, analytics]);

  const monthlyTrendChartData = useMemo(() => {
    if (!analytics?.monthly_trends) return [];

    const incomeTrends = analytics.monthly_trends.income || [];
    const expenseTrends = analytics.monthly_trends.expenses || [];

    const monthsSet = new Set([
      ...incomeTrends.map((i) => i.month),
      ...expenseTrends.map((e) => e.month),
    ]);

    const sortedMonths = Array.from(monthsSet).sort();

    return sortedMonths.map((monthStr) => {
      const inc = incomeTrends.find((i) => i.month === monthStr);
      const exp = expenseTrends.find((e) => e.month === monthStr);

      const [year, monthNum] = monthStr.split("-");
      const monthLabel = formatMonthYear(monthNum, year.slice(-2));

      return {
        month: monthLabel,
        Income: Number(inc?.total || 0),
        Expenses: Number(exp?.total || 0),
      };
    });
  }, [analytics]);

  const recentTransactions = useMemo(() => {
    const transactions = [
      ...incomes.map((item) => ({
        id: `income-${item.id}`,
        title: item.source,
        amount: Number(item.amount || 0),
        date: item.income_date,
        type: "Income",
      })),
      ...expenses.map((item) => ({
        id: `expense-${item.id}`,
        title: item.title,
        amount: Number(item.amount || 0),
        date: item.expense_date,
        type: "Expense",
      })),
    ];

    return transactions
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 6);
  }, [incomes, expenses]);

  return (
    <div className="dashboard">

      {/* SIDEBAR */}
      <Sidebar />

      {/* MAIN CONTENT */}
      <main className="dashboard-main">
        {/* TOP BAR */}
        <header className="topbar">
          <div>
            <p className="eyebrow">FINANCIAL OVERVIEW</p>
            <h1>Welcome, {displayName} 👋</h1>
            <p className="topbar-subtitle">
              Intelligent financial insights, spending analytics, and progress tracking.
            </p>
          </div>

          <div className="topbar-right">
            <div className="status-pill">
              <span className="status-dot"></span>
              {message}
            </div>

            <div className="header-actions">
              {/* NOTIFICATION BELL */}
              <div className="header-action-container" ref={notificationDropdownRef}>
                <button
                  className={`header-icon-btn ${
                    isNotificationDropdownOpen ? "active" : ""
                  }`}
                  onClick={toggleNotificationDropdown}
                  aria-label="Notifications"
                  title="Notifications"
                >
                  <NotificationBellIcon />
                  {unreadCount > 0 && (
                    <span className="notification-badge">{displayUnreadBadge}</span>
                  )}
                </button>

                {isNotificationDropdownOpen && (
                  <div className="header-dropdown notification-dropdown">
                    <div className="dropdown-title-bar">
                      <h3>Notifications</h3>
                      {unreadCount > 0 && (
                        <span className="dropdown-unread-count">{unreadCount}</span>
                      )}
                    </div>

                    <div className="dropdown-divider"></div>

                    <div className="dropdown-list">
                      {notificationError ? (
                        <div className="dropdown-empty">Unable to load notifications</div>
                      ) : notifications.length === 0 ? (
                        <div className="dropdown-empty">No new notifications</div>
                      ) : (
                        latestNotifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`dropdown-notif-item ${
                              notification.is_read ? "read" : "unread"
                            }`}
                          >
                            <div className="notif-item-header">
                              <span className="notif-icon">
                                {notification.notification_type === "Budget Limit Alert"
                                  ? "⚠️"
                                  : "🔔"}
                              </span>
                              <strong className="notif-title">
                                {notification.notification_type}
                              </strong>
                            </div>
                            <p className="notif-message">{notification.message}</p>
                            <span className="notif-time">
                              {formatRelativeTime(notification.created_at)}
                            </span>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="dropdown-divider"></div>

                    <button
                      className="dropdown-action-btn"
                      onClick={() => {
                        setIsNotificationDropdownOpen(false);
                        navigate("/notifications");
                      }}
                    >
                      <span>View all notifications</span>
                      <span className="arrow">→</span>
                    </button>
                  </div>
                )}
              </div>

              {/* USER PROFILE */}
              <div className="header-action-container" ref={userDropdownRef}>
                <button
                  className={`header-icon-btn ${isUserDropdownOpen ? "active" : ""}`}
                  onClick={toggleUserDropdown}
                  aria-label="User Profile"
                  title="User Profile"
                >
                  <UserHeaderIcon />
                </button>

                {isUserDropdownOpen && (
                  <div className="header-dropdown user-dropdown">
                    <div className="user-dropdown-info">
                      <div className="user-avatar">
                        {(userProfile?.username || username || "U")
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                      <div className="user-details">
                        <strong className="user-name">
                          {userProfile?.username || username || "User"}
                        </strong>
                        {userProfile?.email && (
                          <span className="user-email">{userProfile.email}</span>
                        )}
                        <span className="user-role-badge">
                          {userProfile?.role
                            ? userProfile.role.charAt(0).toUpperCase() +
                              userProfile.role.slice(1)
                            : "Student"}
                        </span>
                      </div>
                    </div>

                    <div className="dropdown-divider"></div>

                    <button
                      className="dropdown-action-btn"
                      onClick={() => {
                        setIsUserDropdownOpen(false);
                        navigate("/profile");
                      }}
                    >
                      <span>Profile Settings</span>
                      <span className="arrow">→</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* SUMMARY CARDS */}
        <section className="summary-grid">
          <div className="summary-card income-card">
            <div className="summary-card-top">
              <span className="summary-icon">↙</span>
              <span className="summary-label">TOTAL INCOME</span>
            </div>

            <h2>{formatCurrency(Math.abs(totalIncome))}</h2>
            <p>Money received</p>
          </div>

          <div className="summary-card expense-card">
            <div className="summary-card-top">
              <span className="summary-icon">↗</span>
              <span className="summary-label">TOTAL EXPENSES</span>
            </div>

            <h2>{formatCurrency(Math.abs(totalExpenses))}</h2>
            <p>Money spent</p>
          </div>

          <div
            className={`summary-card ${
              remainingAmount >= 0 ? "balance-card" : "negative-card"
            }`}
          >
            <div className="summary-card-top">
              <span className="summary-icon">₹</span>
              <span className="summary-label">NET SAVINGS</span>
            </div>

            <h2>{formatCurrency(Math.abs(remainingAmount))}</h2>
            <p>Income − Expenses</p>
          </div>

          <div className="summary-card budget-card">
            <div className="summary-card-top">
              <span className="summary-icon">◫</span>
              <span className="summary-label">ACTIVE BUDGETS</span>
            </div>

            <h2>{budgets.length}</h2>
            <p>Budget plans created</p>
          </div>
        </section>

        {/* ANALYTICS CHARTS GRID */}
        <section className="dashboard-content-grid">
          {/* PIE CHART - CATEGORY SPENDING */}
          <div className="section chart-section">
            <div className="section-header">
              <div>
                <p className="section-kicker">SPENDING ANALYSIS</p>
                <h2>Category Spending</h2>
              </div>

              <span className="section-badge">
                {expenseChartData.length} categories
              </span>
            </div>

            <div className="chart-wrapper">
              {expenseChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={expenseChartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={105}
                      innerRadius={58}
                      paddingAngle={3}
                      dataKey="value"
                      nameKey="name"
                    >
                      {expenseChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            [
                              "#22d3ee",
                              "#3b82f6",
                              "#8b5cf6",
                              "#14b8a6",
                              "#f59e0b",
                              "#ec4899",
                            ][index % 6]
                          }
                        />
                      ))}
                    </Pie>

                    <Tooltip
                      formatter={(value) => [
                        formatAmount(Number(value)),
                        "Amount",
                      ]}
                      contentStyle={{
                        background: "#071a35",
                        border: "1px solid rgba(34, 211, 238, 0.35)",
                        borderRadius: "12px",
                        color: "#ffffff",
                      }}
                    />

                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-chart">
                  <div className="empty-chart-icon">📊</div>
                  <h3>No expense data yet</h3>
                  <p>
                    Add your first expense to see your spending breakdown.
                  </p>

                  <button
                    className="primary-btn"
                    onClick={() => navigate("/expenses")}
                  >
                    Add Expense
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* MONTHLY TRENDS CHART */}
          <div className="section chart-section">
            <div className="section-header">
              <div>
                <p className="section-kicker">MONTHLY ANALYTICS</p>
                <h2>Monthly Trends</h2>
              </div>

              <span className="section-badge">Income vs. Expenses</span>
            </div>

            <div className="chart-wrapper">
              {monthlyTrendChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={monthlyTrendChartData} margin={{ top: 15, right: 15, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
                    <XAxis dataKey="month" stroke="#71849a" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#71849a" tick={{ fontSize: 11 }} tickFormatter={formatCompactCurrency} />
                    <Tooltip
                      formatter={(value) => [formatCurrency(Number(value)), ""]}
                      contentStyle={{
                        background: "#071a35",
                        border: "1px solid rgba(56, 189, 248, 0.35)",
                        borderRadius: "12px",
                        color: "#ffffff",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="Income" fill="#38bdf8" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="Expenses" fill="#fb7185" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-chart">
                  <div className="empty-chart-icon">📈</div>
                  <h3>No monthly trend data</h3>
                  <p>Record income and expenses across months to see your trend.</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* FINANCIAL TRENDS LINE CHART */}
        <section className="dashboard-content-grid single-chart-grid">
          <div className="section chart-section full-width-chart">
            <div className="section-header">
              <div>
                <p className="section-kicker">FINANCIAL TRENDS</p>
                <h2>Cash Flow Trends</h2>
              </div>

              <span className="section-badge">Over Time</span>
            </div>

            <div className="chart-wrapper">
              {monthlyTrendChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart
                    data={monthlyTrendChartData}
                    margin={{ top: 15, right: 15, left: -10, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(148, 163, 184, 0.1)"
                    />
                    <XAxis
                      dataKey="month"
                      stroke="#71849a"
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis
                      stroke="#71849a"
                      tick={{ fontSize: 11 }}
                      tickFormatter={formatCompactCurrency}
                    />
                    <Tooltip
                      formatter={(value) => [
                        formatCurrency(Number(value)),
                        "",
                      ]}
                      contentStyle={{
                        background: "#071a35",
                        border: "1px solid rgba(56, 189, 248, 0.35)",
                        borderRadius: "12px",
                        color: "#ffffff",
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="Income"
                      stroke="#38bdf8"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: "#38bdf8" }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="Expenses"
                      stroke="#fb7185"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: "#fb7185" }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-chart">
                  <div className="empty-chart-icon">📈</div>
                  <h3>No monthly trend data</h3>
                  <p>
                    Record income and expenses across months to see your
                    trend.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* SAVINGS PROGRESS & RECENT ACTIVITY GRID */}
        <section className="dashboard-content-grid">
          {/* SAVINGS PROGRESS SECTION */}
          <div className="section savings-section">
            <div className="section-header">
              <div>
                <p className="section-kicker">GOAL TRACKER</p>
                <h2>Savings Progress</h2>
              </div>

              <span className="section-badge">
                {savingsGoals.length} goals
              </span>
            </div>

            <div className="savings-list">
              {savingsGoals.length > 0 ? (
                savingsGoals.map((goal) => {
                  const target = Number(goal.target_amount || 1);
                  const current = Number(goal.current_amount || 0);
                  const percent = Math.min(100, Math.round((current / target) * 100));

                  return (
                    <div className="savings-goal-card" key={goal.id}>
                      <div className="goal-top">
                        <div className="goal-title-wrap">
                          <span className="goal-icon">🎯</span>
                          <div>
                            <strong>{goal.goal_name}</strong>
                            <small>Target Date: {formatDate(goal.target_date)}</small>
                          </div>
                        </div>

                        <span className={`goal-pill ${percent >= 100 ? "completed" : "in-progress"}`}>
                          {percent >= 100 ? "✓ Reached" : `${percent}%`}
                        </span>
                      </div>

                      <div className="goal-progress-bar">
                        <div
                          className="goal-progress-fill"
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>

                      <div className="goal-amounts">
                        <span>Current: <strong>{formatCurrency(current)}</strong></span>
                        <span>Target: <strong>{formatCurrency(target)}</strong></span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="empty-savings">
                  <div className="empty-savings-icon">💎</div>
                  <h3>Net Savings: {formatCurrency(remainingAmount)}</h3>
                  <p>
                    Set up your savings goals in the platform to track milestone targets.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* RECENT ACTIVITY */}
          <div className="section recent-section">
            <div className="section-header">
              <div>
                <p className="section-kicker">LATEST TRANSACTIONS</p>
                <h2>Recent Activity</h2>
              </div>

              <button
                className="text-btn"
                onClick={() => navigate("/expenses")}
              >
                View All →
              </button>
            </div>

            <div className="activity-list">
              {recentTransactions.length > 0 ? (
                recentTransactions.map((transaction) => (
                  <div className="activity-item" key={transaction.id}>
                    <div
                      className={`activity-icon ${
                        transaction.type === "Income"
                          ? "activity-income"
                          : "activity-expense"
                      }`}
                    >
                      {transaction.type === "Income" ? "↙" : "↗"}
                    </div>

                    <div className="activity-info">
                      <strong>{transaction.title}</strong>
                      <span>{formatDate(transaction.date)}</span>
                    </div>

                    <div
                      className={`activity-amount ${
                        transaction.type === "Income"
                          ? "amount-income"
                          : "amount-expense"
                      }`}
                    >
                      {transaction.type === "Income"
                        ? formatCurrency(transaction.amount, true)
                        : formatCurrency(-transaction.amount)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-activity">
                  <span>🧾</span>
                  <h3>No recent activity</h3>
                  <p>Your latest income and expenses will appear here.</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* QUICK ACTIONS */}
        <section className="quick-actions">
          <div>
            <p className="section-kicker">QUICK ACTIONS</p>
            <h2>Manage Your Money</h2>
          </div>

          <div className="quick-action-buttons">
            <button
              className="quick-btn expense-quick"
              onClick={() => navigate("/expenses")}
            >
              <span>↗</span>
              <div>
                <strong>Manage Expenses</strong>
                <small>Add, edit or review expenses</small>
              </div>
            </button>

            <button
              className="quick-btn income-quick"
              onClick={() => navigate("/income")}
            >
              <span>↙</span>
              <div>
                <strong>Manage Income</strong>
                <small>Track your income sources</small>
              </div>
            </button>

            <button
              className="quick-btn budget-quick"
              onClick={() => navigate("/budgets")}
            >
              <span>◫</span>
              <div>
                <strong>Manage Budgets</strong>
                <small>Plan and monitor budgets</small>
              </div>
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Dashboard;