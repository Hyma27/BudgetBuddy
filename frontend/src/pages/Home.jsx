import { Link } from "react-router-dom";
import logo from "../assets/hero.png";
import "./Home.css";

function Home() {
  return (
    <div className="home-page">
      {/* Navbar */}
      <nav className="home-navbar">
        <div className="home-logo">
          <img src={logo} alt="BudgetBuddy Logo" className="brand-logo-img" />
          <span className="brand-name">BudgetBuddy</span>
        </div>

        <div className="home-nav-links">
          <Link to="/login" className="nav-login">
            Login
          </Link>
          <Link to="/register" className="nav-register">
            Register
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="home-content">
        <div className="home-text">
          <div className="welcome-badge">
            ✨ Smart Financial Management for Students
          </div>

          <h1>
            Intelligent Student Budget Planning and
            <span> Personal Expense Management</span>
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

        {/* Hero Right: Official BudgetBuddy Logo */}
        <div className="home-hero-image-wrapper">
          <div className="hero-glow"></div>
          <img
            src={logo}
            alt="BudgetBuddy Official Logo"
            className="home-hero-logo"
          />
        </div>
      </main>

      {/* Features Section */}
      <section className="home-features">
        <div className="feature-box">
          <div className="feature-icon">💰</div>
          <h3>Track Income</h3>
          <p>Keep your income records organized and easily accessible.</p>
        </div>

        <div className="feature-box">
          <div className="feature-icon">💸</div>
          <h3>Manage Expenses</h3>
          <p>Track and categorize your daily spending in real-time.</p>
        </div>

        <div className="feature-box">
          <div className="feature-icon">🎯</div>
          <h3>Plan Your Budget</h3>
          <p>Set custom budgets, track progress, and build savings.</p>
        </div>
      </section>
    </div>
  );
}

export default Home;