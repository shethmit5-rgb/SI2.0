import React, { useEffect, useState } from "react";
import axios from "axios";
import "./AdminDashboard.css";
import SkeletonTable from "../components/loading/SkeletonTable";

export default function SportManagement() {
  const token = localStorage.getItem("token");
  const auth = { headers: { Authorization: `Bearer ${token}` } };

  const [sports, setSports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSport, setEditingSport] = useState(null);
  const [form, setForm] = useState({
    name: "",
    type: "Outdoor",
    playersPerTeam: "",
  });

  // Fetch sports
  useEffect(() => {
    fetchSports();
  }, []);

  const fetchSports = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5000/api/sports");
      setSports(res.data);
    } catch (err) {
      console.error("Failed to fetch sports:", err);
      alert("Failed to load sports");
    } finally {
      setLoading(false);
    }
  };

  // Handle form input
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Open add modal
  const openAddModal = () => {
    setEditingSport(null);
    setForm({ name: "", type: "Outdoor", playersPerTeam: "" });
    setShowModal(true);
  };

  // Open edit modal
  const openEditModal = (sport) => {
    setEditingSport(sport);
    setForm({
      name: sport.name,
      type: sport.type,
      playersPerTeam: sport.playersPerTeam || "",
    });
    setShowModal(true);
  };

  // Save sport (create or update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.name.trim()) {
      alert("Sport name is required");
      return;
    }

    try {
      if (editingSport) {
        // Update
        await axios.put(
          `http://localhost:5000/api/sports/${editingSport._id}`,
          form,
          auth
        );
        alert("✅ Sport updated successfully!");
      } else {
        // Create
        await axios.post("http://localhost:5000/api/sports", form, auth);
        alert("✅ Sport created successfully!");
      }
      
      setShowModal(false);
      fetchSports();
    } catch (err) {
      console.error("Save failed:", err);
      alert(err.response?.data?.message || "Failed to save sport");
    }
  };

  // Delete sport
  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    
    try {
      await axios.delete(`http://localhost:5000/api/sports/${id}`, auth);
      alert("✅ Sport deleted successfully!");
      fetchSports();
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete sport. It may be used in tournaments.");
    }
  };

  // Button styles
  const buttonStyles = {
    add: {
      backgroundColor: "#10b981",
      color: "white",
      border: "none",
      padding: "10px 20px",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: "500",
      marginBottom: "20px",
    },
    edit: {
      backgroundColor: "#f59e0b",
      color: "white",
      border: "none",
      padding: "6px 12px",
      borderRadius: "6px",
      cursor: "pointer",
      marginRight: "5px",
      fontSize: "12px",
    },
    delete: {
      backgroundColor: "#ef4444",
      color: "white",
      border: "none",
      padding: "6px 12px",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "12px",
    },
    save: {
      backgroundColor: "#10b981",
      color: "white",
      border: "none",
      padding: "10px 20px",
      borderRadius: "6px",
      cursor: "pointer",
      marginRight: "10px",
      fontSize: "14px",
    },
    cancel: {
      backgroundColor: "#6b7280",
      color: "white",
      border: "none",
      padding: "10px 20px",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "14px",
    },
    close: {
      backgroundColor: "#ef4444",
      color: "white",
      border: "none",
      fontSize: "20px",
      cursor: "pointer",
      width: "30px",
      height: "30px",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
  };

  const modalOverlayStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  };

  const modalStyle = {
    backgroundColor: "white",
    padding: "25px",
    borderRadius: "12px",
    width: "450px",
    maxWidth: "90%",
  };

  if (loading) {
    return (
      <div className="admin-layout">
        <main className="content">
          <SkeletonTable rows={8} cols={5} />
        </main>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      <main className="content">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h1>🏅 Sport Management</h1>
          <button 
            style={buttonStyles.add}
            onClick={openAddModal}
            onMouseEnter={(e) => e.target.style.backgroundColor = "#059669"}
            onMouseLeave={(e) => e.target.style.backgroundColor = "#10b981"}
          >
            + Add New Sport
          </button>
        </div>

        <section className="panel">
          {sports.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px" }}>
              <p>No sports found. Click "Add New Sport" to create one.</p>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#f3f4f6", borderBottom: "2px solid #e5e7eb" }}>
                  <th style={{ padding: "12px", textAlign: "left" }}>#</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>Sport Name</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>Type</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>Players/Team</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sports.map((sport, index) => (
                  <tr key={sport._id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={{ padding: "12px" }}>{index + 1}</td>
                    <td style={{ padding: "12px" }}>
                      <strong>{sport.name}</strong>
                    </td>
                    <td style={{ padding: "12px" }}>
                      <span style={{
                        backgroundColor: sport.type === "Outdoor" ? "#dbeafe" : "#fce7f3",
                        color: sport.type === "Outdoor" ? "#1d4ed8" : "#be185d",
                        padding: "4px 10px",
                        borderRadius: "20px",
                        fontSize: "12px",
                        fontWeight: "bold",
                      }}>
                        {sport.type}
                      </span>
                    </td>
                    <td style={{ padding: "12px" }}>{sport.playersPerTeam || "Not specified"}</td>
                    <td style={{ padding: "12px" }}>
                      <button
                        style={buttonStyles.edit}
                        onClick={() => openEditModal(sport)}
                        onMouseEnter={(e) => e.target.style.backgroundColor = "#d97706"}
                        onMouseLeave={(e) => e.target.style.backgroundColor = "#f59e0b"}
                      >
                        Edit
                      </button>
                      <button
                        style={buttonStyles.delete}
                        onClick={() => handleDelete(sport._id, sport.name)}
                        onMouseEnter={(e) => e.target.style.backgroundColor = "#dc2626"}
                        onMouseLeave={(e) => e.target.style.backgroundColor = "#ef4444"}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </main>

      {/* Add/Edit Modal */}
      {showModal && (
        <div style={modalOverlayStyle} onClick={() => setShowModal(false)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ margin: 0 }}>{editingSport ? "✏️ Edit Sport" : "➕ Add New Sport"}</h2>
              <button style={buttonStyles.close} onClick={() => setShowModal(false)}>×</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Sport Name *</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g., Cricket, Football, Basketball"
                  style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ccc" }}
                  required
                />
              </div>

              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Sport Type</label>
                <select
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                  style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ccc" }}
                >
                  <option value="Outdoor">Outdoor</option>
                  <option value="Indoor">Indoor</option>
                </select>
              </div>

              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Players Per Team</label>
                <input
                  type="number"
                  name="playersPerTeam"
                  value={form.playersPerTeam}
                  onChange={handleChange}
                  placeholder="e.g., 11 for Cricket, 5 for Basketball"
                  style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ccc" }}
                />
                <small style={{ color: "#666" }}>Optional - Leave empty if not applicable</small>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px" }}>
                <button
                  type="button"
                  style={buttonStyles.cancel}
                  onClick={() => setShowModal(false)}
                  onMouseEnter={(e) => e.target.style.backgroundColor = "#4b5563"}
                  onMouseLeave={(e) => e.target.style.backgroundColor = "#6b7280"}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={buttonStyles.save}
                  onMouseEnter={(e) => e.target.style.backgroundColor = "#059669"}
                  onMouseLeave={(e) => e.target.style.backgroundColor = "#10b981"}
                >
                  {editingSport ? "Update Sport" : "Create Sport"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}