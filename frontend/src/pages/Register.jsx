import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Register.css";
import { API_BASE_URL } from "../config";

function Register() {
  const [formData, setFormData] = useState({
    username: "",
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
        `${API_BASE_URL}/api/register/`,
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
        setMessage("Registration successful!");

        setTimeout(() => {
          navigate("/login");
        }, 1000);
      } else {
        setMessage(
          data.error ||
            data.detail ||
            "Registration failed. Please check your details."
        );
      }
    } catch (error) {
      console.error(error);
      setMessage("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="register-page">

      {/* Left Branding */}
      <div className="register-brand">

        <div className="register-logo">
          💰 BudgetBuddy
        </div>

        <div className="register-brand-content">

          <div className="register-badge">
            🌊 Start Your Financial Journey
          </div>

          <h1>
            Take control of
            <span> your finances.</span>
          </h1>

          <p>
            Create your BudgetBuddy account and start managing
            your income, expenses, budgets, and financial goals
            in one place.
          </p>

          <div className="register-features">

            <div>
              <span>💸</span>
              <div>
                <strong>Track Expenses</strong>
                <small>Understand where your money goes.</small>
              </div>
            </div>

            <div>
              <span>💵</span>
              <div>
                <strong>Manage Income</strong>
                <small>Keep your income organized.</small>
              </div>
            </div>

            <div>
              <span>🎯</span>
              <div>
                <strong>Plan Budgets</strong>
                <small>Build better financial habits.</small>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Register Section */}
      <div className="register-section">

        <div className="register-card">

          <div className="register-header">
            <h2>Create Account ✨</h2>
            <p>Join BudgetBuddy and start budgeting smarter</p>
          </div>

          <form onSubmit={handleSubmit}>

            <div className="register-input-group">
              <label>Username</label>

              <input
                type="text"
                name="username"
                placeholder="Enter your username"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </div>

            <div className="register-input-group">
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

            <div className="register-input-group">
              <label>Password</label>

              <input
                type="password"
                name="password"
                placeholder="Create a password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <button
              type="submit"
              className="register-submit"
            >
              Create Account →
            </button>

          </form>

          {message && (
            <p
              className={
                message === "Registration successful!"
                  ? "register-success"
                  : "register-error"
              }
            >
              {message}
            </p>
          )}

          <div className="login-link-text">
            Already have an account?

            <Link to="/login">
              Sign in
            </Link>
          </div>

        </div>

      </div>

    </div>
  );
}

export default Register;