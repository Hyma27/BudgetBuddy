import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./Budget.css";
import Sidebar from "../components/Sidebar";
import { API_BASE_URL } from "../config";
import { formatCurrency } from "../utils/formatters";

function Budgets() {
  const navigate = useNavigate();

  const [budgets, setBudgets] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [message, setMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isMonthOpen, setIsMonthOpen] = useState(false);
  const monthDropdownRef = useRef(null);

  const [budget, setBudget] = useState({
    amount: "",
    category: "Food",
    period: "September",
  });

  const token = localStorage.getItem("access_token");

  const categories = [
    "Food",
    "Travel",
    "Shopping",
    "Education",
    "Entertainment",
    "Miscellaneous",
  ];

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const fetchBudgets = async () => {
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/budget/`,
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

  const fetchExpenses = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/expense/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setExpenses(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchBudgets();
    fetchExpenses();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        monthDropdownRef.current &&
        !monthDropdownRef.current.contains(event.target)
      ) {
        setIsMonthOpen(false);
      }
    };

    if (isMonthOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMonthOpen]);

  const handleChange = (e) => {
    setBudget({
      ...budget,
      [e.target.name]: e.target.value,
    });
    setMessage("");
  };

  const openAddModal = () => {
    setBudget({
      amount: "",
      category: "Food",
      period: "September",
    });
    setMessage("");
    setIsMonthOpen(false);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setIsMonthOpen(false);
    setBudget({
      amount: "",
      category: "Food",
      period: "September",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");

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
        `${API_BASE_URL}/api/budget/`,
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

        await fetchBudgets();

        setTimeout(() => {
          closeModal();
          setMessage("");
        }, 700);
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
    if (!token) {
      navigate("/login");
      return;
    }

    const currentYearMonth = new Date().toISOString().slice(0, 7);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/reports/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            month: currentYearMonth,
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

  const getCategoryExpenses = (category) => {
    return expenses
      .filter(
        (exp) =>
          exp.category &&
          exp.category.toLowerCase() === category.toLowerCase()
      )
      .reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
  };

  return (
    <div className="budgets-page">

      {/* SIDEBAR */}
      <Sidebar />

      {/* MAIN CONTENT */}
      <main className="budgets-main">

        {/* HEADER */}
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

          <button className="add-budget-btn" onClick={openAddModal}>
            <span>+</span>
            Add Budget
          </button>

        </header>

        {/* MESSAGE */}
        {message && (
          <p className="budget-message">
            {message}
          </p>
        )}

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
              <strong>{formatCurrency(totalBudget)}</strong>
            </div>
          </div>
        </section>

        {/* BUDGET HISTORY */}
        <section className="budget-history-section">

          <div className="section-heading">

            <div>
              <p>BUDGET PLANS</p>
              <h2>Your Budgets</h2>
            </div>

            <button
              type="button"
              className="generate-report-btn"
              onClick={generateMonthlyReport}
            >
              Generate Monthly Report
            </button>

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

              {budgets.map((item) => {
                const limit = Number(item.amount || 0);
                const spent = getCategoryExpenses(item.category);
                const pct = limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : 0;
                const remaining = Math.max(0, limit - spent);

                return (
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
                      {formatCurrency(limit)}
                    </h3>

                    <div className="budget-progress">

                      <div className="progress-label">
                        <span>Spent {formatCurrency(spent)} of {formatCurrency(limit)}</span>
                        <span>{pct}% used</span>
                      </div>

                      <div className="progress-track">
                        <div
                          className="progress-fill"
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>

                    </div>

                    <p className="budget-created">
                      Remaining: {formatCurrency(remaining)}
                    </p>

                  </div>
                );
              })}

            </div>

          )}

        </section>

      </main>

      {/* ADD BUDGET MODAL */}
      {showModal && (
        <div
          className="modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              closeModal();
            }
          }}
        >
          <div className="budget-modal">
            <div className="modal-header">
              <div>
                <p>NEW BUDGET PLAN</p>
                <h2>Add Budget</h2>
              </div>

              <button className="close-modal" onClick={closeModal}>
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
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
                  required
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group month-select-group" ref={monthDropdownRef}>
                <label>Month</label>

                <div
                  className={`custom-select-trigger ${isMonthOpen ? "open" : ""}`}
                  onClick={() => setIsMonthOpen(!isMonthOpen)}
                >
                  <span>{budget.period}</span>
                  <span className={`dropdown-arrow ${isMonthOpen ? "up" : ""}`}>
                    ▼
                  </span>
                </div>

                {isMonthOpen && (
                  <div className="custom-dropdown-menu">
                    {months.map((m) => {
                      const isSelected = budget.period === m;
                      return (
                        <div
                          key={m}
                          className={`custom-dropdown-option ${
                            isSelected ? "selected" : ""
                          }`}
                          onClick={() => {
                            setBudget({ ...budget, period: m });
                            setIsMonthOpen(false);
                            setMessage("");
                          }}
                        >
                          <span>{m}</span>
                          {isSelected && (
                            <span className="checkmark-icon">✓</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={closeModal}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="save-budget-btn"
                >
                  Create Budget
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default Budgets;