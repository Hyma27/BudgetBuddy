import { useEffect, useMemo, useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import "./Expenses.css";
import Sidebar from "../components/Sidebar";
import { API_BASE_URL } from "../config";
import { formatCurrency, formatDate } from "../utils/formatters";

function Expenses() {
  const navigate = useNavigate();

  const [expenses, setExpenses] = useState([]);
  const [message, setMessage] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState(null);

  const [expense, setExpense] = useState({
    title: "",
    amount: "",
    category: "",
    expense_date: "",
    description: "",
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

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    fetchExpenses();
  }, [navigate, token]);

  const fetchExpenses = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/expense/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch expenses");
      }

      const data = await response.json();

      setExpenses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setMessage("Unable to load expenses.");
    }
  };

  const handleChange = (e) => {
    setExpense({
      ...expense,
      [e.target.name]: e.target.value,
    });

    setMessage("");
  };

  const openAddModal = () => {
    setEditingExpenseId(null);

    setExpense({
      title: "",
      amount: "",
      category: "",
      expense_date: "",
      description: "",
    });

    setMessage("");
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditingExpenseId(item.id);

    setExpense({
      title: item.title || "",
      amount: item.amount || "",
      category: item.category || "",
      expense_date: item.expense_date || "",
      description: item.description || "",
    });

    setMessage("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingExpenseId(null);

    setExpense({
      title: "",
      amount: "",
      category: "",
      expense_date: "",
      description: "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");

    const url = editingExpenseId
      ? `${API_BASE_URL}/api/expense/${editingExpenseId}/`
      : `${API_BASE_URL}/api/expense/`;

    const method = editingExpenseId ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: expense.title,
          amount: expense.amount,
          category: expense.category,
          expense_date: expense.expense_date,
          description: expense.description,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error(data);

        setMessage("Please enter valid expense details.");
        return;
      }

      setMessage(
        editingExpenseId
          ? "Expense updated successfully!"
          : "Expense added successfully!"
      );

      await fetchExpenses();

      setTimeout(() => {
        closeModal();
        setMessage("");
      }, 700);
    } catch (error) {
      console.error(error);
      setMessage("Something went wrong. Please try again.");
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this expense?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/expense/${id}/`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete expense");
      }

      setMessage("Expense deleted successfully!");

      await fetchExpenses();

      setTimeout(() => {
        setMessage("");
      }, 1500);
    } catch (error) {
      console.error(error);
      setMessage("Unable to delete expense.");
    }
  };

  const totalExpenses = useMemo(() => {
    return expenses.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );
  }, [expenses]);

  const todayExpenses = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];

    return expenses
      .filter((item) => item.expense_date === today)
      .reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0
      );
  }, [expenses]);

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

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");

    navigate("/login");
  };

  return (
    <div className="expenses-page">
      {/* SIDEBAR */}
      <Sidebar />

      {/* MAIN */}
      <main className="expenses-main">
        {/* HEADER */}
        <header className="expenses-header">
          <div>
            <p className="page-kicker">EXPENSE MANAGEMENT</p>

            <h1>Expenses</h1>

            <p>
              Track and manage your daily spending in one place.
            </p>
          </div>

          <button className="add-expense-btn" onClick={openAddModal}>
            <span>+</span>
            Add Expense
          </button>
        </header>

        {/* MESSAGE */}
        {message && (
          <div className="expense-message">
            {message}
          </div>
        )}

        {/* SUMMARY */}
        <section className="expense-summary">
          <div className="expense-summary-card">
            <div className="summary-icon expense-total-icon">
              ₹
            </div>

            <div>
              <span>Total Expenses</span>
              <strong>{formatCurrency(totalExpenses)}</strong>
            </div>
          </div>

          <div className="expense-summary-card">
            <div className="summary-icon transaction-icon">
              #
            </div>

            <div>
              <span>Expense Records</span>
              <strong>{expenses.length}</strong>
            </div>
          </div>

          <div className="expense-summary-card">
            <div className="summary-icon today-icon">
              ◷
            </div>

            <div>
              <span>Today's Spending</span>
              <strong>{formatCurrency(todayExpenses)}</strong>
            </div>
          </div>
        </section>

        {/* HISTORY */}
        <section className="expenses-section">
          <div className="section-heading">
            <div>
              <p>TRANSACTION HISTORY</p>
              <h2>Recent Expenses</h2>
            </div>

            <span>{expenses.length} records</span>
          </div>

          {expenses.length === 0 ? (
            <div className="empty-expenses">
              <div className="empty-icon">🧾</div>

              <h3>No expenses yet</h3>

              <p>
                Start tracking your spending by adding your first
                expense.
              </p>

              <button
                className="add-expense-btn"
                onClick={openAddModal}
              >
                <span>+</span>
                Add First Expense
              </button>
            </div>
          ) : (
            <div className="expense-table-wrapper">
              <table className="expense-table">
                <thead>
                  <tr>
                    <th>EXPENSE</th>
                    <th>CATEGORY</th>
                    <th>DATE</th>
                    <th>AMOUNT</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>

                <tbody>
                  {expenses.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="expense-title">
                          <div className="expense-row-icon">
                            ↗
                          </div>

                          <div>
                            <strong>{item.title}</strong>

                            {item.description && (
                              <small>{item.description}</small>
                            )}
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="category-pill">
                          {item.category}
                        </span>
                      </td>

                      <td className="date-cell">
                        {formatDate(item.expense_date)}
                      </td>

                      <td className="amount-cell">
                        {formatCurrency(-item.amount)}
                      </td>

                      <td>
                        <div className="action-buttons">
                          <button
                            className="edit-expense"
                            onClick={() => openEditModal(item)}
                          >
                            Edit
                          </button>

                          <button
                            className="delete-expense"
                            onClick={() => handleDelete(item.id)}
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
          <div className="expense-modal">
            <div className="modal-header">
              <div>
                <p>
                  {editingExpenseId
                    ? "UPDATE TRANSACTION"
                    : "NEW TRANSACTION"}
                </p>

                <h2>
                  {editingExpenseId
                    ? "Edit Expense"
                    : "Add Expense"}
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
                <label>Expense Title</label>

                <input
                  type="text"
                  name="title"
                  value={expense.title}
                  onChange={handleChange}
                  placeholder="e.g. Lunch, Bus Ticket"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Amount</label>

                  <input
                    type="number"
                    name="amount"
                    value={expense.amount}
                    onChange={handleChange}
                    placeholder="₹0.00"
                    min="0.01"
                    step="0.01"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Category</label>

                  <select
                    name="category"
                    value={expense.category}
                    onChange={handleChange}
                    required
                  >
                    <option value="" disabled>
                      Select Category
                    </option>

                    {categories.map((category) => (
                      <option
                        key={category}
                        value={category}
                      >
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Date</label>

                <input
                  type="date"
                  name="expense_date"
                  value={expense.expense_date}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>

                <textarea
                  name="description"
                  value={expense.description}
                  onChange={handleChange}
                  placeholder="Optional note about this expense..."
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
                  className="save-expense-btn"
                >
                  {editingExpenseId
                    ? "Update Expense"
                    : "Save Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Expenses;