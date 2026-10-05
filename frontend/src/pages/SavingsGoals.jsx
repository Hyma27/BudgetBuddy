import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./SavingsGoals.css";
import Sidebar from "../components/Sidebar";
import { API_BASE_URL } from "../config";
import { formatCurrency, formatDate } from "../utils/formatters";

function SavingsGoals() {
  const navigate = useNavigate();

  const [savingsGoals, setSavingsGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState(null);

  const [formData, setFormData] = useState({
    goal_name: "",
    target_amount: "",
    current_amount: "0",
    target_date: "",
  });

  const [formError, setFormError] = useState("");

  const token = localStorage.getItem("access_token");

  const fetchSavingsGoals = async () => {
    if (!token) {
      navigate("/login");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/savings-goal/`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setSavingsGoals(Array.isArray(data) ? data : []);
      } else {
        console.error("Savings goal fetch error:", data);
        setError("Unable to load savings goals.");
      }
    } catch (err) {
      console.error(err);
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSavingsGoals();
  }, []);

  const openAddModal = () => {
    setIsEditing(false);
    setSelectedGoalId(null);
    setFormData({
      goal_name: "",
      target_amount: "",
      current_amount: "0",
      target_date: "",
    });
    setFormError("");
    setShowModal(true);
  };

  const openEditModal = (goal) => {
    setIsEditing(true);
    setSelectedGoalId(goal.id);
    setFormData({
      goal_name: goal.goal_name || "",
      target_amount: goal.target_amount ? String(goal.target_amount) : "",
      current_amount: goal.current_amount !== undefined ? String(goal.current_amount) : "0",
      target_date: goal.target_date || "",
    });
    setFormError("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setSelectedGoalId(null);
    setFormData({
      goal_name: "",
      target_amount: "",
      current_amount: "0",
      target_date: "",
    });
    setFormError("");
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setFormError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!token) {
      navigate("/login");
      return;
    }

    const { goal_name, target_amount, current_amount, target_date } = formData;

    if (!goal_name.trim()) {
      setFormError("Goal Name is required.");
      return;
    }

    const targetVal = Number(target_amount);
    if (!target_amount || isNaN(targetVal) || targetVal <= 0) {
      setFormError("Target Amount must be a valid number greater than 0.");
      return;
    }

    const currentVal = Number(current_amount);
    if (current_amount === "" || isNaN(currentVal) || currentVal < 0) {
      setFormError("Current Amount must be a valid non-negative number.");
      return;
    }

    if (!target_date) {
      setFormError("Target Date is required.");
      return;
    }

    const payload = {
      goal_name: goal_name.trim(),
      target_amount: targetVal,
      current_amount: currentVal,
      target_date: target_date,
    };

    try {
      const url = isEditing
        ? `${API_BASE_URL}/api/savings-goal/${selectedGoalId}/`
        : `${API_BASE_URL}/api/savings-goal/`;

      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(
          isEditing
            ? "Savings goal updated successfully!"
            : "Savings goal created successfully!"
        );
        closeModal();
        await fetchSavingsGoals();

        setTimeout(() => {
          setMessage("");
        }, 3000);
      } else {
        console.error("Savings goal submit error:", data);
        if (typeof data === "object") {
          const firstErrKey = Object.keys(data)[0];
          const firstErr = Array.isArray(data[firstErrKey])
            ? data[firstErrKey][0]
            : data[firstErrKey];
          setFormError(`${firstErrKey}: ${firstErr}`);
        } else {
          setFormError("Failed to save savings goal.");
        }
      }
    } catch (err) {
      console.error(err);
      setFormError("Unable to connect to the server.");
    }
  };

  const formatAmount = (amount) => {
    return `₹${Number(amount || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="savings-page">
      {/* SIDEBAR */}
      <Sidebar />

      {/* MAIN CONTENT */}
      <main className="savings-main">
        {/* HEADER */}
        <header className="savings-header">
          <div>
            <p className="page-kicker">GOAL TRACKER</p>
            <h1>Savings Goals</h1>
            <p>Set, track, and achieve your financial goals.</p>
          </div>

          <button className="add-goal-btn" onClick={openAddModal}>
            <span>+</span>
            Add Goal
          </button>
        </header>

        {/* STATUS MESSAGE TOAST */}
        {message && <div className="savings-message-toast">{message}</div>}

        {/* CONTENT AREA */}
        {loading ? (
          <div className="savings-loading">
            <div className="spinner"></div>
            <p>Loading savings goals...</p>
          </div>
        ) : error ? (
          <div className="savings-error">
            <div className="error-icon">⚠️</div>
            <h3>{error}</h3>
            <button className="retry-btn" onClick={fetchSavingsGoals}>
              Retry
            </button>
          </div>
        ) : savingsGoals.length === 0 ? (
          <div className="empty-savings">
            <div className="empty-icon">🎯</div>
            <h3>No savings goals yet</h3>
            <p>Create your first savings goal and start tracking your progress.</p>
            <button className="add-goal-btn" onClick={openAddModal}>
              <span>+</span>
              Create Goal
            </button>
          </div>
        ) : (
          <div className="savings-grid">
            {savingsGoals.map((goal) => {
              const target = Number(goal.target_amount || 0);
              const current = Number(goal.current_amount || 0);
              const percent =
                target > 0
                  ? Math.min(100, Math.round((current / target) * 100))
                  : 0;
              const remaining = Math.max(0, target - current);
              const isAchieved = current >= target && target > 0;
              const isOverdue =
                !isAchieved &&
                goal.target_date &&
                new Date(goal.target_date) < new Date(new Date().setHours(0, 0, 0, 0));

              return (
                <div className="savings-card" key={goal.id}>
                  <div className="savings-card-header">
                    <div className="goal-title-area">
                      <div className="goal-icon">🎯</div>
                      <div>
                        <h3>{goal.goal_name}</h3>
                        <div className="goal-date-row">
                          <span className="goal-target-date">
                            Target Date: {formatDate(goal.target_date)}
                          </span>
                          {isOverdue && (
                            <span className="overdue-badge">Overdue</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      className="edit-goal-btn"
                      onClick={() => openEditModal(goal)}
                      title="Edit Savings Goal"
                    >
                      ✎ Edit
                    </button>
                  </div>

                  <div className="savings-card-body">
                    <div className="metrics-row">
                      <div className="metric-box">
                        <span className="metric-label">TARGET AMOUNT</span>
                        <strong className="metric-value target-val">
                          {formatCurrency(target)}
                        </strong>
                      </div>

                      <div className="metric-box">
                        <span className="metric-label">CURRENT AMOUNT</span>
                        <strong className="metric-value current-val">
                          {formatCurrency(current)}
                        </strong>
                      </div>

                      <div className="metric-box">
                        <span className="metric-label">REMAINING</span>
                        <strong className="metric-value remaining-val">
                          {isAchieved ? "✓ Goal Achieved" : `Remaining: ${formatCurrency(remaining)}`}
                        </strong>
                      </div>
                    </div>

                    {/* PROGRESS BAR */}
                    <div className="savings-progress">
                      <div className="progress-info">
                        <span>Progress</span>
                        <span
                          className={`progress-badge ${
                            isAchieved ? "achieved" : ""
                          }`}
                        >
                          {isAchieved ? "✓ Goal Achieved" : `${percent}%`}
                        </span>
                      </div>

                      <div className="progress-track">
                        <div
                          className={`progress-fill ${
                            isAchieved ? "fill-completed" : ""
                          }`}
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ADD / EDIT GOAL MODAL */}
      {showModal && (
        <div
          className="modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              closeModal();
            }
          }}
        >
          <div className="savings-modal">
            <div className="modal-header">
              <div>
                <p>{isEditing ? "EDIT SAVINGS GOAL" : "NEW SAVINGS GOAL"}</p>
                <h2>{isEditing ? "Edit Savings Goal" : "Add Goal"}</h2>
              </div>

              <button className="close-modal" onClick={closeModal}>
                ×
              </button>
            </div>

            {formError && <div className="form-error-msg">{formError}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Goal Name</label>
                <input
                  type="text"
                  name="goal_name"
                  value={formData.goal_name}
                  onChange={handleInputChange}
                  placeholder="Enter your savings goal"
                  required
                />
              </div>

              <div className="form-group">
                <label>Target Amount</label>
                <input
                  type="number"
                  name="target_amount"
                  value={formData.target_amount}
                  onChange={handleInputChange}
                  placeholder="Enter target amount"
                  min="0.01"
                  step="0.01"
                  required
                />
              </div>

              <div className="form-group">
                <label>Current Amount</label>
                <input
                  type="number"
                  name="current_amount"
                  value={formData.current_amount}
                  onChange={handleInputChange}
                  placeholder="Enter current amount"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div className="form-group">
                <label>Target Date</label>
                <input
                  type="date"
                  name="target_date"
                  value={formData.target_date}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={closeModal}
                >
                  Cancel
                </button>

                <button type="submit" className="save-goal-btn">
                  {isEditing ? "Update Goal" : "Create Goal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default SavingsGoals;
