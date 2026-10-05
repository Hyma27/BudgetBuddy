import { useEffect, useMemo, useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import "./Income.css";
import Sidebar from "../components/Sidebar";
import { API_BASE_URL } from "../config";
import { formatCurrency, formatDate } from "../utils/formatters";

function Income() {
  const navigate = useNavigate();

  const [incomes, setIncomes] = useState([]);
  const [message, setMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingIncomeId, setEditingIncomeId] = useState(null);

  const [income, setIncome] = useState({
    source: "",
    amount: "",
    income_date: "",
    description: "",
  });

  const token = localStorage.getItem("access_token");

  const sources = [
    "Pocket Money",
    "Scholarship",
    "Freelance Income",
  ];

  // Check login and load income
  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    fetchIncomes();
  }, [navigate, token]);

  // Get income records
  const fetchIncomes = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/income/`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch income");
      }

      const data = await response.json();

      setIncomes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setMessage("Unable to load income.");
    }
  };

  // Input change
  const handleChange = (e) => {
    setIncome({
      ...income,
      [e.target.name]: e.target.value,
    });

    setMessage("");
  };

  // Open Add Income modal
  const openAddModal = () => {
    setEditingIncomeId(null);

    setIncome({
      source: "",
      amount: "",
      income_date: "",
      description: "",
    });

    setMessage("");
    setShowModal(true);
  };

  // Open Edit Income modal
  const openEditModal = (item) => {
    setEditingIncomeId(item.id);

    setIncome({
      source: item.source || "",
      amount: item.amount || "",
      income_date: item.income_date || "",
      description: item.description || "",
    });

    setMessage("");
    setShowModal(true);
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    setEditingIncomeId(null);

    setIncome({
      source: "",
      amount: "",
      income_date: "",
      description: "",
    });
  };

  // Add or update income
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    const url = editingIncomeId
      ? `${API_BASE_URL}/api/income/${editingIncomeId}/`
      : `${API_BASE_URL}/api/income/`;

    const method = editingIncomeId ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          source: income.source,
          amount: income.amount,
          income_date: income.income_date,
          description: income.description,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error(data);
        setMessage("Please enter valid income details.");
        return;
      }

      setMessage(
        editingIncomeId
          ? "Income updated successfully!"
          : "Income added successfully!"
      );

      await fetchIncomes();

      setTimeout(() => {
        closeModal();
        setMessage("");
      }, 700);
    } catch (error) {
      console.error(error);
      setMessage("Something went wrong. Please try again.");
    }
  };

  // Delete income
  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this income?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/income/${id}/`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete income");
      }

      setMessage("Income deleted successfully!");

      await fetchIncomes();

      setTimeout(() => {
        setMessage("");
      }, 1500);
    } catch (error) {
      console.error(error);
      setMessage("Unable to delete income.");
    }
  };

  // Total income
  const totalIncome = useMemo(() => {
    return incomes.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );
  }, [incomes]);

  // Today's income
  const todayIncome = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];

    return incomes
      .filter((item) => item.income_date === today)
      .reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0
      );
  }, [incomes]);

  // Format amount
  const formatAmount = (amount) => {
    return `₹${Number(amount || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Format date
  const formatDate = (date) => {
    if (!date) {
      return "-";
    }

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");

    navigate("/login");
  };

  return (
    <div className="income-page">

      {/* SIDEBAR */}
      <Sidebar />


      {/* MAIN */}
      <main className="income-main">

        <header className="income-header">

          <div>
            <p className="page-kicker">
              INCOME MANAGEMENT
            </p>

            <h1>Income</h1>

            <p>
              Track your earnings and manage every source of income.
            </p>
          </div>

          <button
            className="add-income-btn"
            onClick={openAddModal}
          >
            <span>+</span>
            Add Income
          </button>

        </header>

        {/* MESSAGE */}
        {message && (
          <div className="income-message">
            {message}
          </div>
        )}

        {/* SUMMARY CARDS */}
        <section className="income-summary">

          <div className="income-summary-card">

            <div className="summary-icon income-total-icon">
              ₹
            </div>

            <div>
              <span>Total Income</span>

              <strong>
                {formatCurrency(totalIncome, true)}
              </strong>
            </div>

          </div>

          <div className="income-summary-card">

            <div className="summary-icon source-icon">
              #
            </div>

            <div>
              <span>Income Records</span>

              <strong>
                {incomes.length}
              </strong>
            </div>

          </div>

          <div className="income-summary-card">

            <div className="summary-icon today-income-icon">
              ◷
            </div>

            <div>
              <span>Today's Income</span>

              <strong>
                {formatCurrency(todayIncome, true)}
              </strong>
            </div>

          </div>

        </section>

        {/* INCOME HISTORY */}
        <section className="income-section">

          <div className="section-heading">

            <div>
              <p>INCOME HISTORY</p>
              <h2>Recent Income</h2>
            </div>

            <span>
              {incomes.length} records
            </span>

          </div>

          {incomes.length === 0 ? (

            <div className="empty-income">

              <div className="empty-icon">
                💰
              </div>

              <h3>No income yet</h3>

              <p>
                Start tracking your earnings by adding your first income.
              </p>

              <button
                className="add-income-btn"
                onClick={openAddModal}
              >
                <span>+</span>
                Add First Income
              </button>

            </div>

          ) : (

            <div className="income-table-wrapper">

              <table className="income-table">

                <thead>
                  <tr>
                    <th>INCOME SOURCE</th>
                    <th>DATE</th>
                    <th>AMOUNT</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>

                <tbody>

                  {incomes.map((item) => (

                    <tr key={item.id}>

                      <td>

                        <div className="income-title">

                          <div className="income-row-icon">
                            ₹
                          </div>

                          <div>

                            <strong>
                              {item.source}
                            </strong>

                            {item.description && (
                              <small>
                                {item.description}
                              </small>
                            )}

                          </div>

                        </div>

                      </td>

                      <td className="date-cell">
                        {formatDate(item.income_date)}
                      </td>

                      <td className="amount-cell">
                        {formatCurrency(item.amount, true)}
                      </td>

                      <td>

                        <div className="action-buttons">

                          <button
                            className="edit-income"
                            onClick={() =>
                              openEditModal(item)
                            }
                          >
                            Edit
                          </button>

                          <button
                            className="delete-income"
                            onClick={() =>
                              handleDelete(item.id)
                            }
                          >
                            Delete
                          </button>

                        </div>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          )}

        </section>

      </main>

      {/* ADD / EDIT MODAL */}
      {showModal && (

        <div
          className="modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              closeModal();
            }
          }}
        >

          <div className="income-modal">

            <div className="modal-header">

              <div>

                <p>
                  {editingIncomeId
                    ? "UPDATE INCOME"
                    : "NEW INCOME"}
                </p>

                <h2>
                  {editingIncomeId
                    ? "Edit Income"
                    : "Add Income"}
                </h2>

              </div>

              <button
                className="close-modal"
                onClick={closeModal}
              >
                ×
              </button>

            </div>

            <form onSubmit={handleSubmit}>

              <div className="form-group">

                <label>
                  Income Source
                </label>

                <select
                  name="source"
                  value={income.source}
                  onChange={handleChange}
                  required
                >

                  <option value="" disabled hidden>
                    Select Income Source
                  </option>

                  {sources.map((source) => (
                    <option
                      key={source}
                      value={source}
                    >
                      {source}
                    </option>
                  ))}

                </select>

              </div>

              <div className="form-group">

                <label>
                  Amount
                </label>

                <input
                  type="number"
                  name="amount"
                  value={income.amount}
                  onChange={handleChange}
                  placeholder="₹0.00"
                  min="0.01"
                  step="0.01"
                  required
                />

              </div>

              <div className="form-group">

                <label>
                  Date
                </label>

                <input
                  type="date"
                  name="income_date"
                  value={income.income_date}
                  onChange={handleChange}
                  required
                />

              </div>

              <div className="form-group">

                <label>
                  Description
                </label>

                <textarea
                  name="description"
                  value={income.description}
                  onChange={handleChange}
                  placeholder="Optional note about this income..."
                  rows="3"
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

                <button
                  type="submit"
                  className="save-income-btn"
                >
                  {editingIncomeId
                    ? "Update Income"
                    : "Save Income"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}

export default Income;