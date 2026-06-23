import React, { useEffect, useState } from "react";
import api from "../utils/axiosConfig";
import "../static/SponsorDashboard.css";

export default function SponsorDashboard() {
  const [sponsorships, setSponsorships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSponsorshipHistory();
  }, []);

  const fetchSponsorshipHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/sponsors/my-sponsorships");
      setSponsorships(res.data || []);
    } catch (err) {
      console.error("Failed to fetch sponsorships:", err);
      setError("Failed to load sponsorship data.");
    } finally {
      setLoading(false);
    }
  };

  // Calculations for real statistics (no mock data)
  const totalSponsorships = sponsorships.length;
  const activeSponsorships = sponsorships.filter((s) => s.status === "active").length;
  const pendingSponsorships = sponsorships.filter((s) => s.status === "pending").length;
  const failedSponsorships = sponsorships.filter((s) => s.status === "failed").length;

  // Calculate distinct tournaments sponsored
  const distinctTournaments = new Set(
    sponsorships
      .filter((s) => s.tournamentId && s.tournamentId._id)
      .map((s) => s.tournamentId._id.toString())
  ).size;

  if (loading) {
    return (
      <div className="sponsor-db-container">
        <div className="loading-spinner">Loading Dashboard...</div>
      </div>
    );
  }

  return (
    <div className="sponsor-db-container">
      <div className="sponsor-db-header">
        <h1>Sponsor Dashboard</h1>
        <p>A summary of your sponsorships and contributions.</p>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {/* Stats Cards */}
      <div className="sponsor-db-stats">
        <div className="stat-card total">
          <h4>Total Sponsorships</h4>
          <p className="stat-value">{totalSponsorships}</p>
        </div>
        <div className="stat-card active">
          <h4>Active Sponsorships</h4>
          <p className="stat-value">{activeSponsorships}</p>
        </div>
        <div className="stat-card pending">
          <h4>Pending Sponsorships</h4>
          <p className="stat-value">{pendingSponsorships}</p>
        </div>
        <div className="stat-card failed">
          <h4>Failed Sponsorships</h4>
          <p className="stat-value">{failedSponsorships}</p>
        </div>
        <div className="stat-card tournaments">
          <h4>Sponsored Tournaments</h4>
          <p className="stat-value">{distinctTournaments}</p>
        </div>
      </div>

      {/* History Table */}
      <div className="sponsor-db-table-section">
        <h2>Sponsorship History</h2>
        <div className="table-wrapper">
          {sponsorships.length === 0 ? (
            <div className="no-data-message">
              You haven't sponsored any tournaments yet. Visit the Events tab to browse and sponsor upcoming tournaments.
            </div>
          ) : (
            <table className="sponsor-history-table">
              <thead>
                <tr>
                  <th>Tournament Name</th>
                  <th>Sponsorship Type</th>
                  <th>Sponsorship Status</th>
                  <th>Payment Status</th>
                  <th>Amount Paid</th>
                  <th>Date Sponsored</th>
                </tr>
              </thead>
              <tbody>
                {sponsorships.map((s) => (
                  <tr key={s._id}>
                    <td className="tournament-cell">
                      {s.tournamentId ? s.tournamentId.eventName : "Deleted Tournament"}
                    </td>
                    <td>
                      <span className={`type-badge ${s.type}`}>
                        {s.type === "title" ? "Title Sponsor" : "In-Kind Sponsor"}
                      </span>
                    </td>
                    <td>
                      <span className={`status-pill ${s.status}`}>
                        {s.status}
                      </span>
                    </td>
                    <td>
                      <span className={`payment-pill ${s.status === "active" ? "paid" : s.status}`}>
                        {s.status === "active" ? "Paid" : s.status === "pending" ? "Pending" : "Failed"}
                      </span>
                    </td>
                    <td className="amount-cell">₹{(s.amount || 0).toLocaleString()}</td>
                    <td>{s.createdAt ? new Date(s.createdAt).toLocaleDateString() : "N/A"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
