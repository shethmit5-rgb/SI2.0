import React, { useEffect, useState } from "react";
import axios from "axios";
import "./AdminDashboard.css";
import SkeletonTable from "../components/loading/SkeletonTable";

export default function ApprovePlayers() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  // 🔒 AUTH HEADER
  const auth = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  // ================= FETCH DATA =================
  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);

      const res = await axios.get(
        "http://localhost:5000/api/registrations",
        auth
      );

      setRegistrations(res.data);
    } catch (err) {
      console.error("Fetch error:", err);

      if (err.response?.status === 403) {
        alert("❌ Access denied (Admin only)");
      } else if (err.response?.status === 401) {
        alert("⚠️ Please login again");
      }
    } finally {
      setLoading(false);
    }
  };

  // ================= UPDATE STATUS =================
  const updateStatus = async (id, status) => {
    try {
      await axios.put(
        `http://localhost:5000/api/registrations/${id}`,
        { approvalStatus: status },
        auth
      );

      // 🔄 update UI
      setRegistrations((prev) =>
        prev.map((r) =>
          r._id === id ? { ...r, approvalStatus: status } : r
        )
      );

    } catch (err) {
      console.error("Update error:", err);

      if (err.response?.status === 403) {
        alert("❌ Only admin can perform this action");
      } else {
        alert("Something went wrong");
      }
    }
  };

  // ================= LOADING =================
  if (loading) {
    return (
      <div className="admin-layout">
        <main className="content">
          <SkeletonTable rows={8} cols={6} />
        </main>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      <main className="content">
        <h1>Approve Players</h1>

        <section className="panel">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Team</th>
                <th>Tournament</th>
                <th>Sport</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {registrations.length > 0 ? (
                registrations.map((r) => (
                  <tr key={r._id}>
                    <td>{r.userId?.name}</td>
                    <td>{r.teamId?.teamName}</td>
                    <td>{r.tournamentId?.eventName}</td>
                    <td>{r.tournamentId?.sportId?.name}</td>
                    <td className={r.approvalStatus}>
                      {r.approvalStatus}
                    </td>

                    <td>
                      <button
                        disabled={r.approvalStatus === "approved"}
                        onClick={() =>
                          updateStatus(r._id, "approved")
                        }
                      >
                        Approve
                      </button>

                      <button
                        className="danger"
                        disabled={r.approvalStatus === "rejected"}
                        onClick={() =>
                          updateStatus(r._id, "rejected")
                        }
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" style={{ textAlign: "center" }}>
                    No registrations found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
}