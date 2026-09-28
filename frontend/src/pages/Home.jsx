import { Link } from "react-router-dom";
import "./Home.css";

function Home() {
  return (
    <div className="home-page">

      <nav className="home-navbar">
        <div className="home-logo">
          💰 BudgetBuddy
        </div>

        <div className="home-nav-links">
          <Link to="/login">Login</Link>
          <Link to="/register" className="nav-register">
            Register
          </Link>
        </div>
      </nav>

      <main className="home-content">

        <div className="home-text">

          <div className="welcome-badge">
            ✨ Smart Financial Management for Students
          </div>

          <h1>
            Intelligent Student Budget Planning and
            <span> Personal Expense Management Platform</span>
          </h1>

          <p>
            BudgetBuddy helps students manage income, track expenses,
            plan budgets, and build better financial habits — all in one place.
          </p>

          <div className="home-buttons">
            <Link to="/register" className="get-started-btn">
              Get Started →
            </Link>

            <Link to="/login" className="login-btn">
              Login
            </Link>
          </div>

        </div>

        <div className="home-card">

          <div className="card-header">
            <span>Financial Overview</span>
            <span>•••</span>
          </div>

          <div className="balance-card">
            <p>Total Balance</p>
            <h2>₹12,450</h2>
            <span>↑ 12.5% this month</span>
          </div>

          <div className="mini-cards">

            <div className="mini-card">
              <div>💵</div>
              <p>Income</p>
              <h3>₹18,000</h3>
            </div>

            <div className="mini-card">
              <div>💸</div>
              <p>Expenses</p>
              <h3>₹5,550</h3>
            </div>

          </div>

          <div className="feature-row">
            <span>🎯 Budget Planning</span>
            <span>📊 Expense Tracking</span>
          </div>

        </div>

      </main>

      <section className="home-features">

        <div className="feature-box">
          <div className="feature-icon">💰</div>
          <h3>Track Income</h3>
          <p>Keep your income records organized.</p>
        </div>

        <div className="feature-box">
          <div className="feature-icon">💸</div>
          <h3>Manage Expenses</h3>
          <p>Track and categorize your daily spending.</p>
        </div>

        <div className="feature-box">
          <div className="feature-icon">🎯</div>
          <h3>Plan Your Budget</h3>
          <p>Set budgets and manage your spending wisely.</p>
        </div>

      </section>

    </div>
  );
}

export default Home;