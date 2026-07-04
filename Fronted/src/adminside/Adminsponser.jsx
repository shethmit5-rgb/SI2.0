import React, { useEffect, useState } from "react";
import SponsorshipChart from "./SponsorshipChart";
import api from "../utils/axiosConfig";
import "./AdminSponsor.css";
import SkeletonTable from "../components/loading/SkeletonTable";

export default function AdminSponsor() {
  const [sponsors, setSponsors] = useState([]);
  const [tournaments, setTournaments] = useState([]); // ✅ New state for tournaments
  const [loading, setLoading] = useState(true);
  const [loadingTournaments, setLoadingTournaments] = useState(false);
  const [error, setError] = useState(null);
  const [selectedSponsor, setSelectedSponsor] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    amount: "",
    tournamentId: "", // This will store the selected tournament ID
  });

  useEffect(() => {
    fetchSponsors();
    fetchTournaments(); // ✅ Fetch tournaments for dropdown
  }, []);

  const fetchSponsors = async () => {
    try {
      setLoading(true);
      const response = await api.get("/sponsors");
      
      if (response.data && Array.isArray(response.data)) {
        setSponsors(response.data);
      } else if (response.data && response.data.sponsors) {
        setSponsors(response.data.sponsors);
      } else {
        setSponsors([]);
      }
    } catch (err) {
      console.error("Error fetching sponsors:", err);
      setError(err.response?.data?.message || "Failed to load sponsors");
      setSponsors([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fetch tournaments for dropdown
  const fetchTournaments = async () => {
    try {
      setLoadingTournaments(true);
      const response = await api.get("/tournaments");
      
      let tournamentsData = [];
      if (response.data && Array.isArray(response.data)) {
        tournamentsData = response.data;
      } else if (response.data && response.data.tournaments) {
        tournamentsData = response.data.tournaments;
      } else {
        tournamentsData = [];
      }
      
      setTournaments(tournamentsData);
    } catch (err) {
      console.error("Error fetching tournaments:", err);
      setTournaments([]);
    } finally {
      setLoadingTournaments(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEdit = (sponsor) => {
    setSelectedSponsor(sponsor);
    setFormData({
      name: sponsor.name || "",
      amount: sponsor.amount || "",
      tournamentId: sponsor.tournamentId?._id || sponsor.tournamentId || "", // ✅ Handle both populated and unpopulated
    });
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // ✅ Validate tournament selection
    if (!formData.tournamentId) {
      alert("Please select a tournament");
      return;
    }
    
    try {
      if (isEditMode && selectedSponsor) {
        await api.put(`/sponsors/${selectedSponsor._id}`, formData);
        alert("Sponsor updated successfully!");
      } else {
        await api.post("/sponsors", formData);
        alert("Sponsor added successfully!");
      }
      
      setFormData({ name: "", amount: "", tournamentId: "" });
      fetchSponsors();
      setIsModalOpen(false);
      setIsEditMode(false);
      setSelectedSponsor(null);
    } catch (err) {
      console.error("Error saving sponsor:", err);
      alert(err.response?.data?.message || "Failed to save sponsor");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this sponsor?")) return;
    
    try {
      await api.delete(`/sponsors/${id}`);
      alert("Sponsor deleted successfully!");
      fetchSponsors();
    } catch (err) {
      console.error("Error deleting sponsor:", err);
      alert(err.response?.data?.message || "Failed to delete sponsor");
    }
  };

  const handleAddNew = () => {
    setSelectedSponsor(null);
    setIsEditMode(false);
    setFormData({ name: "", amount: "", tournamentId: "" });
    setIsModalOpen(true);
  };

  // ✅ Get tournament name by ID for display
  const getTournamentName = (tournamentId) => {
    if (!tournamentId) return "N/A";
    const tournament = tournaments.find(t => t._id === tournamentId);
    return tournament?.eventName || tournamentId;
  };

  if (loading) {
    return (
      <div className="admin-sponsor-container">
        <SkeletonTable rows={8} cols={6} />
      </div>
    );
  }

  return (
    <div className="admin-sponsor-container">
      <div className="admin-sponsor-header">
        <h2>Sponsorship Management</h2>
        <button className="add-sponsor-btn" onClick={handleAddNew}>
          + Add Sponsor
        </button>
      </div>

      {error && (
        <div className="error-banner">
          {error}
          <button onClick={fetchSponsors}>Retry</button>
        </div>
      )}

      <div className="sponsor-stats-grid">
        <div className="stat-card">
          <h4>Total Sponsors</h4>
          <p>{sponsors.length}</p>
        </div>
        <div className="stat-card">
          <h4>Total Sponsorship Amount</h4>
          <p>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(sponsors.reduce((sum, s) => sum + (s.amount || 0), 0))}</p>
        </div>
        <div className="stat-card">
          <h4>Average Sponsorship</h4>
          <p>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(sponsors.reduce((sum, s) => sum + (s.amount || 0), 0) / (sponsors.length || 1))}</p>
        </div>
      </div>

      <div className="chart-section">
        <SponsorshipChart />
      </div>

      <div className="sponsors-table-container">
        <h3>Sponsors List</h3>
        {sponsors.length === 0 ? (
          <div className="no-data">No sponsors found. Add your first sponsor!</div>
        ) : (
          <table className="sponsors-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Sponsor Name</th>
                <th>Tournament</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sponsors.map((sponsor, index) => (
                <tr key={sponsor._id || index}>
                  <td>{index + 1}</td>
                  <td>{sponsor.name || "N/A"}</td>
                  <td>{sponsor.tournamentId?.eventName || getTournamentName(sponsor.tournamentId) || "N/A"}</td>
                  <td>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(sponsor.amount || 0)}</td>
                  <td>{sponsor.createdAt ? new Date(sponsor.createdAt).toLocaleDateString() : "N/A"}</td>
                  <td>
                    <button className="edit-btn" onClick={() => handleEdit(sponsor)}>
                      Edit
                    </button>
                    <button className="delete-btn" onClick={() => handleDelete(sponsor._id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal with Tournament Dropdown */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{isEditMode ? "Edit Sponsor" : "Add New Sponsor"}</h3>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Sponsor Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter sponsor name"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Sponsorship Amount (₹)</label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  placeholder="Enter amount"
                  required
                />
              </div>
              
              {/* ✅ Tournament Dropdown instead of text input */}
              <div className="form-group">
                <label>Select Tournament</label>
                <select
                  name="tournamentId"
                  value={formData.tournamentId}
                  onChange={handleInputChange}
                  required
                  className="tournament-select"
                >
                  <option value="">-- Select a Tournament --</option>
                  {loadingTournaments ? (
                    <option disabled>Loading tournaments...</option>
                  ) : tournaments.length === 0 ? (
                    <option disabled>No tournaments available</option>
                  ) : (
                    tournaments.map((tournament) => (
                      <option key={tournament._id} value={tournament._id}>
                        {tournament.eventName} - {tournament.sportId?.name || "Sport"} 
                        ({new Date(tournament.startDate).toLocaleDateString()})
                      </option>
                    ))
                  )}
                </select>
                {!loadingTournaments && tournaments.length === 0 && (
                  <p className="help-text">No tournaments found. Please create a tournament first.</p>
                )}
              </div>
              
              <div className="modal-footer">
                <button type="button" className="cancel-btn" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn" disabled={loadingTournaments}>
                  {isEditMode ? "Update Sponsor" : "Add Sponsor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}