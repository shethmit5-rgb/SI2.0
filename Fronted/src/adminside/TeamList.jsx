import React, { useEffect, useState } from "react";
import axios from "axios";
import "./AdminDashboard.css";
import SkeletonTable from "../components/loading/SkeletonTable";

export default function TeamList() {
  const token = localStorage.getItem("token");
  const auth = { headers: { Authorization: `Bearer ${token}` } };

  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  const [message, setMessage] = useState(null);

  /* EDIT MODAL STATE */
  const [showModal, setShowModal] = useState(false);
  const [editTeam, setEditTeam] = useState(null);

  /* LOAD TEAMS */
  const loadTeams = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5000/api/teams", auth);
      setTeams(res.data);
    } catch (err) {
      setMessage({ type: "error", text: "Failed to load teams" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeams();
  }, []);

  /* DELETE TEAM */
  const deleteTeam = async (id) => {
    if (!window.confirm("Are you sure you want to delete this team?")) return;

    try {
      await axios.delete(`http://localhost:5000/api/teams/${id}`, auth);
      setMessage({ type: "success", text: "Team deleted successfully" });
      setTeams(prev => prev.filter(t => t._id !== id));
    } catch {
      setMessage({ type: "error", text: "Delete failed" });
    }
  };

  /* OPEN EDIT MODAL */
  const openEdit = (team) => {
    setEditTeam({
      _id: team._id,
      teamName: team.teamName,
    });
    setShowModal(true);
  };

  /* SAVE EDIT */
  const saveEdit = async (e) => {
    e.preventDefault();

    try {
      await axios.put(
        `http://localhost:5000/api/teams/${editTeam._id}`,
        { teamName: editTeam.teamName },
        auth
      );

      setMessage({ type: "success", text: "Team updated successfully" });
      setShowModal(false);
      loadTeams();
    } catch {
      setMessage({ type: "error", text: "Update failed" });
    }
  };

  return (
    <div className="admin-layout">
      <main className="content">
        <h1>Teams</h1>

        {message && (
          <div className={`alert ${message.type}`}>
            {message.text}
          </div>
        )}

        <section className="panel">
          {loading ? (
            <SkeletonTable rows={6} cols={4} noCard={true} />
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Tournament</th>
                  <th>Captain</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {teams.map(t => (
                  <tr key={t._id}>
                    <td>{t.teamName}</td>
                    <td>{t.tournamentId?.eventName}</td>
                    <td>{t.captainId?.name}</td>
                    <td>
                      <div className="table-actions">
                        <button onClick={() => openEdit(t)}>Edit</button>
                        <button
                          className="danger"
                          onClick={() => deleteTeam(t._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </main>

      {/* ================= EDIT MODAL ================= */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Edit Team</h3>

            <form onSubmit={saveEdit}>
              <input
                value={editTeam.teamName}
                onChange={(e) =>
                  setEditTeam({ ...editTeam, teamName: e.target.value })
                }
                required
              />

              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button type="submit">Save</button>
                <button
                  type="button"
                  className="danger"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
