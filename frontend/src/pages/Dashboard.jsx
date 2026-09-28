import { useEffect, useMemo, useState } from "react";
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
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import "./Dashboard.css";
import Sidebar from "../components/Sidebar";

function Dashboard() {
  const navigate = useNavigate();

  const [expenses, setExpenses] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [savingsGoals, setSavingsGoals] = useState([]);
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("Loading your financial overview...");

  const token = localStorage.getItem("access_token");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    const loadDashboard = async () => {
      try {
        const protectedResponse = await fetch(
          "http://127.0.0.1:8000/api/protected/",
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
        ] = await Promise.all([
          fetch("http://127.0.0.1:8000/api/expense/", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("http://127.0.0.1:8000/api/income/", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("http://127.0.0.1:8000/api/budget/", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("http://127.0.0.1:8000/api/analytics/", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("http://127.0.0.1:8000/api/savings-goal/", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("http://127.0.0.1:8000/api/profile/", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (
          !expenseResponse.ok ||
          !incomeResponse.ok ||
          !budgetResponse.ok
        ) {
          throw new Error("Unable to load financial data");
        }

        const expenseData = await expenseResponse.json();
        const incomeData = await incomeResponse.json();
        const budgetData = await budgetResponse.json();

        setExpenses(Array.isArray(expenseData) ? expenseData : []);
        setIncomes(Array.isArray(incomeData) ? incomeData : []);
        setBudgets(Array.isArray(budgetData) ? budgetData : []);

        if (analyticsResponse.ok) {
          const analyticsData = await analyticsResponse.json();
          setAnalytics(analyticsData);
        }

        if (savingsResponse.ok) {
          const savingsData = await savingsResponse.json();
          setSavingsGoals(Array.isArray(savingsData) ? savingsData : []);
        }

        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          if (profileData.username) {
            setUsername(profileData.username);
          }
        }

        setMessage("Your financial overview is ready.");
      } catch (error) {
        console.error(error);
        setMessage("Unable to load dashboard data.");
      }
    };

    loadDashboard();
  }, [navigate, token]);

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
      const dateObj = new Date(Number(year), Number(monthNum) - 1, 1);
      const monthLabel = dateObj.toLocaleDateString("en-IN", {
        month: "short",
        year: "2-digit",
      });

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

  const formatAmount = (amount) => {
    return `₹${Number(amount || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="dashboard">

      {/* SIDEBAR */}
      <Sidebar />

      {/* MAIN CONTENT */}
      <main className="dashboard-main">
        {/* TOP BAR */}
        <header className="topbar">
          <div>
            <p className="eyebrow">FINANCIAL OVERVIEW & ANALYTICS</p>
            <h1>Welcome, {username || "User"} 👋</h1>
            <p className="topbar-subtitle">
              Intelligent financial insights, spending analytics, and progress tracking.
            </p>
          </div>

          <div className="status-pill">
            <span className="status-dot"></span>
            {message}
          </div>
        </header>

        {/* SUMMARY CARDS */}
        <section className="summary-grid">
          <div className="summary-card income-card">
            <div className="summary-card-top">
              <span className="summary-icon">↙</span>
              <span className="summary-label">TOTAL INCOME</span>
            </div>

            <h2>{formatAmount(totalIncome)}</h2>
            <p>Money received</p>
          </div>

          <div className="summary-card expense-card">
            <div className="summary-card-top">
              <span className="summary-icon">↗</span>
              <span className="summary-label">TOTAL EXPENSES</span>
            </div>

            <h2>{formatAmount(totalExpenses)}</h2>
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

            <h2>{formatAmount(remainingAmount)}</h2>
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
                    <YAxis stroke="#71849a" tick={{ fontSize: 11 }} tickFormatter={(val) => `₹${val}`} />
                    <Tooltip
                      formatter={(value) => [formatAmount(Number(value)), ""]}
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
                        <span>Current: <strong>{formatAmount(current)}</strong></span>
                        <span>Target: <strong>{formatAmount(target)}</strong></span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="empty-savings">
                  <div className="empty-savings-icon">💎</div>
                  <h3>Net Savings: {formatAmount(remainingAmount)}</h3>
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
                      {transaction.type === "Income" ? "+" : "-"}
                      {formatAmount(transaction.amount)}
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