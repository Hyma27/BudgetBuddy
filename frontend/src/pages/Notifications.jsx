import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import "./Notifications.css";

const API_URL = "http://127.0.0.1:8000/api";

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("access_token");

  const fetchNotifications = async () => {
    try {
      const response = await fetch(`${API_URL}/notifications/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Unable to load notifications");
      }

      const data = await response.json();
      setNotifications(data);
    } catch (error) {
      console.error("Notification error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch(
        `${API_URL}/notifications/${notificationId}/`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Unable to mark notification as read");
      }

      setNotifications((previous) =>
        previous.map((notification) =>
          notification.id === notificationId
            ? { ...notification, is_read: true }
            : notification
        )
      );
    } catch (error) {
      console.error("Mark as read error:", error);
    }
  };

  return (
    <div className="notifications-page">

      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="notifications-main">

        <header className="notifications-header">
          <div>
            <p className="eyebrow">Alerts & Updates</p>
            <h1>Notifications</h1>
            <p>
              Stay updated with your budgets, savings goals, and financial
              activity.
            </p>
          </div>

          <div className="notification-count">
            <span>
              {notifications.filter(
                (notification) => !notification.is_read
              ).length}
            </span>
            <small>Unread</small>
          </div>
        </header>

        {loading ? (
          <div className="empty-state">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔔</div>
            <h3>No notifications</h3>
            <p>
              You're all caught up. New alerts will appear here.
            </p>
          </div>
        ) : (
          <section className="notifications-list">

            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`notification-card ${
                  notification.is_read ? "read" : "unread"
                }`}
              >
                <div className="notification-icon">
                  {notification.notification_type ===
                  "Budget Limit Alert"
                    ? "⚠️"
                    : "🔔"}
                </div>

                <div className="notification-content">
                  <div className="notification-top">
                    <h3>{notification.notification_type}</h3>

                    {!notification.is_read && (
                      <span className="unread-badge">
                        New
                      </span>
                    )}
                  </div>

                  <p>{notification.message}</p>

                  <small>
                    {new Date(
                      notification.created_at
                    ).toLocaleString()}
                  </small>
                </div>

                {!notification.is_read && (
                  <button
                    className="mark-read-btn"
                    onClick={() =>
                      markAsRead(notification.id)
                    }
                  >
                    Mark as Read
                  </button>
                )}
              </div>
            ))}

          </section>
        )}

      </main>
    </div>
  );
}

export default Notifications;