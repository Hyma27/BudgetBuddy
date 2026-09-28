import { useEffect, useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import "./Budget.css";
import Sidebar from "../components/Sidebar";

function Budgets() {
  const navigate = useNavigate();

  const [budgets, setBudgets] = useState([]);
  const [message, setMessage] = useState("");

  const [budget, setBudget] = useState({
    amount: "",
    category: "Food",
    period: "September",
  });

  const fetchBudgets = async () => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/budget/",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setBudgets(Array.isArray(data) ? data : []);
      } else {
        console.error("Budget error:", data);
      }
    } catch (error) {
      console.error(error);
      setMessage("Unable to connect to the backend.");
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, []);

  const handleChange = (e) => {
    setBudget({
      ...budget,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");

    const token = localStorage.getItem("access_token");

    if (!token) {
      navigate("/login");
      return;
    }

    if (!budget.amount || Number(budget.amount) <= 0) {
      setMessage("Please enter a valid budget amount.");
      return;
    }

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/budget/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            amount: budget.amount,
            category: budget.category,
            period: budget.period,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMessage("Budget created successfully!");

        setBudget({
          amount: "",
          category: "Food",
          period: "September",
        });

        fetchBudgets();
      } else {
        console.error("Budget error:", data);
        setMessage("Failed to create budget.");
      }
    } catch (error) {
      console.error(error);
      setMessage("Unable to connect to the backend.");
    }
  };


  const generateMonthlyReport = async () => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/reports/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            month: "2026-09",
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMessage("Monthly report generated successfully!");
        console.log("Report:", data);
      } else {
        console.error("Report error:", data);
        setMessage(
          data.error || JSON.stringify(data)
        );
      }
    } catch (error) {
      console.error(error);
      setMessage("Unable to connect to the backend.");
    }
  };


  const totalBudget = budgets.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  const formatAmount = (amount) => {
    return `₹${amount.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    navigate("/login");
  };

  return (
    <div className="budgets-page">

      {/* SIDEBAR */}
        <Sidebar />

      {/* MAIN CONTENT */}
      <main className="budgets-main">

        <header className="budgets-header">

          <div>
            <p className="page-kicker">
              BUDGET MANAGEMENT
            </p>

            <h1>Budgets</h1>

            <p>
              Plan your spending and stay within your limits.
            </p>
          </div>

        </header>


        {/* SUMMARY */}
        <section className="budget-summary">
          <div className="budget-summary-card">
            <div className="summary-icon">◫</div>

            <div>
              <span>ACTIVE BUDGETS</span>
              <strong>{budgets.length}</strong>
            </div>
          </div>

          <div className="budget-summary-card">
            <div className="summary-icon">₹</div>

            <div>
              <span>TOTAL BUDGET LIMIT</span>
              <strong>{formatAmount(totalBudget)}</strong>
            </div>
          </div>
        </section>

        {/* CREATE BUDGET */}
        <section className="budget-create-section">

          <div className="section-heading">

            <div>
              <p>CREATE PLAN</p>
              <h2>Create a Budget</h2>
            </div>

            <button
              type="button"
              className="generate-report-btn"
              onClick={generateMonthlyReport}
            >
              Generate September Report
            </button>

          </div>

          {message && (
            <p className="budget-message">
              {message}
            </p>
          )}

          <form
            className="budget-form"
            onSubmit={handleSubmit}
          >

            <div className="form-group">

              <label>Budget Amount</label>

              <input
                type="number"
                name="amount"
                value={budget.amount}
                onChange={handleChange}
                placeholder="Enter amount"
                min="0.01"
                step="0.01"
                required
              />

            </div>

            <div className="form-group">

              <label>Category</label>

              <select
                name="category"
                value={budget.category}
                onChange={handleChange}
              >
                <option value="Food">Food</option>
                <option value="Travel">Travel</option>
                <option value="Shopping">Shopping</option>
                <option value="Education">Education</option>
                <option value="Entertainment">
                  Entertainment
                </option>
                <option value="Miscellaneous">
                  Miscellaneous
                </option>
              </select>

            </div>

            <div className="form-group">

              <label>Month</label>

              <select
                name="period"
                value={budget.period}
                onChange={handleChange}
              >
                <option value="January">January</option>
                <option value="February">February</option>
                <option value="March">March</option>
                <option value="April">April</option>
                <option value="May">May</option>
                <option value="June">June</option>
                <option value="July">July</option>
                <option value="August">August</option>
                <option value="September">September</option>
                <option value="October">October</option>
                <option value="November">November</option>
                <option value="December">December</option>
              </select>

            </div>

            <button
              type="submit"
              className="create-budget-btn"
            >
              + Create Budget
            </button>

          </form>
        </section>

        {/* BUDGET HISTORY */}
        <section className="budget-history-section">

          <div className="section-heading">

            <div>
              <p>BUDGET PLANS</p>
              <h2>Your Budgets</h2>
            </div>

            <span>
              {budgets.length} budgets
            </span>

          </div>

          {budgets.length === 0 ? (

            <div className="empty-budget">

              <div className="empty-icon">
                💰
              </div>

              <h3>No budgets yet</h3>

              <p>
                Create your first budget to start managing
                your spending.
              </p>

            </div>

          ) : (

            <div className="budget-grid">

              {budgets.map((item) => (

                <div
                  className="budget-card"
                  key={item.id}
                >

                  <div className="budget-card-top">

                    <div className="budget-category-icon">
                      ₹
                    </div>

                    <span className="period-pill">
                      {item.period}
                    </span>

                  </div>

                  <p className="budget-category">
                    {item.category}
                  </p>

                  <h3>
                    {formatAmount(Number(item.amount))}
                  </h3>

                  <div className="budget-progress">

                    <div className="progress-label">
                      <span>Budget Limit</span>
                      <span>100%</span>
                    </div>

                    <div className="progress-track">
                      <div className="progress-fill"></div>
                    </div>

                  </div>

                  <p className="budget-created">
                    Budget ID: #{item.id}
                  </p>

                </div>

              ))}

            </div>

          )}

        </section>

      </main>

    </div>
  );
}

export default Budgets;