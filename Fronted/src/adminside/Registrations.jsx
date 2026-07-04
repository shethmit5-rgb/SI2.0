import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Registrations.css";
import SkeletonTable from "../components/loading/SkeletonTable";

export default function Registrations() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  const authHeader = {
    headers: { Authorization: `Bearer ${token}` },
  };

  /* ================= LOAD REGISTRATIONS ================= */
  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/registrations",
        authHeader
      );
      setRegistrations(res.data);
    } catch (err) {
      alert("Failed to load registrations");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /* ================= UPDATE STATUS ================= */
  const updateStatus = async (id, status) => {
    try {
      await axios.put(
        `http://localhost:5000/api/registrations/${id}`,
        { approvalStatus: status },
        authHeader
      );
      fetchRegistrations();
    } catch (err) {
      alert("Action failed");
    }
  };

  if (loading) {
    return (
      <div className="reg-page">
        <SkeletonTable rows={8} cols={6} />
      </div>
    );
  }

  return (
    <div className="reg-page">
      <div className="reg-card">
        <h2>Team Registrations</h2>

        <table className="reg-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Team Name</th>
              <th>Coach Name</th>
              <th>Tournament Name</th>
              <th>Registration Fee</th>
              <th>Payment Status</th>
              <th>Approval Status</th>
              <th>Payment Deadline</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {registrations.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: "center" }}>
                  No registrations found
                </td>
              </tr>
            ) : (
              registrations.map((r, index) => (
                <tr key={r._id}>
                  <td>{index + 1}</td>

                  <td>
                    <strong>{r.teamId?.teamName || "N/A"}</strong>
                  </td>

                  <td>{r.userId?.name || "N/A"}</td>

                  <td>{r.tournamentId?.eventName || "N/A"}</td>

                  <td>
                    {r.tournamentId?.teamRegistrationFee > 0
                      ? `₹${r.tournamentId.teamRegistrationFee}`
                      : "Free"}
                  </td>

                  <td>
                    <span
                      className={`payment ${
                        r.paymentStatus === "Paid" || r.paymentStatus === "paid" ? "paid" : "unpaid"
                      }`}
                    >
                      {r.paymentStatus === "Paid" || r.paymentStatus === "paid" ? "Paid" : "Unpaid"}
                    </span>
                  </td>

                  <td>
                    <span className={`status ${r.approvalStatus}`}>
                      {r.approvalStatus === "approved_pending_payment"
                        ? "Approved (Pending Payment)"
                        : r.approvalStatus === "approved"
                        ? "Approved"
                        : r.approvalStatus.charAt(0).toUpperCase() + r.approvalStatus.slice(1)}
                    </span>
                  </td>

                  <td>
                    {r.approvalStatus === "approved_pending_payment" && r.paymentDeadline
                      ? new Date(r.paymentDeadline).toLocaleString()
                      : "N/A"}
                  </td>

                  <td className="actions">
                    {r.approvalStatus === "pending" && (
                      <>
                        <button
                          className="approve"
                          onClick={() => updateStatus(r._id, "approved")}
                        >
                          Approve
                        </button>

                        <button
                          className="reject"
                          onClick={() => updateStatus(r._id, "rejected")}
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
