import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/axiosConfig";
import { useAuth } from "../context/AuthContext";
import "../static/SponsorManagement.css";
import SkeletonTable from "../components/loading/SkeletonTable";
import SkeletonStats from "../components/loading/SkeletonStats";

export default function SponsorManagement() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [myTournaments, setMyTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    amount: "",
    logo: null
  });
  const [logoPreview, setLogoPreview] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!user || (user.role !== "organizer" && user.role !== "admin")) {
      navigate("/");
      return;
    }
    fetchMyTournaments();
  }, [user]);

  const fetchMyTournaments = async () => {
    try {
      const res = await api.get("/tournaments/my-tournaments");
      setMyTournaments(res.data);
    } catch (err) {
      console.error("Failed to fetch tournaments:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSponsors = async (tournamentId) => {
    try {
      const res = await api.get(`/sponsors/tournament/${tournamentId}`);
      setSponsors(res.data);
    } catch (err) {
      console.error("Failed to fetch sponsors:", err);
    }
  };

  const handleTournamentSelect = (tournament) => {
    setSelectedTournament(tournament);
    fetchSponsors(tournament._id);
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, logo: file });
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.amount) {
      setMessage("Please fill all required fields");
      return;
    }

    try {
      const data = new FormData();
      data.append("name", formData.name);
      data.append("amount", formData.amount);
      data.append("tournamentId", selectedTournament._id);
      if (formData.logo) {
        data.append("logo", formData.logo);
      }

      if (editingSponsor) {
        await api.put(`/sponsors/${editingSponsor._id}`, data);
        setMessage("Sponsor updated successfully!");
      } else {
        await api.post("/sponsors", data);
        setMessage("Sponsor added successfully!");
      }

      setTimeout(() => setMessage(""), 3000);
      resetForm();
      fetchSponsors(selectedTournament._id);
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to save sponsor");
    }
  };

  const handleDelete = async (sponsorId, sponsorName) => {
    if (!window.confirm(`Delete sponsor "${sponsorName}"?`)) return;
    
    try {
      await api.delete(`/sponsors/${sponsorId}`);
      setMessage("Sponsor deleted successfully!");
      fetchSponsors(selectedTournament._id);
    } catch (err) {
      setMessage("Failed to delete sponsor");
    }
  };

  const resetForm = () => {
    setFormData({ name: "", amount: "", logo: null });
    setLogoPreview("");
    setEditingSponsor(null);
    setShowModal(false);
  };

  const openAddModal = () => {
    setEditingSponsor(null);
    setFormData({ name: "", amount: "", logo: null });
    setLogoPreview("");
    setShowModal(true);
  };

  const openEditModal = (sponsor) => {
    setEditingSponsor(sponsor);
    setFormData({
      name: sponsor.name,
      amount: sponsor.amount,
      logo: null
    });
    setLogoPreview(sponsor.logo || "");
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="sponsor-management-page">
        <div className="page-header">
          <h1>🤝 Sponsor Management</h1>
          <p>Add and manage sponsors for your tournaments</p>
        </div>
        <SkeletonStats count={3} style={{ marginBottom: "30px" }} />
        <SkeletonTable rows={6} cols={5} />
      </div>
    );
  }

  if (!selectedTournament) {
    return (
      <div className="sponsor-management-page">
        <div className="page-header">
          <h1>🤝 Sponsor Management</h1>
          <p>Add and manage sponsors for your tournaments</p>
        </div>

        <div className="tournament-selection">
          <h2>Select Tournament</h2>
          {myTournaments.length === 0 ? (
            <div className="no-tournaments">
              <p>You haven't created any tournaments yet.</p>
              <button onClick={() => navigate("/create-tournament")} className="create-btn">
                + Create Tournament
              </button>
            </div>
          ) : (
            <div className="tournaments-grid">
              {myTournaments.map(t => (
                <div key={t._id} className="tournament-card" onClick={() => handleTournamentSelect(t)}>
                  <h3>{t.eventName}</h3>
                  <p>Sport: {t.sportId?.name}</p>
                  <p>Status: {t.status}</p>
                  <p>Prize Pool: ₹{t.prizePool?.toLocaleString() || 0}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="sponsor-management-page">
      <div className="tournament-header">
        <button className="back-btn" onClick={() => setSelectedTournament(null)}>← Back</button>
        <div>
          <h2>{selectedTournament.eventName}</h2>
          <p>Manage sponsors for this tournament</p>
        </div>
        <button className="add-sponsor-btn" onClick={openAddModal}>+ Add Sponsor</button>
      </div>

      {message && (
        <div className={message.includes("success") ? "success-message" : "error-message"}>
          {message}
        </div>
      )}

      <div className="sponsors-list">
        {sponsors.length === 0 ? (
          <div className="no-sponsors">
            <p>No sponsors added yet. Click "Add Sponsor" to get started.</p>
          </div>
        ) : (
          <div className="sponsors-grid">
            {sponsors.map(sponsor => (
              <div key={sponsor._id} className="sponsor-card">
                <div className="sponsor-logo">
                  {sponsor.logo ? (
                    <img src={sponsor.logo} alt={sponsor.name} />
                  ) : (
                    <div className="logo-placeholder">🏢</div>
                  )}
                </div>
                <div className="sponsor-info">
                  <h3>{sponsor.name}</h3>
                  <p className="sponsor-amount">💰 ₹{sponsor.amount?.toLocaleString()}</p>
                  <p className="sponsor-date">Added: {new Date(sponsor.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="sponsor-actions">
                  <button className="edit-btn" onClick={() => openEditModal(sponsor)}>✏️ Edit</button>
                  <button className="delete-btn" onClick={() => handleDelete(sponsor._id, sponsor.name)}>🗑️ Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingSponsor ? "Edit Sponsor" : "Add New Sponsor"}</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="sponsor-form">
              <div className="form-group">
                <label>Sponsor Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter sponsor name"
                  required
                />
              </div>
              <div className="form-group">
                <label>Sponsorship Amount (₹) *</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="Enter amount"
                  required
                />
              </div>
              <div className="form-group">
                <label>Sponsor Logo</label>
                {logoPreview && (
                  <div className="logo-preview">
                    <img src={logoPreview} alt="Sponsor logo" />
                  </div>
                )}
                <input type="file" accept="image/*" onChange={handleLogoChange} />
              </div>
              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="save-btn">{editingSponsor ? "Update" : "Add"} Sponsor</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Prize Pool Summary */}
      {sponsors.length > 0 && (
        <div className="prize-pool-summary">
          <h3>💰 Total Prize Pool</h3>
          <p className="total-amount">
            ₹{sponsors.reduce((sum, s) => sum + (s.amount || 0), 0).toLocaleString()}
          </p>
          <p className="sponsor-count">From {sponsors.length} sponsor{sponsors.length !== 1 ? 's' : ''}</p>
        </div>
      )}
    </div>
  );
}