import React, { useEffect, useState } from "react";
import axios from "axios";
import "./AdminUsers.css";

export default function AdminUsers() {
  const token = localStorage.getItem("token");

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [editUser, setEditUser] = useState(null);
  const [showEditPopup, setShowEditPopup] = useState(false);

  const [editForm, setEditForm] = useState({
    name: "",
    role: "",
    status: "",
  });

  const authHeader = {
    headers: { Authorization: `Bearer ${token}` },
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/users",
        authHeader
      );
      // ✅ Filter out any null/undefined users and ensure we have an array
      const validUsers = (res.data || []).filter(user => user && typeof user === 'object');
      setUsers(validUsers);
    } catch (err) {
      console.error("Failed to load users:", err);
      setUsers([]);
    }
  };

  /* ================= BLOCK / UNBLOCK ================= */
  const toggleStatus = async (id, current) => {
    try {
      await axios.put(
        `http://localhost:5000/api/users/${id}`,
        { status: current === "active" ? "blocked" : "active" },
        authHeader
      );
      loadUsers();
    } catch (err) {
      console.error("Failed to toggle status:", err);
      alert("Failed to update user status");
    }
  };

  /* ================= DELETE ================= */
  const deleteUser = async (id, name) => {
    if (!window.confirm(`Are you sure you want to permanently delete user "${name}"?`)) {
      return;
    }
    try {
      await axios.delete(`http://localhost:5000/api/users/${id}`, authHeader);
      alert("User deleted successfully!");
      loadUsers();
    } catch (err) {
      console.error("Failed to delete user:", err);
      alert("Failed to delete user");
    }
  };

  /* ================= EDIT ================= */
  const openEdit = (u) => {
    if (!u) return;
    setEditUser(u);
    setEditForm({
      name: u.name || "",
      role: u.role || "player",
      status: u.status || "active",
    });
    setShowEditPopup(true);
  };

  const closeEditPopup = () => {
    setShowEditPopup(false);
    setEditUser(null);
  };

  const saveEdit = async () => {
    try {
      await axios.put(
        `http://localhost:5000/api/users/${editUser._id}`,
        editForm,
        authHeader
      );
      closeEditPopup();
      loadUsers();
      alert("User updated successfully!");
    } catch (err) {
      console.error("Failed to update user:", err);
      alert("Failed to update user");
    }
  };

  // ✅ SUPER SAFE filtering - checks every property exists before using
  const filteredUsers = (users || []).filter((u) => {
    // Skip if user is null/undefined or not an object
    if (!u || typeof u !== 'object') return false;
    
    const searchLower = (search || "").toLowerCase();
    
    // Safe property access with fallbacks
    const userName = (u.name || "").toLowerCase();
    const userEmail = (u.email || "").toLowerCase();
    
    return userName.includes(searchLower) || userEmail.includes(searchLower);
  });

  // Style for status select dropdown
  const getStatusSelectStyle = (status) => {
    return {
      backgroundColor: status === "blocked" ? "#fee2e2" : "#dcfce7",
      color: status === "blocked" ? "#dc2626" : "#16a34a",
      fontWeight: "bold",
      border: status === "blocked" ? "1px solid #dc2626" : "1px solid #16a34a",
      borderRadius: "6px",
      padding: "8px 12px",
      cursor: "pointer",
    };
  };

  return (
    <div className="admin-layout">
      <main className="content">
        <h1>User Management</h1>

        {/* SEARCH */}
        <input
          className="search"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* TABLE */}
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((u) => (
                <tr key={u._id || Math.random()}>
                  <td
                    className="click"
                    onClick={() => setSelectedUser(u)}
                  >
                    {u.name || "N/A"}
                  </td>
                  <td>{u.email || "N/A"}</td>
                  <td>{u.role || "N/A"}</td>
                  <td>
                    <span 
                      style={{
                        backgroundColor: u.status === "blocked" ? "#fee2e2" : "#dcfce7",
                        color: u.status === "blocked" ? "#dc2626" : "#16a34a",
                        padding: "4px 10px",
                        borderRadius: "20px",
                        fontSize: "12px",
                        fontWeight: "bold",
                        display: "inline-block",
                      }}
                    >
                      {u.status || "active"}
                    </span>
                  </td>
                  <td>
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "N/A"}
                  </td>
                  <td className="actions">
                    <button
                      className="edit-btn"
                      onClick={() => openEdit(u)}
                      style={{
                        backgroundColor: "#4f46e5",
                        color: "white",
                        border: "none",
                        padding: "5px 12px",
                        borderRadius: "6px",
                        cursor: "pointer",
                        marginRight: "5px",
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => toggleStatus(u._id, u.status)}
                      style={{
                        backgroundColor: u.status === "active" ? "#ef4444" : "#10b981",
                        color: "white",
                        border: "none",
                        padding: "5px 12px",
                        borderRadius: "6px",
                        cursor: "pointer",
                      }}
                    >
                      {u.status === "active" ? "Block" : "Unblock"}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteUser(u._id, u.name);
                      }}
                      style={{
                        backgroundColor: "#dc2626",
                        color: "white",
                        border: "none",
                        padding: "5px 12px",
                        borderRadius: "6px",
                        cursor: "pointer",
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" style={{ textAlign: "center", padding: "40px" }}>
                  {search ? "No users match your search" : "No users found"}
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* VIEW MODAL */}
        {selectedUser && (
          <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
            <div className="modal view-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>User Details</h3>
                <button className="close-btn" onClick={() => setSelectedUser(null)}>×</button>
              </div>
              <div className="modal-body">
                <div className="detail-row">
                  <span className="detail-label">Name:</span>
                  <span className="detail-value">{selectedUser.name || "N/A"}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Email:</span>
                  <span className="detail-value">{selectedUser.email || "N/A"}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Role:</span>
                  <span className="detail-value">{selectedUser.role || "N/A"}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Status:</span>
                  <span 
                    style={{
                      backgroundColor: selectedUser.status === "blocked" ? "#fee2e2" : "#dcfce7",
                      color: selectedUser.status === "blocked" ? "#dc2626" : "#16a34a",
                      padding: "4px 10px",
                      borderRadius: "20px",
                      fontSize: "12px",
                      fontWeight: "bold",
                      display: "inline-block",
                    }}
                  >
                    {selectedUser.status || "active"}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Joined:</span>
                  <span className="detail-value">
                    {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleString() : "N/A"}
                  </span>
                </div>
              </div>
              <div className="modal-footer">
                <button className="close-modal-btn" onClick={() => setSelectedUser(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* EDIT POPUP */}
        {showEditPopup && editUser && (
          <div className="popup-overlay" onClick={closeEditPopup}>
            <div className="popup-container" onClick={(e) => e.stopPropagation()}>
              <div className="popup-header">
                <h2>Edit User</h2>
                <button className="popup-close" onClick={closeEditPopup}>×</button>
              </div>
              
              <div className="popup-body">
                <div className="popup-field">
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, name: e.target.value })
                    }
                    placeholder="Enter full name"
                  />
                </div>

                <div className="popup-field">
                  <label>Email</label>
                  <input
                    type="email"
                    value={editUser?.email || ""}
                    disabled
                    className="disabled-field"
                  />
                  <small className="field-note">Email cannot be changed</small>
                </div>

                <div className="popup-field">
                  <label>Role</label>
                  <select
                    value={editForm.role}
                    onChange={(e) =>
                      setEditForm({ ...editForm, role: e.target.value })
                    }
                  >
                    <option value="player">Player</option>
                    <option value="coach">Coach</option>
                    <option value="organizer">Organizer</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="popup-field">
                  <label>Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) =>
                      setEditForm({ ...editForm, status: e.target.value })
                    }
                    style={getStatusSelectStyle(editForm.status)}
                  >
                    <option 
                      value="active"
                      style={{ backgroundColor: "#dcfce7", color: "#16a34a" }}
                    >
                      ✅ Active
                    </option>
                    <option 
                      value="blocked"
                      style={{ backgroundColor: "#fee2e2", color: "#dc2626" }}
                    >
                      ❌ Blocked
                    </option>
                  </select>
                </div>
              </div>

              <div className="popup-footer">
                <button className="popup-cancel-btn" onClick={closeEditPopup}>
                  Cancel
                </button>
                <button className="popup-save-btn" onClick={saveEdit}>
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}