import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./TournamentList.css";
import SkeletonTable from "../components/loading/SkeletonTable";

export default function TournamentList() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const auth = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    fetchTournaments();
  }, []);

  // ✅ IMPORTANT: Using PUBLIC endpoint
  const fetchTournaments = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/tournaments/public");
      setTournaments(res.data);
    } catch (err) {
      console.error("Failed to load tournaments:", err);
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (tournament) => {
    setEditData({
      ...tournament,
      startDate: tournament.startDate?.slice(0, 10) || "",
      endDate: tournament.endDate?.slice(0, 10) || "",
    });
    setEditOpen(true);
  };

  const saveEdit = async () => {
    try {
      await axios.put(
        `http://localhost:5000/api/tournaments/${editData._id}`,
        {
          eventName: editData.eventName,
          location: editData.location,
          startDate: editData.startDate,
          endDate: editData.endDate,
          maxParticipants: editData.maxParticipants,
          description: editData.description,
          rules: editData.rules,
          status: editData.status,
        },
        auth
      );
      setEditOpen(false);
      fetchTournaments();
      alert("✅ Tournament updated successfully");
    } catch (err) {
      alert("❌ Update failed");
    }
  };

  const deleteTournament = async (id) => {
    if (!window.confirm("Delete this tournament?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/tournaments/${id}`, auth);
      fetchTournaments();
      alert("✅ Tournament deleted successfully");
    } catch (err) {
      alert("❌ Delete failed");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "TBD";
    return new Date(dateString).toLocaleDateString();
  };

  const buttonStyles = {
    view: { backgroundColor: "#2563EB", color: "white", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", marginRight: "5px" },
    edit: { backgroundColor: "#f59e0b", color: "white", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", marginRight: "5px" },
    delete: { backgroundColor: "#ef4444", color: "white", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer" },
    save: { backgroundColor: "#10b981", color: "white", border: "none", padding: "10px 20px", borderRadius: "6px", cursor: "pointer", marginRight: "10px" },
    cancel: { backgroundColor: "#6b7280", color: "white", border: "none", padding: "10px 20px", borderRadius: "6px", cursor: "pointer" },
  };

  const getStatusStyle = (status) => {
    switch(status) {
      case "upcoming": return { backgroundColor: "#f59e0b", color: "white", padding: "4px 10px", borderRadius: "20px", fontSize: "12px" };
      case "ongoing": return { backgroundColor: "#10b981", color: "white", padding: "4px 10px", borderRadius: "20px", fontSize: "12px" };
      default: return { backgroundColor: "#6b7280", color: "white", padding: "4px 10px", borderRadius: "20px", fontSize: "12px" };
    }
  };

  if (loading) return <div style={{ padding: "20px" }}><SkeletonTable rows={8} cols={7} /></div>;

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ marginBottom: "20px" }}>
        <h2>All Tournaments</h2>
        <button 
          style={{ backgroundColor: "#10b981", color: "white", border: "none", padding: "10px 20px", borderRadius: "6px", cursor: "pointer" }}
          onClick={() => navigate("/admin/tournament/create")}
        >
          + Create Tournament
        </button>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", backgroundColor: "white" }}>
        <thead>
          <tr style={{ backgroundColor: "#f3f4f6", borderBottom: "2px solid #e5e7eb" }}>
            <th style={{ padding: "12px", textAlign: "left" }}>#</th>
            <th style={{ padding: "12px", textAlign: "left" }}>Tournament</th>
            <th style={{ padding: "12px", textAlign: "left" }}>Sport</th>
            <th style={{ padding: "12px", textAlign: "left" }}>Location</th>
            <th style={{ padding: "12px", textAlign: "left" }}>Dates</th>
            <th style={{ padding: "12px", textAlign: "left" }}>Status</th>
            <th style={{ padding: "12px", textAlign: "left" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {tournaments.map((t, index) => (
            <tr key={t._id} style={{ borderBottom: "1px solid #e5e7eb" }}>
              <td style={{ padding: "12px" }}>{index + 1}</td>
              <td style={{ padding: "12px" }}><strong>{t.eventName}</strong></td>
              <td style={{ padding: "12px" }}>{t.sportId?.name || "N/A"}</td>
              <td style={{ padding: "12px" }}>{t.location || "TBD"}</td>
              <td style={{ padding: "12px" }}>{formatDate(t.startDate)} → {formatDate(t.endDate)}</td>
              <td style={{ padding: "12px" }}><span style={getStatusStyle(t.status)}>{t.status}</span></td>
              <td style={{ padding: "12px" }}>
                <button style={buttonStyles.view} onClick={() => navigate(`/admin/tournament/${t._id}`)}>View</button>
                <button style={buttonStyles.edit} onClick={() => openEdit(t)}>Edit</button>
                <button style={buttonStyles.delete} onClick={() => deleteTournament(t._id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Edit Modal */}
      {editOpen && editData && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "8px", width: "500px", maxWidth: "90%" }}>
            <h3>Edit Tournament</h3>
            <input style={{ width: "100%", padding: "8px", margin: "10px 0", border: "1px solid #ccc", borderRadius: "4px" }} value={editData.eventName} onChange={e => setEditData({...editData, eventName: e.target.value})} placeholder="Tournament Name" />
            <input style={{ width: "100%", padding: "8px", margin: "10px 0", border: "1px solid #ccc", borderRadius: "4px" }} value={editData.location} onChange={e => setEditData({...editData, location: e.target.value})} placeholder="Location" />
            <input type="date" style={{ width: "100%", padding: "8px", margin: "10px 0", border: "1px solid #ccc", borderRadius: "4px" }} value={editData.startDate} onChange={e => setEditData({...editData, startDate: e.target.value})} />
            <input type="date" style={{ width: "100%", padding: "8px", margin: "10px 0", border: "1px solid #ccc", borderRadius: "4px" }} value={editData.endDate} onChange={e => setEditData({...editData, endDate: e.target.value})} />
            <select style={{ width: "100%", padding: "8px", margin: "10px 0", border: "1px solid #ccc", borderRadius: "4px" }} value={editData.status} onChange={e => setEditData({...editData, status: e.target.value})}>
              <option value="upcoming">Upcoming</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
            </select>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px" }}>
              <button style={buttonStyles.cancel} onClick={() => setEditOpen(false)}>Cancel</button>
              <button style={buttonStyles.save} onClick={saveEdit}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}