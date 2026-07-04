import React, { useEffect, useState } from "react";
import axios from "axios";
import "../static/SponsorAccountManagement.css";
import SkeletonTable from "../components/loading/SkeletonTable";

export default function SponsorAccountManagement() {
  const token = localStorage.getItem("token");
  const authHeader = {
    headers: { Authorization: `Bearer ${token}` },
  };

  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchSponsors();
  }, []);

  const fetchSponsors = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get("http://localhost:5000/api/users", authHeader);
      // Filter only users with the role "sponsor"
      const sponsorUsers = (res.data || []).filter((u) => u && u.role === "sponsor");
      setSponsors(sponsorUsers);
    } catch (err) {
      console.error("Failed to fetch sponsor accounts:", err);
      setError("Failed to load sponsor accounts.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, name, newStatus) => {
    const actionLabel = 
      newStatus === "active" ? "approve/activate" : 
      newStatus === "rejected" ? "reject" : "deactivate";

    if (!window.confirm(`Are you sure you want to ${actionLabel} sponsor "${name}"?`)) {
      return;
    }

    try {
      await axios.put(`http://localhost:5000/api/users/${id}`, { status: newStatus }, authHeader);
      alert(`Sponsor account successfully updated to ${newStatus}.`);
      fetchSponsors();
    } catch (err) {
      console.error("Failed to update status:", err);
      alert("Failed to update sponsor account status.");
    }
  };

  const filteredSponsors = sponsors.filter((s) => {
    const searchLower = search.toLowerCase();
    return (
      (s.name || "").toLowerCase().includes(searchLower) ||
      (s.email || "").toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="sponsor-mgmt-container">
        <SkeletonTable rows={8} cols={6} />
      </div>
    );
  }

  return (
    <div className="sponsor-mgmt-container">
      <div className="sponsor-mgmt-header">
        <h1>Sponsor Account Approval & Management</h1>
        <p>Review pending sponsor registrations and control active sponsor accounts.</p>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="sponsor-mgmt-actions">
        <input
          type="text"
          placeholder="Search sponsors by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
        <button onClick={fetchSponsors} className="refresh-btn">🔄 Refresh List</button>
      </div>

      <div className="sponsors-table-card">
        {filteredSponsors.length === 0 ? (
          <div className="no-sponsors">No sponsor accounts found.</div>
        ) : (
          <table className="sponsor-mgmt-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Registration Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSponsors.map((sponsor) => (
                <tr key={sponsor._id}>
                  <td className="sponsor-name">{sponsor.name || "N/A"}</td>
                  <td>{sponsor.email}</td>
                  <td>{sponsor.phoneNumber || "N/A"}</td>
                  <td>{sponsor.createdAt ? new Date(sponsor.createdAt).toLocaleDateString() : "N/A"}</td>
                  <td>
                    <span className={`status-pill ${sponsor.status?.toLowerCase().replace(" ", "-")}`}>
                      {sponsor.status || "Pending Approval"}
                    </span>
                  </td>
                  <td className="action-buttons">
                    {sponsor.status === "Pending Approval" && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(sponsor._id, sponsor.name, "active")}
                          className="btn-approve"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(sponsor._id, sponsor.name, "rejected")}
                          className="btn-reject"
                        >
                          Reject
                        </button>
                      </>
                    )}

                    {sponsor.status === "active" && (
                      <button
                        onClick={() => handleUpdateStatus(sponsor._id, sponsor.name, "inactive")}
                        className="btn-deactivate"
                      >
                        Deactivate
                      </button>
                    )}

                    {(sponsor.status === "inactive" || sponsor.status === "rejected") && (
                      <button
                        onClick={() => handleUpdateStatus(sponsor._id, sponsor.name, "active")}
                        className="btn-activate"
                      >
                        Activate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
