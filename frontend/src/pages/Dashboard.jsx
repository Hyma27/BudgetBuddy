import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const navigate = useNavigate();

  const [message, setMessage] = useState("Checking authentication...");

  // Expense states
  const [expenseMessage, setExpenseMessage] = useState("");
  const [expenses, setExpenses] = useState([]);
  const [editingExpenseId, setEditingExpenseId] = useState(null);

  const [expense, setExpense] = useState({
    title: "",
    amount: "",
    category: "Food",
    expense_date: "",
    description: "",
  });

  // Income states
  const [incomeMessage, setIncomeMessage] = useState("");
  const [incomes, setIncomes] = useState([]);
  const [editingIncomeId, setEditingIncomeId] = useState(null);


  const [income, setIncome] = useState({
    source: "Pocket Money",
    amount: "",
    income_date: "",
    description: "",
  });

  // Budget states
const [budgets, setBudgets] = useState([]);
const [budgetMessage, setBudgetMessage] = useState("");

const [budget, setBudget] = useState({
  amount: "",
  category: "Food",
  period: "Monthly",
});

  // Fetch user's expenses
  const fetchExpenses = async () => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/expense/",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setExpenses(data);
      } else {
        console.error(data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Fetch user's incomes
  const fetchIncomes = async () => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/income/",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setIncomes(data);
      } else {
        console.error(data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Fetch user's budgets
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
      setBudgets(data);
    } else {
      console.error("Budget error:", data);
    }
  } catch (error) {
    console.error(error);
  }
};

  // Check authentication when Dashboard opens
  useEffect(() => {
    const checkAuthentication = async () => {
      const token = localStorage.getItem("access_token");

      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const response = await fetch(
          "http://127.0.0.1:8000/api/protected/",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (response.ok) {
          setMessage(
            data.message || "You are successfully authenticated."
          );

          fetchExpenses();
          fetchIncomes();
          fetchBudgets();

        } else {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          navigate("/login");
        }
      } catch (error) {
        console.error(error);
        setMessage("Unable to connect to the backend.");
      }
    };

    checkAuthentication();
  }, [navigate]);

  // Handle expense input changes
  const handleChange = (e) => {
    setExpense({
      ...expense,
      [e.target.name]: e.target.value,
    });
  };

  // Handle income input changes
  const handleIncomeChange = (e) => {
    setIncome({
      ...income,
      [e.target.name]: e.target.value,
    });
  };

  // Handle budget input changes
const handleBudgetChange = (e) => {
  setBudget({
    ...budget,
    [e.target.name]: e.target.value,
  });
};

