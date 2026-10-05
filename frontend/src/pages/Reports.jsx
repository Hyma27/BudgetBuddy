import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Reports.css";
import Sidebar from "../components/Sidebar";
import { API_BASE_URL } from "../config";
import { formatCurrency, formatDateTime, formatFullMonthYear } from "../utils/formatters";

function Reports() {
  const navigate = useNavigate();

  const [reports, setReports] = useState([]);
  const [message, setMessage] = useState("");
  const [downloadingId, setDownloadingId] = useState(null);

  const fetchReports = async () => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/reports/`,
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

  const handleDownload = async (report, type) => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      navigate("/login");
      return;
    }

    const actionKey = `${report.id}-${type}`;
    setDownloadingId(actionKey);
    setMessage("");

    try {
      const endpoint =
        type === "pdf"
          ? `${API_BASE_URL}/api/reports/${report.id}/pdf/`
          : `${API_BASE_URL}/api/reports/${report.id}/excel/`;

      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Download failed with status ${response.status}`);
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `BudgetBuddy_${report.period}.${type === "pdf" ? "pdf" : "xlsx"}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error(`Error downloading ${type.toUpperCase()} report:`, error);
      setMessage(
        type === "pdf"
          ? "Unable to download PDF report."
          : "Unable to download Excel report."
      );
    } finally {
      setDownloadingId(null);
    }
  };

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
                      {formatFullMonthYear(report.period)}
                    </span>

                  </div>

                  {/* REPORT TITLE */}
                  <h3>
                    {report.report_type}
                  </h3>

                  {/* REPORT INFORMATION */}
                  <p>
                    Generated:{" "}
                    {formatDateTime(report.generated_at)}
                  </p>

                  {/* FINANCIAL SUMMARY */}
                  <div className="report-summary">

                    <div className="summary-item">

                      <span>
                        Total Income
                      </span>

                      <strong>
                        {formatCurrency(report.summary?.total_income, true)}
                      </strong>

                    </div>

                    <div className="summary-item">

                      <span>
                        Total Expenses
                      </span>

                      <strong>
                        {formatCurrency(report.summary?.total_expenses)}
                      </strong>

                    </div>

                    <div className="summary-item">

                      <span>
                        Net Savings
                      </span>

                      <strong>
                        {formatCurrency(
                          report.summary?.savings !== undefined
                            ? report.summary?.savings
                            : report.summary?.net_savings || 0,
                          (report.summary?.savings !== undefined
                            ? report.summary?.savings
                            : report.summary?.net_savings || 0) >= 0
                        )}
                      </strong>

                    </div>

                  </div>

                  {/* RECORD COUNTS */}
                  <div className="report-counts">

                    <span>
                      Income Records: {report.income_count !== undefined ? report.income_count : 0}
                    </span>

                    <span>
                      Expense Records: {report.expense_count !== undefined ? report.expense_count : 0}
                    </span>

                  </div>

                  {/* REPORT ACTIONS */}
                  <div className="report-card-actions">
                    <button
                      className="download-btn pdf-btn"
                      onClick={() => handleDownload(report, "pdf")}
                      disabled={downloadingId === `${report.id}-pdf`}
                    >
                      <span>📄</span>
                      {downloadingId === `${report.id}-pdf`
                        ? "Downloading..."
                        : "Download PDF"}
                    </button>

                    <button
                      className="download-btn excel-btn"
                      onClick={() => handleDownload(report, "excel")}
                      disabled={downloadingId === `${report.id}-excel`}
                    >
                      <span>📊</span>
                      {downloadingId === `${report.id}-excel`
                        ? "Downloading..."
                        : "Download Excel"}
                    </button>
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