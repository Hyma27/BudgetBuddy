import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("Checking authentication...");

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
        } else {
          // Token is invalid or expired
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

  return (
    <div>
      <h1>Welcome to BudgetBuddy Dashboard</h1>
      <p>{message}</p>
    </div>
  );
}

export default Dashboard;