import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/hero.png";
import "./Login.css";
import { API_BASE_URL } from "../config";

function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/login/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("access_token", data.access);
        localStorage.setItem("refresh_token", data.refresh);

        setMessage("Login successful!");

        navigate("/dashboard");
      } else {
        setMessage(data.error || "Invalid email or password");
      }
    } catch (error) {
      console.error(error);
      setMessage("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="login-page">

      {/* Left Brand Panel */}
      <div className="login-brand">

        <Link to="/" className="login-logo">
          <img src={logo} alt="BudgetBuddy Logo" className="brand-logo-img" />
          <span className="brand-name">BudgetBuddy</span>
        </Link>

        <div className="brand-content">

          <div className="brand-badge">
            ✨ Smart Financial Management
          </div>

          <h1>
            Manage your money.
            <span> Build your future.</span>
          </h1>

          <p>
            Intelligent Student Budget Planning and Personal
            Expense Management Platform.
          </p>

          <div className="brand-features">
            <div>💸 Track your expenses</div>
            <div>💵 Manage your income</div>
            <div>🎯 Plan your budgets</div>
          </div>

        </div>

      </div>

      {/* Right Login Section */}
      <div className="login-section">

        <div className="login-card">

          <div className="login-header">
            <div className="card-logo-wrapper">
              <img src={logo} alt="BudgetBuddy Official Logo" className="card-logo-img" />
            </div>
            <h2>Welcome Back 👋</h2>
            <p>Sign in to continue to BudgetBuddy</p>
          </div>

          <form onSubmit={handleSubmit}>

            <div className="input-group">
              <label>Email</label>

              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="input-group">
              <label>Password</label>

              <input
                type="password"
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <button
              type="submit"
              className="login-submit"
            >
              Sign In →
            </button>

          </form>

          {message && (
            <p
              className={
                message === "Login successful!"
                  ? "success-message"
                  : "error-message"
              }
            >
              {message}
            </p>
          )}

          <div className="register-text">
            Don't have an account?

            <Link to="/register">
              Create an account
            </Link>
          </div>

        </div>

      </div>

    </div>
  );
}

export default Login;