import React, { useEffect, useState } from "react";
import { getAdminPayments, adminOverridePayment } from "../services/paymentService";
import "./AdminPayments.css";

export default function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [overridePayment, setOverridePayment] = useState(null);
  const [newStatus, setNewStatus] = useState("paid");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const data = await getAdminPayments();
      setPayments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load admin payments:", error);
      alert("Failed to load payment transactions.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenOverride = (payment) => {
    setOverridePayment(payment);
    // Set default select option based on current status
    setNewStatus(payment.status === "created" ? "created" : payment.status);
  };

  const handleCloseOverride = () => {
    setOverridePayment(null);
    setNewStatus("paid");
  };

  const handleSaveOverride = async () => {
    if (!overridePayment) return;
    try {
      setSubmitting(true);
      const res = await adminOverridePayment(overridePayment._id, newStatus);
      if (res.success) {
        alert(res.message || "Payment status updated successfully!");
        handleCloseOverride();
        loadPayments();
      } else {
        alert(res.message || "Failed to update payment status.");
      }
    } catch (error) {
      console.error("Override status error:", error);
      alert(error.response?.data?.message || "Failed to update payment status.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatPaymentType = (type) => {
    switch (type) {
      case "tournament_creation":
        return "Tournament Creation";
      case "team_registration":
        return "Team Registration";
      case "player_joining":
        return "Player Joining";
      case "sponsorship":
        return "Sponsorship";
      default:
        return type || "N/A";
    }
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case "paid":
        return { backgroundColor: "#dcfce7", color: "#15803d" };
      case "failed":
        return { backgroundColor: "#fee2e2", color: "#b91c1c" };
      case "refunded":
        return { backgroundColor: "#fef3c7", color: "#d97706" };
      case "created":
      case "attempted":
        return { backgroundColor: "#e0f2fe", color: "#0369a1" };
      default:
        return { backgroundColor: "#f3f4f6", color: "#374151" };
    }
  };

  // Safe search and filters
  const filteredPayments = payments.filter((p) => {
    if (!p) return false;

    // Search query matches User name/email, order ID, or payment ID
    const searchLower = search.toLowerCase();
    const userName = (p.userId?.name || "").toLowerCase();
    const userEmail = (p.userId?.email || "").toLowerCase();
    const orderId = (p.razorpayOrderId || "").toLowerCase();
    const paymentId = (p.razorpayPaymentId || "").toLowerCase();
    const matchesSearch = 
      userName.includes(searchLower) ||
      userEmail.includes(searchLower) ||
      orderId.includes(searchLower) ||
      paymentId.includes(searchLower);

    // Status filter
    let matchesStatus = true;
    if (statusFilter !== "all") {
      if (statusFilter === "pending") {
        matchesStatus = p.status === "created" || p.status === "attempted";
      } else {
        matchesStatus = p.status === statusFilter;
      }
    }

    // Type filter
    let matchesType = true;
    if (typeFilter !== "all") {
      matchesType = p.paymentType === typeFilter;
    }

    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="admin-payments-page">
      <main className="content">
        <div className="admin-header-row">
          <div>
            <h1>💳 Payments Management</h1>
            <p className="admin-subtitle">Track, view, and manually override transaction payment records.</p>
          </div>
          <button onClick={loadPayments} className="refresh-btn-premium light-sweep-wrapper">
            🔄 Refresh Payments
          </button>
        </div>

        {/* FILTERS */}
        <div className="filters-container">
          <div className="filter-item search-field">
            <label>Search Transactions</label>
            <input
              type="text"
              placeholder="Search by User, Order ID, Payment ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="filter-item">
            <label>Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Statuses</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>

          <div className="filter-item">
            <label>Payment Type</label>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="all">All Types</option>
              <option value="tournament_creation">Tournament Creation</option>
              <option value="team_registration">Team Registration</option>
              <option value="player_joining">Player Joining</option>
              <option value="sponsorship">Sponsorship</option>
            </select>
          </div>
        </div>

        {/* TABLE */}
        <div className="table-card">
          <div className="table-container-fixed">
            <table className="payments-table">
              <thead>
                <tr>
                  <th>User / Role</th>
                  <th>Type</th>
                  <th>Entity Details</th>
                  <th>Amount</th>
                  <th>Order ID / Payment ID</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: "center", padding: "40px" }}>
                      <div className="loading-spinner" style={{ margin: "0 auto 10px" }}></div>
                      Loading payments...
                    </td>
                  </tr>
                ) : filteredPayments.length > 0 ? (
                  filteredPayments.map((p) => (
                    <tr key={p._id || Math.random()}>
                      <td className="click" onClick={() => setSelectedPayment(p)}>
                        <div className="user-info-cell">
                          <strong>{p.userId?.name || "N/A"}</strong>
                          <span className="user-email">{p.userId?.email || "N/A"}</span>
                          <span className="user-role-badge">{p.userId?.role || "N/A"}</span>
                        </div>
                      </td>
                      <td>
                        <span className="payment-type-txt">
                          {formatPaymentType(p.paymentType)}
                        </span>
                      </td>
                      <td>
                        <div className="entity-details">
                          {p.paymentType === "tournament_creation" && (
                            <>
                              <span className="entity-label">Tournament (Pending):</span>
                              <strong>{p.tempData?.eventName || "N/A"}</strong>
                            </>
                          )}
                          {p.paymentType === "team_registration" && (
                            <>
                              <div>
                                <span className="entity-label">Tournament:</span>{" "}
                                <strong>{p.tournamentId?.eventName || "N/A"}</strong>
                              </div>
                              <div>
                                <span className="entity-label">Team:</span>{" "}
                                <strong>{p.teamId?.teamName || "N/A"}</strong>
                              </div>
                            </>
                          )}
                          {p.paymentType === "player_joining" && (
                            <>
                              <span className="entity-label">Team:</span>{" "}
                              <strong>{p.teamId?.teamName || "N/A"}</strong>
                            </>
                          )}
                          {p.paymentType === "sponsorship" && (
                            <>
                              <span className="entity-label">Sponsor Flow</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td>
                        <strong className="amount-txt">₹{(p.amount || 0).toLocaleString()}</strong>
                      </td>
                      <td>
                        <div className="ids-cell">
                          <span className="id-item"><strong>Order:</strong> {p.razorpayOrderId || "N/A"}</span>
                          <span className="id-item"><strong>Pay:</strong> {p.razorpayPaymentId || "N/A"}</span>
                        </div>
                      </td>
                      <td>
                        {p.createdAt ? new Date(p.createdAt).toLocaleString() : "N/A"}
                      </td>
                      <td>
                        <span className="status-badge-inline" style={getStatusBadgeStyle(p.status)}>
                          {p.status === "created" || p.status === "attempted" ? "Pending" : p.status}
                        </span>
                      </td>
                      <td className="actions-cell">
                        <button
                          className="action-btn override-btn"
                          onClick={() => handleOpenOverride(p)}
                        >
                          ✏️ Override
                        </button>
                        <button
                          className="action-btn details-btn"
                          onClick={() => setSelectedPayment(p)}
                        >
                          👁️ View
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" style={{ textAlign: "center", padding: "40px" }}>
                      No payments matched your search filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* VIEW DETAILS MODAL */}
        {selectedPayment && (
          <div className="modal-overlay" onClick={() => setSelectedPayment(null)}>
            <div className="modal view-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Payment Details</h3>
                <button className="close-btn" onClick={() => setSelectedPayment(null)}>×</button>
              </div>
              <div className="modal-body">
                <div className="detail-row">
                  <span className="detail-label">User Name:</span>
                  <span className="detail-value">{selectedPayment.userId?.name || "N/A"}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">User Email:</span>
                  <span className="detail-value">{selectedPayment.userId?.email || "N/A"}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">User Role:</span>
                  <span className="detail-value" style={{ textTransform: "capitalize" }}>
                    {selectedPayment.userId?.role || "N/A"}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Payment Type:</span>
                  <span className="detail-value">{formatPaymentType(selectedPayment.paymentType)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Amount:</span>
                  <span className="detail-value" style={{ color: "var(--primary)", fontWeight: "bold" }}>
                    ₹{(selectedPayment.amount || 0).toLocaleString()}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Status:</span>
                  <span className="status-badge-inline" style={getStatusBadgeStyle(selectedPayment.status)}>
                    {selectedPayment.status === "created" || selectedPayment.status === "attempted" ? "Pending" : selectedPayment.status}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Order ID:</span>
                  <span className="detail-value code-text">{selectedPayment.razorpayOrderId || "N/A"}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Payment ID:</span>
                  <span className="detail-value code-text">{selectedPayment.razorpayPaymentId || "N/A"}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Signature:</span>
                  <span className="detail-value code-text signature-txt">
                    {selectedPayment.razorpaySignature || "N/A"}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Created At:</span>
                  <span className="detail-value">
                    {selectedPayment.createdAt ? new Date(selectedPayment.createdAt).toLocaleString() : "N/A"}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Updated At:</span>
                  <span className="detail-value">
                    {selectedPayment.updatedAt ? new Date(selectedPayment.updatedAt).toLocaleString() : "N/A"}
                  </span>
                </div>

                {selectedPayment.paymentType === "tournament_creation" && selectedPayment.tempData && (
                  <div className="temp-data-box">
                    <h4>Temporary Tournament Form Inputs:</h4>
                    <pre className="raw-json">
                      {JSON.stringify(selectedPayment.tempData, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button className="close-modal-btn" onClick={() => setSelectedPayment(null)}>
                  Close Details
                </button>
              </div>
            </div>
          </div>
        )}

        {/* OVERRIDE STATUS POPUP */}
        {overridePayment && (
          <div className="popup-overlay" onClick={handleCloseOverride}>
            <div className="popup-container" onClick={(e) => e.stopPropagation()}>
              <div className="popup-header">
                <h2>Override Payment Status</h2>
                <button className="popup-close" onClick={handleCloseOverride}>×</button>
              </div>
              <div className="popup-body">
                <div className="override-warning">
                  ⚠️ <strong>Notice:</strong> Manually changing status will update the payment state in the system.
                  If status changes to "Paid", the underlying Tournament/Registration will be created if not present.
                  If status changes to Failed/Refunded, documents will NOT be automatically deleted, keeping them intact.
                </div>

                <div className="popup-field">
                  <label>Transaction ID</label>
                  <input type="text" value={overridePayment._id} disabled className="disabled-field" />
                </div>

                <div className="popup-field">
                  <label>Current Status</label>
                  <span className="status-badge-inline" style={getStatusBadgeStyle(overridePayment.status)}>
                    {overridePayment.status}
                  </span>
                </div>

                <div className="popup-field">
                  <label>New Override Status</label>
                  <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                    <option value="paid">✅ Paid (Completes action / creates entity)</option>
                    <option value="failed">❌ Failed</option>
                    <option value="refunded">🔄 Refunded</option>
                    <option value="created">⏳ Pending (Created)</option>
                  </select>
                </div>
              </div>
              <div className="popup-footer">
                <button className="popup-cancel-btn" onClick={handleCloseOverride} disabled={submitting}>
                  Cancel
                </button>
                <button className="popup-save-btn" onClick={handleSaveOverride} disabled={submitting}>
                  {submitting ? "Saving..." : "Save Override"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
