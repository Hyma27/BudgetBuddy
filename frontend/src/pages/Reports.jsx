import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Reports.css";
import Sidebar from "../components/Sidebar";

function Reports() {
  const navigate = useNavigate();

  const [reports, setReports] = useState([]);
  const [message, setMessage] = useState("");

  const fetchReports = async () => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/reports/",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setReports(Array.isArray(data) ? data : []);
      } else {
        console.error("Report error:", data);
        setMessage(
          data.detail || data.error || "Failed to load reports."
        );
      }
    } catch (error) {
      console.error("Report connection error:", error);
      setMessage("Unable to connect to the backend.");
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  return (
    <div className="reports-page">

      {/* SIDEBAR */}
      <Sidebar />

      {/* MAIN CONTENT */}
      <main className="reports-main">

        {/* HEADER */}
        <header className="reports-header">

          <p className="page-kicker">
            FINANCIAL REPORTS
          </p>

          <h1>
            Reports
          </h1>

          <p>
            View your generated monthly financial reports.
          </p>

        </header>

        {/* MESSAGE */}
        {message && (
          <p className="report-message">
            {message}
          </p>
        )}

        {/* REPORT SECTION */}
        <section className="reports-section">

          {/* SECTION HEADER */}
          <div className="section-heading">

            <div>

              <p>
                REPORT HISTORY
              </p>

              <h2>
                Your Reports
              </h2>

            </div>

            <span>
              {reports.length} reports
            </span>

          </div>

          {/* NO REPORTS */}
          {reports.length === 0 ? (

            <div className="empty-reports">

              <div className="empty-icon">
                📊
              </div>

              <h3>
                No reports yet
              </h3>

              <p>
                Generate your first monthly report
                to see it here.
              </p>

            </div>

          ) : (

            /* REPORT GRID */
            <div className="reports-grid">

              {reports.map((report) => (

                <div
                  className="report-card"
                  key={report.id}
                >

                  {/* CARD TOP */}
                  <div className="report-card-top">

                    <div className="report-icon">
                      📄
                    </div>

                    <span className="report-pill">
                      {report.period}
                    </span>

                  </div>

                  {/* REPORT TITLE */}
                  <h3>
                    {report.report_type}
                  </h3>

                  {/* REPORT INFORMATION */}
                  <p>
                    Report ID: #{report.id}
                  </p>

                  <p>
                    Generated:{" "}
                    {new Date(
                      report.generated_at
                    ).toLocaleString("en-IN")}
                  </p>

                  {/* FINANCIAL SUMMARY */}
                  <div className="report-summary">

                    <div className="summary-item">

                      <span>
                        Total Income
                      </span>

                      <strong>
                        ₹
                        {Number(
                          report.summary?.total_income || 0
                        ).toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </strong>

                    </div>

                    <div className="summary-item">

                      <span>
                        Total Expenses
                      </span>

                      <strong>
                        ₹
                        {Number(
                          report.summary?.total_expenses || 0
                        ).toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </strong>

                    </div>

                    <div className="summary-item">

                      <span>
                        Savings
                      </span>

                      <strong>
                        ₹
                        {Number(
                          report.summary?.savings || 0
                        ).toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </strong>

                    </div>

                  </div>

                  {/* RECORD COUNTS */}
                  <div className="report-counts">

                    <span>
                      Income Records:{" "}
                      {report.income_count || 0}
                    </span>

                    <span>
                      Expense Records:{" "}
                      {report.expense_count || 0}
                    </span>

                  </div>

                </div>

              ))}

            </div>

          )}

        </section>

      </main>

    </div>
  );
}

export default Reports;