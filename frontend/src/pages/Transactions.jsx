import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "./Transactions.css";
import Sidebar from "../components/Sidebar";
import { API_BASE_URL } from "../config";
import { formatCurrency, formatDate } from "../utils/formatters";

function Transactions() {
  const navigate = useNavigate();

  const [expenses, setExpenses] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter & Sort States
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("All");
  const [selectedMonth, setSelectedMonth] = useState("All");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("newest");

  const token = localStorage.getItem("access_token");

  const monthsList = [
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

  const expenseCategories = [
    "Food",
    "Travel",
    "Shopping",
    "Education",
    "Entertainment",
    "Miscellaneous",
  ];

  const incomeSources = [
    "Pocket Money",
    "Scholarship",
    "Freelance Income",
  ];

  const fetchTransactionsData = async () => {
    if (!token) {
      navigate("/login");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [expenseRes, incomeRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/expense/`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/api/income/`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!expenseRes.ok || !incomeRes.ok) {
        throw new Error("Unable to load transactions.");
      }

      const expenseData = await expenseRes.json();
      const incomeData = await incomeRes.json();

      setExpenses(Array.isArray(expenseData) ? expenseData : []);
      setIncomes(Array.isArray(incomeData) ? incomeData : []);
    } catch (err) {
      console.error("Transactions fetch error:", err);
      setError("Unable to load transactions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactionsData();
  }, []);

  // Normalize Data
  const normalizedTransactions = useMemo(() => {
    const normExpenses = expenses.map((item) => ({
      id: `expense-${item.id}`,
      originalId: item.id,
      type: "Expense",
      description: item.title || "Expense",
      category: item.category || "General",
      amount: Number(item.amount) || 0,
      date: item.expense_date,
      rawDetails: item.description,
    }));

    const normIncomes = incomes.map((item) => ({
      id: `income-${item.id}`,
      originalId: item.id,
      type: "Income",
      description: item.source || "Income",
      category: item.source || "General",
      amount: Number(item.amount) || 0,
      date: item.income_date,
      rawDetails: item.description,
    }));

    return [...normExpenses, ...normIncomes];
  }, [expenses, incomes]);

  // Dynamic Available Categories based on selectedType
  const availableCategories = useMemo(() => {
    if (selectedType === "Expense") return expenseCategories;
    if (selectedType === "Income") return incomeSources;
    return [...expenseCategories, ...incomeSources];
  }, [selectedType]);

  // Filtered & Sorted Transactions
  const filteredTransactions = useMemo(() => {
    return normalizedTransactions
      .filter((item) => {
        // Type Filter
        if (selectedType !== "All" && item.type !== selectedType) {
          return false;
        }

        // Month Filter
        if (selectedMonth !== "All" && item.date) {
          const itemDate = new Date(item.date);
          const monthIndex = itemDate.getMonth();
          if (monthsList[monthIndex] !== selectedMonth) {
            return false;
          }
        }

        // Category Filter
        if (selectedCategory !== "All" && item.category !== selectedCategory) {
          return false;
        }

        // Search Filter
        if (searchTerm.trim()) {
          const query = searchTerm.toLowerCase().trim();
          const matchDesc = item.description?.toLowerCase().includes(query);
          const matchCat = item.category?.toLowerCase().includes(query);
          const matchDetails = item.rawDetails?.toLowerCase().includes(query);
          if (!matchDesc && !matchCat && !matchDetails) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "newest") {
          return new Date(b.date || 0) - new Date(a.date || 0);
        }
        if (sortBy === "oldest") {
          return new Date(a.date || 0) - new Date(b.date || 0);
        }
        if (sortBy === "amount_high") {
          return b.amount - a.amount;
        }
        if (sortBy === "amount_low") {
          return a.amount - b.amount;
        }
        return 0;
      });
  }, [normalizedTransactions, selectedType, selectedMonth, selectedCategory, searchTerm, sortBy]);

  // Financial Summaries based on filtered transactions
  const summaries = useMemo(() => {
    let totalIncome = 0;
    let totalExpenses = 0;

    filteredTransactions.forEach((t) => {
      if (t.type === "Income") {
        totalIncome += t.amount;
      } else if (t.type === "Expense") {
        totalExpenses += t.amount;
      }
    });

    const netSavings = totalIncome - totalExpenses;

    return {
      totalIncome,
      totalExpenses,
      netSavings,
    };
  }, [filteredTransactions]);

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedType("All");
    setSelectedMonth("All");
    setSelectedCategory("All");
    setSortBy("newest");
  };

  const isFiltered =
    searchTerm !== "" ||
    selectedType !== "All" ||
    selectedMonth !== "All" ||
    selectedCategory !== "All" ||
    sortBy !== "newest";

  return (
    <div className="transactions-page">
      {/* SIDEBAR */}
      <Sidebar />

      {/* MAIN CONTENT */}
      <main className="transactions-main">
        {/* HEADER */}
        <header className="transactions-header">
          <div>
            <p className="page-kicker">TRANSACTION MANAGEMENT</p>
            <h1>Transactions</h1>
            <p>View and manage all your income and expenses in one place.</p>
          </div>
        </header>

        {/* LOADING STATE */}
        {loading ? (
          <div className="transactions-loading">
            <div className="spinner"></div>
            <p>Loading transactions...</p>
          </div>
        ) : error ? (
          /* ERROR STATE */
          <div className="transactions-error">
            <p>{error}</p>
            <button className="retry-btn" onClick={fetchTransactionsData}>
              Retry
            </button>
          </div>
        ) : (
          <>
            {/* SUMMARY CARDS */}
            <div className="transactions-summary-grid">
              <div className="summary-card income-card">
                <span className="card-label">Total Income</span>
                <h2>
                  {formatCurrency(summaries.totalIncome, true)}
                </h2>
                <span className="card-subtext">Filtered Total</span>
              </div>

              <div className="summary-card expense-card">
                <span className="card-label">Total Expenses</span>
                <h2>
                  {formatCurrency(summaries.totalExpenses)}
                </h2>
                <span className="card-subtext">Filtered Total</span>
              </div>

              <div className="summary-card savings-card">
                <span className="card-label">Net Savings</span>
                <h2 className={summaries.netSavings < 0 ? "negative-savings" : ""}>
                  {formatCurrency(summaries.netSavings, summaries.netSavings >= 0)}
                </h2>
                <span className="card-subtext">Income minus Expenses</span>
              </div>
            </div>

            {/* FILTERS TOOLBAR */}
            <div className="transactions-toolbar">
              {/* SEARCH INPUT */}
              <div className="search-box">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    className="clear-search"
                    onClick={() => setSearchTerm("")}
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* FILTER DROPDOWNS */}
              <div className="filters-group">
                {/* TYPE FILTER */}
                <div className="filter-item">
                  <label>Type</label>
                  <select
                    value={selectedType}
                    onChange={(e) => {
                      setSelectedType(e.target.value);
                      setSelectedCategory("All");
                    }}
                  >
                    <option value="All">All Types</option>
                    <option value="Income">Income</option>
                    <option value="Expense">Expense</option>
                  </select>
                </div>

                {/* MONTH FILTER */}
                <div className="filter-item">
                  <label>Month</label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                  >
                    <option value="All">All Months</option>
                    {monthsList.map((month) => (
                      <option key={month} value={month}>
                        {month}
                      </option>
                    ))}
                  </select>
                </div>

                {/* CATEGORY / SOURCE FILTER */}
                <div className="filter-item">
                  <label>Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    <option value="All">All Categories</option>
                    {availableCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* SORT BY */}
                <div className="filter-item">
                  <label>Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="amount_high">Amount: High → Low</option>
                    <option value="amount_low">Amount: Low → High</option>
                  </select>
                </div>

                {/* CLEAR FILTERS BUTTON */}
                {isFiltered && (
                  <button
                    className="clear-filters-btn"
                    onClick={handleClearFilters}
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>

            {/* TRANSACTIONS TABLE */}
            <section className="transactions-table-container">
              {filteredTransactions.length === 0 ? (
                <div className="empty-transactions">
                  <div className="empty-icon">💸</div>
                  <h3>
                    {isFiltered
                      ? "No transactions match your filters."
                      : "No transactions found"}
                  </h3>
                  <p>
                    {isFiltered
                      ? "Try adjusting your search terms or filter criteria."
                      : "Start adding income and expenses to track them here."}
                  </p>
                  {isFiltered && (
                    <button
                      className="clear-filters-btn inline-btn"
                      onClick={handleClearFilters}
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              ) : (
                <div className="table-wrapper">
                  <table className="transactions-table">
                    <thead>
                      <tr>
                        <th>DATE</th>
                        <th>DESCRIPTION</th>
                        <th>CATEGORY / SOURCE</th>
                        <th>TYPE</th>
                        <th className="amount-col">AMOUNT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTransactions.map((t) => (
                        <tr key={t.id} className={`tr-${t.type.toLowerCase()}`}>
                          {/* DATE */}
                          <td className="date-cell">
                            {formatDate(t.date)}
                          </td>

                          {/* DESCRIPTION */}
                          <td className="desc-cell">
                            <span className="main-desc">{t.description}</span>
                            {t.rawDetails && (
                              <span className="raw-details" title={t.rawDetails}>
                                {t.rawDetails}
                              </span>
                            )}
                          </td>

                          {/* CATEGORY / SOURCE */}
                          <td>
                            <span className="cat-badge">{t.category}</span>
                          </td>

                          {/* TYPE */}
                          <td>
                            <span
                              className={`type-badge ${
                                t.type === "Income" ? "type-income" : "type-expense"
                              }`}
                            >
                              {t.type}
                            </span>
                          </td>

                          {/* AMOUNT */}
                          <td
                            className={`amount-cell ${
                              t.type === "Income" ? "amount-income" : "amount-expense"
                            }`}
                          >
                            {formatCurrency(
                              t.type === "Income" ? t.amount : -t.amount,
                              t.type === "Income"
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default Transactions;
