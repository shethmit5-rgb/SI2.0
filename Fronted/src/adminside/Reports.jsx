import React, { useEffect, useState } from "react";
import axios from "axios";
import "./AdminDashboard.css";
import SkeletonTable from "../components/loading/SkeletonTable";

export default function Reports() {
  const token = localStorage.getItem("token");
  const auth = { headers: { Authorization: `Bearer ${token}` } };
  const [loading, setLoading] = useState(true);
  const [tournaments, setTournaments] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [reportType, setReportType] = useState("tournaments");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tournamentsRes, registrationsRes] = await Promise.all([
        axios.get("http://localhost:5000/api/tournaments/public"),
        axios.get("http://localhost:5000/api/registrations", auth),
      ]);
      setTournaments(tournamentsRes.data || []);
      setRegistrations(registrationsRes.data || []);
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    let data = [];
    let headers = [];

    if (reportType === "tournaments") {
      headers = ["Event Name", "Sport", "Location", "Start Date", "End Date", "Status", "Teams", "Prize Pool"];
      data = tournaments.map(t => [
        t.eventName,
        t.sportId?.name || "N/A",
        t.location || "TBD",
        new Date(t.startDate).toLocaleDateString(),
        new Date(t.endDate).toLocaleDateString(),
        t.status,
        t.teams?.length || 0,
        `₹${t.prizePool?.toLocaleString() || 0}`,
      ]);
    } else if (reportType === "registrations") {
      headers = ["Team Name", "Tournament", "Captain", "Status", "Payment", "Registered On"];
      data = registrations.map(r => [
        r.teamId?.teamName || "N/A",
        r.tournamentId?.eventName || "N/A",
        r.userId?.name || "N/A",
        r.approvalStatus,
        r.paymentStatus,
        new Date(r.registrationDate).toLocaleDateString(),
      ]);
    }

    const csvContent = [headers, ...data].map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${reportType}_report_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToPDF = () => {
    const printWindow = window.open("", "_blank");
    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${reportType.toUpperCase()} Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          h1 { color: #2563eb; text-align: center; }
          h2 { margin-top: 30px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
          th { background-color: #2563eb; color: white; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <h1>${reportType.toUpperCase()} REPORT</h1>
        <p>Generated on: ${new Date().toLocaleString()}</p>
    `;

    if (reportType === "tournaments") {
      htmlContent += `
        <h2>Tournaments List (${tournaments.length})</h2>
        <table>
          <tr>
            <th>#</th>
            <th>Event Name</th>
            <th>Sport</th>
            <th>Location</th>
            <th>Start Date</th>
            <th>End Date</th>
            <th>Status</th>
            <th>Teams</th>
            <th>Prize Pool</th>
          </tr>
          ${tournaments.map((t, i) => `
            <tr>
              <td>${i + 1}</td>
              <td>${t.eventName}</td>
              <td>${t.sportId?.name || "N/A"}</td>
              <td>${t.location || "TBD"}</td>
              <td>${new Date(t.startDate).toLocaleDateString()}</td>
              <td>${new Date(t.endDate).toLocaleDateString()}</td>
              <td>${t.status}</td>
              <td>${t.teams?.length || 0}</td>
              <td>₹${t.prizePool?.toLocaleString() || 0}</td>
            </tr>
          `).join("")}
        </table>
      `;
    } else if (reportType === "registrations") {
      htmlContent += `
        <h2>Registrations List (${registrations.length})</h2>
        <table>
          <tr>
            <th>#</th>
            <th>Team Name</th>
            <th>Tournament</th>
            <th>Captain</th>
            <th>Status</th>
            <th>Payment</th>
            <th>Registered On</th>
          </tr>
          ${registrations.map((r, i) => `
            <tr>
              <td>${i + 1}</td>
              <td>${r.teamId?.teamName || "N/A"}</td>
              <td>${r.tournamentId?.eventName || "N/A"}</td>
              <td>${r.userId?.name || "N/A"}</td>
              <td>${r.approvalStatus}</td>
              <td>${r.paymentStatus}</td>
              <td>${new Date(r.registrationDate).toLocaleDateString()}</td>
            </tr>
          `).join("")}
        </table>
      `;
    }

    htmlContent += `
        <div class="footer">
          <p>© ${new Date().getFullYear()} ArenaSync - Tournament Management System</p>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
  };

  const buttonStyles = {
    exportCSV: {
      backgroundColor: "#10b981",
      color: "white",
      border: "none",
      padding: "10px 20px",
      borderRadius: "6px",
      cursor: "pointer",
      marginRight: "10px",
    },
    exportPDF: {
      backgroundColor: "#ef4444",
      color: "white",
      border: "none",
      padding: "10px 20px",
      borderRadius: "6px",
      cursor: "pointer",
    },
  };

  if (loading) {
    return (
      <div className="admin-layout">
        <main className="content">
          <SkeletonTable rows={8} cols={7} />
        </main>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      <main className="content">
        <h1>📄 Reports</h1>

        <div style={{
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "25px",
          marginBottom: "20px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}>
          <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", alignItems: "flex-end" }}>
            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Report Type</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                style={{ padding: "10px", borderRadius: "6px", border: "1px solid #ccc", minWidth: "150px" }}
              >
                <option value="tournaments">Tournaments Report</option>
                <option value="registrations">Registrations Report</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>From Date</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                style={{ padding: "10px", borderRadius: "6px", border: "1px solid #ccc" }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>To Date</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                style={{ padding: "10px", borderRadius: "6px", border: "1px solid #ccc" }}
              />
            </div>

            <div>
              <button
                style={buttonStyles.exportCSV}
                onClick={exportToCSV}
                onMouseEnter={(e) => e.target.style.backgroundColor = "#059669"}
                onMouseLeave={(e) => e.target.style.backgroundColor = "#10b981"}
              >
                📥 Export CSV
              </button>
              <button
                style={buttonStyles.exportPDF}
                onClick={exportToPDF}
                onMouseEnter={(e) => e.target.style.backgroundColor = "#dc2626"}
                onMouseLeave={(e) => e.target.style.backgroundColor = "#ef4444"}
              >
                🖨️ Export PDF
              </button>
            </div>
          </div>
        </div>

        {/* Data Preview */}
        <div style={{
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "25px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}>
          <h3>Preview</h3>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#f3f4f6" }}>
                  {reportType === "tournaments" ? (
                    <>
                      <th style={{ padding: "12px" }}>#</th>
                      <th style={{ padding: "12px" }}>Event Name</th>
                      <th style={{ padding: "12px" }}>Sport</th>
                      <th style={{ padding: "12px" }}>Location</th>
                      <th style={{ padding: "12px" }}>Status</th>
                      <th style={{ padding: "12px" }}>Teams</th>
                      <th style={{ padding: "12px" }}>Prize Pool</th>
                    </>
                  ) : (
                    <>
                      <th style={{ padding: "12px" }}>#</th>
                      <th style={{ padding: "12px" }}>Team Name</th>
                      <th style={{ padding: "12px" }}>Tournament</th>
                      <th style={{ padding: "12px" }}>Captain</th>
                      <th style={{ padding: "12px" }}>Status</th>
                      <th style={{ padding: "12px" }}>Payment</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {reportType === "tournaments" ? (
                  tournaments.slice(0, 10).map((t, i) => (
                    <tr key={t._id} style={{ borderBottom: "1px solid #eee" }}>
                      <td style={{ padding: "12px" }}>{i + 1}</td>
                      <td style={{ padding: "12px" }}>{t.eventName}</td>
                      <td style={{ padding: "12px" }}>{t.sportId?.name || "N/A"}</td>
                      <td style={{ padding: "12px" }}>{t.location || "TBD"}</td>
                      <td style={{ padding: "12px" }}>{t.status}</td>
                      <td style={{ padding: "12px" }}>{t.teams?.length || 0}</td>
                      <td style={{ padding: "12px" }}>₹{t.prizePool?.toLocaleString() || 0}</td>
                    </tr>
                  ))
                ) : (
                  registrations.slice(0, 10).map((r, i) => (
                    <tr key={r._id} style={{ borderBottom: "1px solid #eee" }}>
                      <td style={{ padding: "12px" }}>{i + 1}</td>
                      <td style={{ padding: "12px" }}>{r.teamId?.teamName || "N/A"}</td>
                      <td style={{ padding: "12px" }}>{r.tournamentId?.eventName || "N/A"}</td>
                      <td style={{ padding: "12px" }}>{r.userId?.name || "N/A"}</td>
                      <td style={{ padding: "12px" }}>{r.approvalStatus}</td>
                      <td style={{ padding: "12px" }}>{r.paymentStatus}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {reportType === "tournaments" && tournaments.length > 10 && (
            <p style={{ textAlign: "center", marginTop: "15px", color: "#666" }}>
              Showing 10 of {tournaments.length} tournaments. Export full report for complete data.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}