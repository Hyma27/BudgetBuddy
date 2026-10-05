import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Profile.css";
import Sidebar from "../components/Sidebar";
import { API_BASE_URL } from "../config";

function Profile() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [formError, setFormError] = useState("");

  const [profile, setProfile] = useState({
    username: "",
    email: "",
    role: "student",
    monthly_income: "",
    financial_preferences: "",
  });

  const token = localStorage.getItem("access_token");

  const fetchProfile = async () => {
    if (!token) {
      navigate("/login");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/profile/`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setProfile({
          username: data.username || "",
          email: data.email || "",
          role: data.role || "student",
          monthly_income:
            data.monthly_income !== null && data.monthly_income !== undefined
              ? String(data.monthly_income)
              : "",
          financial_preferences: data.financial_preferences || "",
        });
      } else {
        console.error("Profile fetch error:", data);
        setError("Unable to load profile.");
      }
    } catch (err) {
      console.error(err);
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value,
    });
    setFormError("");
  };

  const validateEmail = (emailStr) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(emailStr).toLowerCase());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setMessage("");

    if (!token) {
      navigate("/login");
      return;
    }

    if (!profile.username || !profile.username.trim()) {
      setFormError("Username is required.");
      return;
    }

    if (!profile.email || !profile.email.trim()) {
      setFormError("Email address is required.");
      return;
    }

    if (!validateEmail(profile.email.trim())) {
      setFormError("Please enter a valid email address.");
      return;
    }

    if (profile.monthly_income !== "") {
      const incomeVal = Number(profile.monthly_income);
      if (isNaN(incomeVal) || incomeVal < 0) {
        setFormError("Monthly income cannot be negative.");
        return;
      }
    }

    setSaving(true);

    try {
      const payload = {
        username: profile.username.trim(),
        email: profile.email.trim(),
        monthly_income:
          profile.monthly_income !== "" ? Number(profile.monthly_income) : null,
        financial_preferences: profile.financial_preferences,
      };

      const response = await fetch(`${API_BASE_URL}/api/profile/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("Profile updated successfully!");

        setProfile({
          username: data.username || profile.username,
          email: data.email || profile.email,
          role: data.role || profile.role,
          monthly_income:
            data.monthly_income !== null && data.monthly_income !== undefined
              ? String(data.monthly_income)
              : "",
          financial_preferences: data.financial_preferences || "",
        });

        setTimeout(() => {
          setMessage("");
        }, 3500);
      } else {
        console.error("Profile update error:", data);
        if (typeof data === "object") {
          const firstErrKey = Object.keys(data)[0];
          const firstErr = Array.isArray(data[firstErrKey])
            ? data[firstErrKey][0]
            : data[firstErrKey];
          setFormError(`${firstErrKey}: ${firstErr}`);
        } else {
          setFormError("Failed to update profile.");
        }
      }
    } catch (err) {
      console.error(err);
      setFormError("Unable to connect to the server.");
    } finally {
      setSaving(false);
    }
  };

  const getRoleBadgeClass = (roleStr) => {
    switch (String(roleStr).toLowerCase()) {
      case "admin":
        return "badge-admin";
      case "premium":
        return "badge-premium";
      default:
        return "badge-student";
    }
  };

  const formatRoleName = (roleStr) => {
    if (!roleStr) return "Student";
    return roleStr.charAt(0).toUpperCase() + roleStr.slice(1);
  };

  return (
    <div className="profile-page">
      {/* SIDEBAR */}
      <Sidebar />

      {/* MAIN CONTENT */}
      <main className="profile-main">
        {/* HEADER */}
        <header className="profile-header">
          <div>
            <p className="page-kicker">ACCOUNT & PREFERENCES</p>
            <h1>Profile Settings</h1>
            <p>Manage your account and financial profile.</p>
          </div>
        </header>

        {/* TOAST MESSAGE */}
        {message && <div className="profile-toast-success">{message}</div>}

        {/* LOADING / ERROR / CONTENT */}
        {loading ? (
          <div className="profile-loading">
            <div className="spinner"></div>
            <p>Loading profile...</p>
          </div>
        ) : error ? (
          <div className="profile-error-box">
            <div className="error-icon">⚠️</div>
            <h3>{error}</h3>
            <button className="retry-btn" onClick={fetchProfile}>
              Retry
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="profile-form">
            {formError && <div className="profile-form-error">{formError}</div>}

            <div className="profile-cards-grid">
              {/* CARD 1 — ACCOUNT INFORMATION */}
              <div className="profile-card">
                <div className="card-header">
                  <div>
                    <p className="card-kicker">USER CREDENTIALS</p>
                    <h2>Account Information</h2>
                  </div>
                </div>

                <div className="form-group">
                  <label>Username</label>
                  <input
                    type="text"
                    name="username"
                    value={profile.username}
                    onChange={handleChange}
                    placeholder="Enter username"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={profile.email}
                    onChange={handleChange}
                    placeholder="Enter email address"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>User Role</label>
                  <div className="read-only-role-box">
                    <span>{formatRoleName(profile.role)}</span>
                    <small>(Controlled by backend system)</small>
                  </div>
                </div>
              </div>

              {/* CARD 2 — FINANCIAL PROFILE */}
              <div className="profile-card">
                <div className="card-header">
                  <div>
                    <p className="card-kicker">PREFERENCES & GOALS</p>
                    <h2>Financial Profile</h2>
                  </div>
                </div>

                <div className="form-group">
                  <label>Monthly Income (₹)</label>
                  <input
                    type="number"
                    name="monthly_income"
                    value={profile.monthly_income}
                    onChange={handleChange}
                    placeholder="Enter monthly income"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="form-group">
                  <label>Financial Preferences</label>
                  <textarea
                    name="financial_preferences"
                    value={profile.financial_preferences}
                    onChange={handleChange}
                    placeholder="e.g. Save money for education, travel, emergency fund..."
                    rows={4}
                  />
                </div>
              </div>
            </div>

            {/* ACTION BAR */}
            <div className="profile-actions-bar">
              <button
                type="submit"
                className="save-profile-btn"
                disabled={saving}
              >
                {saving ? "Saving Changes..." : "Save Changes"}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}

export default Profile;