// Add budget
const handleBudgetSubmit = async (e) => {
  e.preventDefault();

  setBudgetMessage("");

  const token = localStorage.getItem("access_token");

  if (!token) {
    navigate("/login");
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
      setBudgetMessage("Budget created successfully!");

      setBudget({
        amount: "",
        category: "Food",
        period: "Monthly",
      });

      fetchBudgets();
    } else {
      console.error("Budget error:", data);

      setBudgetMessage("Failed to create budget.");
    }
  } catch (error) {
    console.error(error);

    setBudgetMessage("Unable to connect to the backend.");
  }
};

  // Add income
  const handleIncomeSubmit = async (e) => {
    e.preventDefault();


    const token = localStorage.getItem("access_token");

    if (!token) {
      navigate("/login");
      return;
    }
    try {
        const url =
          editingIncomeId !== null
            ? `http://127.0.0.1:8000/api/income/${editingIncomeId}/`
            : "http://127.0.0.1:8000/api/income/";

        const method = editingIncomeId !== null ? "PUT" : "POST";
        
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

    if (response.ok) {
      setIncomeMessage(
        editingIncomeId !== null
          ? "Income updated successfully!"
          : "Income added successfully!"
      );

        setIncome({
          source: "Pocket Money",
          amount: "",
          income_date: "",
          description: "",
        });

        setEditingIncomeId(null);

        // Refresh income history
        fetchIncomes();
      } else {
        console.error("Income error:", data);

        setIncomeMessage(
         typeof data === "object"
           ? JSON.stringify(data)
           : "Failed to save income."
        );
      }
    } catch (error) {
      console.error(error);

      setIncomeMessage(
        "Unable to connect to the backend."
      );
    }
  };



  // Add or update expense
  const handleExpenseSubmit = async (e) => {
    e.preventDefault();

    setExpenseMessage("");

    const token = localStorage.getItem("access_token");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      let url = "http://127.0.0.1:8000/api/expense/";
      let method = "POST";

      if (editingExpenseId !== null) {
        url = `http://127.0.0.1:8000/api/expense/${editingExpenseId}/`;
        method = "PUT";
      }

      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(expense),
      });

      const data = await response.json();

      if (response.ok) {
        if (editingExpenseId !== null) {
          setExpenseMessage("Expense updated successfully!");
        } else {
          setExpenseMessage("Expense added successfully!");
        }

        setExpense({
          title: "",
          amount: "",
          category: "Food",
          expense_date: "",
          description: "",
        });

        setEditingExpenseId(null);

        fetchExpenses();
      } else {
        console.error(data);

        setExpenseMessage(
          data.detail ||
            data.error ||
            "Failed to save expense."
        );
      }
    } catch (error) {
      console.error(error);

      setExpenseMessage(
        "Unable to connect to the backend."
      );
    }
  };

  // Edit expense
  const handleEdit = (item) => {
  setEditingExpenseId(item.id);

  setExpense({
    title: item.title,
    amount: item.amount,
    category: item.category,
    expense_date: item.expense_date,
    description: item.description || "",
  });

  setExpenseMessage("");
};
  // Edit income
  const handleIncomeEdit = (item) => {
    setEditingIncomeId(item.id);

    setIncome({
      source: item.source,
      amount: item.amount,
      income_date: item.income_date,
      description: item.description || "",
    });

    setIncomeMessage("");
  };

  const handleIncomeDelete = async (incomeId) => {
  const token = localStorage.getItem("access_token");

  if (!token) {
    navigate("/login");
    return;
  }

  const confirmDelete = window.confirm(
    "Are you sure you want to delete this income?"
  );

  if (!confirmDelete) {
    return;
  }

  try {
    const response = await fetch(
      `http://127.0.0.1:8000/api/income/${incomeId}/`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (response.ok) {
      setIncomeMessage("Income deleted successfully!");
      fetchIncomes();
    } else {
      console.error("Income delete error:", data);
      setIncomeMessage(
        data.error || "Failed to delete income."
      );
    }
  } catch (error) {
    console.error(error);
    setIncomeMessage("Unable to connect to the backend.");
  }
};

  // Delete expense
  const handleDelete = async (expenseId) => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      navigate("/login");
      return;
    }

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this expense?"
    );

    if (!confirmDelete) {
      return;
    }

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/expense/${expenseId}/`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setExpenseMessage("Expense deleted successfully!");

        fetchExpenses();
      } else {
        console.error(data);

        setExpenseMessage(
          data.error || "Failed to delete expense."
        );
      }
    } catch (error) {
      console.error(error);

      setExpenseMessage(
        "Unable to connect to the backend."
      );
    }
  };

  // Cancel expense editing
  const handleCancelEdit = () => {
    setEditingExpenseId(null);

    setExpense({
      title: "",
      amount: "",
      category: "Food",
      expense_date: "",
      description: "",
    });

    setExpenseMessage("");
  };
const totalIncome = incomes.reduce(
  (sum, item) => sum + Number(item.amount),
  0
);

const totalExpenses = expenses.reduce(
  (sum, item) => sum + Number(item.amount),
  0
);
const remainingAmount = totalIncome - totalExpenses;
const recentTransactions = [
  ...incomes.map((item) => ({
    ...item,
    type: "Income",
    date: item.income_date,
  })),

  ...expenses.map((item) => ({
    ...item,
    type: "Expense",
    date: item.expense_date,
  })),
].sort((a, b) => {
  return new Date(b.date) - new Date(a.date);
});

  return (

    <div>
      <h1>Welcome to BudgetBuddy Dashboard</h1>

      <p>{message}</p>

      {/* Financial Summary */}
      <div>
        <h2>Financial Summary</h2>

        <p>
          <strong>Total Income:</strong> ₹{totalIncome.toFixed(2)}
        </p>

        <p>
           <strong>Total Expenses:</strong> ₹{totalExpenses.toFixed(2)}
        </p>

        <p>
           <strong>Remaining Amount:</strong> ₹{remainingAmount.toFixed(2)}
        </p>
     </div>

    <hr />

{/* Budget Creation */}
<h2>Create Monthly Budget</h2>

<form onSubmit={handleBudgetSubmit}>
  <div>
    <label>Amount</label>
    <br />

    <input
      type="number"
      name="amount"
      value={budget.amount}
      onChange={handleBudgetChange}
      placeholder="Enter budget amount"
      min="0.01"
      step="0.01"
      required
    />
  </div>

  <br />

  <div>
    <label>Category</label>
    <br />

    <select
      name="category"
      value={budget.category}
      onChange={handleBudgetChange}
      required
    >
      <option value="Food">Food</option>
      <option value="Travel">Travel</option>
      <option value="Shopping">Shopping</option>
      <option value="Education">Education</option>
      <option value="Entertainment">Entertainment</option>
      <option value="Miscellaneous">Miscellaneous</option>
    </select>
  </div>

  <br />

  <div>
    <label>Period</label>
    <br />

    <select
      name="period"
      value={budget.period}
      onChange={handleBudgetChange}
    >
      <option value="Monthly">Monthly</option>
    </select>
  </div>

  <br />

  <button type="submit">
    Create Budget
  </button>

  <p>{budgetMessage}</p>
</form>

<hr />

{/* Budget History */}
<h2>My Budgets</h2>

{budgets.length === 0 ? (
  <p>No budgets created yet.</p>
) : (
  <ul>
    {budgets.map((item) => (
      <li key={item.id}>
        <strong>₹{Number(item.amount).toFixed(2)}</strong>
        {" - "}
        {item.category}
        {" - "}
        {item.period}
      </li>
    ))}
  </ul>
)}

<hr />  

    {/* Add / Update Expense */}
    <h2>
      {editingExpenseId !== null
        ? "Update Expense"
        : "Add Expense"}
    </h2>

    <form onSubmit={handleExpenseSubmit}>
        <div>

          <label>Title</label>
          <br />

          <input
            type="text"
            name="title"
            value={expense.title}
            onChange={handleChange}
            placeholder="Enter expense title"
            required
          />
        </div>

        <br />

        <div>
          <label>Amount</label>
          <br />

          <input
            type="number"
            name="amount"
            value={expense.amount}
            onChange={handleChange}
            placeholder="Enter amount"
            min="0.01"
            step="0.01"
            required
          />
        </div>

        <br />

        <div>
          <label>Category</label>
          <br />

          <select
            name="category"
            value={expense.category}
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

        <br />

        <div>
          <label>Date</label>
          <br />

          <input
            type="date"
            name="expense_date"
            value={expense.expense_date}
            onChange={handleChange}
            required
          />
        </div>

        <br />

        <div>
          <label>Description</label>
          <br />

          <textarea
            name="description"
            value={expense.description}
            onChange={handleChange}
            placeholder="Enter description"
          />
        </div>

        <br />

        <button type="submit">
          {editingExpenseId !== null
            ? "Update Expense"
            : "Add Expense"}
        </button>

        {editingExpenseId !== null && (
          <>
            {" "}
            <button
              type="button"
              onClick={handleCancelEdit}
            >
              Cancel
            </button>
          </>
        )}
      </form>

      {expenseMessage && (
        <p>{expenseMessage}</p>
      )}

      <hr />

      {/* Expense History */}
      <h2>Expense History</h2>

      {expenses.length === 0 ? (
        <p>No expenses found.</p>
      ) : (
        <ul>
          {expenses.map((item) => (
            <li key={item.id}>
              <strong>{item.title}</strong>
              {" — ₹"}
              {item.amount}
              <br />

              Category: {item.category}
              <br />

              Date: {item.expense_date}

              {item.description && (
                <>
                  <br />
                  Description: {item.description}
                </>
              )}

              <br />
              <br />

              <button
                type="button"
                onClick={() => handleEdit(item)}
              >
                Edit
              </button>

              {" "}

              <button
                type="button"
                onClick={() => handleDelete(item.id)}
              >
                Delete
              </button>

              <br />
              <br />
            </li>
          ))}
        </ul>
      )}

      <hr />

      {/* Add Income */}
      <h2>Add Income</h2>

      <form onSubmit={handleIncomeSubmit}>
        <div>
          <label>Source</label>
          <br />

          <select
            name="source"
            value={income.source}
            onChange={handleIncomeChange}
          >
            <option value="Pocket Money">
              Pocket Money
            </option>

            <option value="Scholarship">
              Scholarship
            </option>

            <option value="Freelance Income">
              Freelance Income
            </option>
          </select>
        </div>

        <br />

        <div>
          <label>Amount</label>
          <br />

          <input
            type="number"
            name="amount"
            value={income.amount}
            onChange={handleIncomeChange}
            placeholder="Enter income amount"
            min="0.01"
            step="0.01"
            required
          />
        </div>

        <br />

        <div>
          <label>Date</label>
          <br />

          <input
            type="date"
            name="income_date"
            value={income.income_date}
            onChange={handleIncomeChange}
            required
          />
        </div>

        <br />

        <div>
          <label>Description</label>
          <br />

          <textarea
            name="description"
            value={income.description}
            onChange={handleIncomeChange}
            placeholder="Enter income details"
          />
        </div>

        <br />

        <button type="submit">
          {editingIncomeId !== null
             ? "Update Income"
             : "Add Income"}
        </button>
      </form>

      {incomeMessage && (
        <p>{incomeMessage}</p>
      )}

      <hr />

      {/* Income History */}
      <h2>Income History</h2>

      {incomes.length === 0 ? (
        <p>No income records found.</p>
      ) : (
        <ul>
          {incomes.map((item) => (
            <li key={item.id}>
              <strong>{item.source}</strong>
              {" — ₹"}
              {item.amount}
              <br />

              Date: {item.income_date}

              {item.description && (
                <>
                  <br />
                  Description: {item.description}
                </>
              )}

              <br />
              <br />

            <button
                type="button"
                onClick={() => handleIncomeEdit(item)}
            >
                Edit
            </button>

              {" "}

            <button
                type="button"
                onClick={() => handleIncomeDelete(item.id)}
            >
                Delete
            </button>

              <br />
              <br />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Dashboard;