import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../utils/axiosConfig";
import { useAuth } from "../context/AuthContext";
import { loadRazorpayScript, initiateRegistrationPayment, verifyRegistrationPayment, getRazorpayKey, initiateJoinPayment, verifyJoinPayment } from "../services/paymentService";
import "../static/MyRegistrations.css";
import SkeletonTable from "../components/loading/SkeletonTable";

export default function MyRegistrations() {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchRegistrations();
  }, [user]);

  const fetchRegistrations = async () => {
    try {
      const res = await api.get("/registrations/my-registrations");
      setRegistrations(res.data);
    } catch (err) {
      console.error("Failed to fetch registrations", err);
    } finally {
      setLoading(false);
    }
  };

  const cancelRegistration = async (id, tournamentName, teamName) => {
    if (!window.confirm(`❌ Cancel registration for "${tournamentName}"?\n\nTeam: ${teamName}\n\nThis action cannot be undone.`)) return;
    
    setActionLoading(id);
    try {
      await api.delete(`/registrations/${id}/cancel`);
      alert("✅ Registration cancelled successfully");
      fetchRegistrations();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to cancel registration");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePayment = async (reg) => {
    setActionLoading(reg._id);
    const isCaptain = reg.teamId?.captainId === user?._id || reg.teamId?.captainId === user?.id || reg.userId === user?._id || reg.userId === user?.id;
    try {
      if (!isCaptain) {
        // Player pays joining fee
        const payRes = await initiateJoinPayment(reg.teamId?._id);
        if (payRes && payRes.requiresPayment) {
          const scriptLoaded = await loadRazorpayScript();
          if (!scriptLoaded) {
            alert("Razorpay SDK failed to load. Are you online?");
            return;
          }
          const keyRes = await getRazorpayKey();
          const options = {
            key: keyRes.key,
            amount: payRes.order.amount,
            currency: payRes.order.currency || "INR",
            name: "Player Joining Fee",
            description: `Joining fee for ${reg.teamId?.teamName}`,
            order_id: payRes.order.id,
            handler: async (paymentRes) => {
              setActionLoading(reg._id);
              try {
                const verifyRes = await verifyJoinPayment({
                  razorpay_order_id: paymentRes.razorpay_order_id,
                  razorpay_payment_id: paymentRes.razorpay_payment_id,
                  razorpay_signature: paymentRes.razorpay_signature,
                  transactionId: payRes.transactionId,
                });
                if (verifyRes.success) {
                  alert("✅ Payment verified! You are now a fully approved member of the team.");
                  fetchRegistrations();
                } else {
                  alert("❌ Payment verification failed.");
                }
              } catch (err) {
                console.error(err);
                alert(err.response?.data?.message || "Payment verification failed");
              } finally {
                setActionLoading(false);
              }
            },
            prefill: {
              name: user?.name || "",
              email: user?.email || "",
            },
            theme: {
              color: "#3b82f6",
            },
            modal: {
              ondismiss: () => {
                alert("Payment cancelled.");
              }
            }
          };
          const rzp = new window.Razorpay(options);
          rzp.open();
        } else {
          alert("✅ Membership activated successfully!");
          fetchRegistrations();
        }
      } else {
        // Coach pays team registration fee
        const payRes = await initiateRegistrationPayment(reg.tournamentId?._id, reg.teamId?._id);
        if (payRes && payRes.requiresPayment) {
          const scriptLoaded = await loadRazorpayScript();
          if (!scriptLoaded) {
            alert("Razorpay SDK failed to load. Are you online?");
            return;
          }
          const keyRes = await getRazorpayKey();
          const options = {
            key: keyRes.key,
            amount: payRes.order.amount,
            currency: payRes.order.currency || "INR",
            name: "Team Registration Fee",
            description: `Registration fee for ${reg.tournamentId?.eventName}`,
            order_id: payRes.order.id,
            handler: async (paymentRes) => {
              setActionLoading(reg._id);
              try {
                const verifyRes = await verifyRegistrationPayment({
                  razorpay_order_id: paymentRes.razorpay_order_id,
                  razorpay_payment_id: paymentRes.razorpay_payment_id,
                  razorpay_signature: paymentRes.razorpay_signature,
                  transactionId: payRes.transactionId,
                });
                if (verifyRes.success) {
                  alert("✅ Payment completed and team registered successfully!");
                  fetchRegistrations();
                } else {
                  alert("❌ Payment verification failed.");
                }
              } catch (err) {
                console.error(err);
                alert(err.response?.data?.message || "Payment verification failed");
              } finally {
                setActionLoading(false);
              }
            },
            prefill: {
              name: user?.name || "",
              email: user?.email || "",
            },
            theme: {
              color: "#3b82f6",
            },
            modal: {
              ondismiss: () => {
                alert("Payment cancelled. Registration is not complete.");
              }
            }
          };
          const rzp = new window.Razorpay(options);
          rzp.open();
        } else {
          alert("✅ Payment completed and team registered successfully!");
          fetchRegistrations();
        }
      }
    } catch (err) {
      console.error("Payment initiation error:", err);
      alert(err.response?.data?.message || "Failed to initiate payment");
    } finally {
      setActionLoading(false);
    }
  };

  const getRegStatus = (reg) => {
    const isCaptain = reg.teamId?.captainId === user?._id || reg.teamId?.captainId === user?.id || reg.userId === user?._id || reg.userId === user?.id;
    if (isCaptain) {
      return reg.approvalStatus;
    }
    const playerInfo = reg.teamId?.players?.find(p => String(p.userId?._id || p.userId) === String(user?._id || user?.id));
    return playerInfo ? playerInfo.status : reg.approvalStatus;
  };

  const getStatusColor = (status) => {
    switch(status) {
      case "approved": return "#10b981";
      case "approved_pending_payment": return "#3b82f6";
      case "pending": return "#f59e0b";
      case "rejected": return "#ef4444";
      default: return "#6b7280";
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case "approved": return "✅";
      case "approved_pending_payment": return "💳";
      case "pending": return "⏳";
      case "rejected": return "❌";
      default: return "❓";
    }
  };

  const pendingRegs = registrations.filter(r => getRegStatus(r) === "pending");
  const pendingPaymentRegs = registrations.filter(r => getRegStatus(r) === "approved_pending_payment");
  const approvedRegs = registrations.filter(r => getRegStatus(r) === "approved");
  const rejectedRegs = registrations.filter(r => getRegStatus(r) === "rejected");

  const renderRegistrationCard = (reg) => {
    const isCaptain = reg.teamId?.captainId === user?._id || reg.teamId?.captainId === user?.id || reg.userId === user?._id || reg.userId === user?.id;
    const playerInfo = !isCaptain ? reg.teamId?.players?.find(p => String(p.userId?._id || p.userId) === String(user?._id || user?.id)) : null;
    const regStatus = isCaptain ? reg.approvalStatus : (playerInfo ? playerInfo.status : reg.approvalStatus);
    const paymentStatus = isCaptain ? reg.paymentStatus : (playerInfo ? playerInfo.paymentStatus : reg.paymentStatus);

    return (
      <div key={reg._id} className="registration-card">
        <div className="reg-header">
          <div className="reg-title">
            <h3>{reg.tournamentId?.eventName}</h3>
            <span 
              className="status-badge"
              style={{ backgroundColor: getStatusColor(regStatus) }}
            >
              {getStatusIcon(regStatus)} {regStatus === "approved_pending_payment" ? "Approved (Pending Payment)" : regStatus === "approved" ? "Registration Completed" : regStatus}
            </span>
          </div>
        </div>

        {regStatus === "approved_pending_payment" && (
          <div className="payment-alert-box" style={{
            backgroundColor: "#eff6ff",
            border: "1px solid #bfdbfe",
            borderRadius: "8px",
            padding: "12px 16px",
            marginBottom: "16px",
            color: "#1e40af",
            fontSize: "0.95rem"
          }}>
            <p style={{ margin: 0, fontWeight: "500" }}>
              Your registration has been approved. Complete payment to confirm participation.
            </p>
            {reg.paymentDeadline && (
              <p style={{ margin: "4px 0 0 0", fontSize: "0.85rem", color: "#2563eb" }}>
                ⏰ Payment deadline: {new Date(reg.paymentDeadline).toLocaleString()}
              </p>
            )}
          </div>
        )}

        <div className="reg-details">
          <div className="detail-item">
            <span className="detail-label">🏷️ Team:</span>
            <span className="detail-value">{reg.teamId?.teamName}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">📅 Registered on:</span>
            <span className="detail-value">{new Date(reg.registrationDate).toLocaleDateString()}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">💰 Fee:</span>
            <span className="detail-value">
              {isCaptain 
                ? (reg.tournamentId?.teamRegistrationFee !== undefined ? `₹${reg.tournamentId.teamRegistrationFee}` : "Free")
                : (reg.teamId?.playerJoiningFee !== undefined ? `₹${reg.teamId.playerJoiningFee}` : "Free")
              }
            </span>
          </div>
          <div className="detail-item">
            <span className="detail-label">💳 Payment:</span>
            <span className={`payment-status ${paymentStatus}`}>
              {paymentStatus === "Paid" || paymentStatus === "paid" ? "✅ Paid" : "⏳ Pending"}
            </span>
          </div>
        </div>

        <div className="reg-footer">
          <Link to={`/tournament/${reg.tournamentId?._id}`} className="view-tournament">
            View Tournament →
          </Link>
          <Link to={`/team/${reg.teamId?._id}`} className="view-team">
            View Team →
          </Link>
          {regStatus === "approved_pending_payment" && (
            <button 
              onClick={() => handlePayment(reg)}
              className="complete-payment-btn"
              style={{
                backgroundColor: "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "6px",
                padding: "8px 16px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
              disabled={actionLoading === reg._id}
            >
              💳 Complete Payment
            </button>
          )}
          {/* Cancel Registration Button */}
          <button 
            onClick={() => cancelRegistration(reg._id, reg.tournamentId?.eventName, reg.teamId?.teamName)}
            className="cancel-reg-btn"
            disabled={actionLoading === reg._id}
          >
            {actionLoading === reg._id ? "Cancelling..." : "❌ Cancel Registration"}
          </button>
        </div>
      </div>
    );
  };

  const renderSection = (title, regs, emptyMessage, statusFilter) => {
    if (activeFilter !== "all" && activeFilter !== statusFilter) return null;
    return (
      <div className="reg-section" style={{ marginBottom: "40px" }} key={statusFilter}>
        <h2 style={{ fontSize: "1.4rem", color: "#1f2937", marginBottom: "15px", borderBottom: "2px solid #e5e7eb", paddingBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
          {statusFilter === "pending" && "⏳"}
          {statusFilter === "approved_pending_payment" && "💳"}
          {statusFilter === "approved" && "✅"}
          {statusFilter === "rejected" && "❌"}
          {title} ({regs.length})
        </h2>
        {regs.length > 0 ? (
          <div className="registrations-list">
            {regs.map(reg => renderRegistrationCard(reg))}
          </div>
        ) : (
          <div className="empty-section-message" style={{
            padding: "20px",
            background: "rgba(255, 255, 255, 0.4)",
            border: "1px dashed #cbd5e1",
            borderRadius: "8px",
            color: "#64748b",
            textAlign: "center",
            fontSize: "0.95rem"
          }}>
            {emptyMessage}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="my-registrations-page">
        <h1>📋 My Tournament Registrations</h1>
        <p className="subtitle">Track your team registration status</p>
        <SkeletonTable rows={8} cols={4} />
      </div>
    );
  }

  return (
    <div className="my-registrations-page">
      <h1>📋 My Tournament Registrations</h1>
      <p className="subtitle">Track your team registration status</p>

      {/* Filters */}
      <div className="reg-filters">
        <button onClick={() => setActiveFilter("all")} className={activeFilter === "all" ? "active" : ""}>All</button>
        <button onClick={() => setActiveFilter("pending")} className={activeFilter === "pending" ? "active" : ""}>Pending</button>
        <button onClick={() => setActiveFilter("approved_pending_payment")} className={activeFilter === "approved_pending_payment" ? "active" : ""}>Pending Payment</button>
        <button onClick={() => setActiveFilter("approved")} className={activeFilter === "approved" ? "active" : ""}>Approved</button>
        <button onClick={() => setActiveFilter("rejected")} className={activeFilter === "rejected" ? "active" : ""}>Rejected</button>
      </div>

      {registrations.length === 0 ? (
        <div className="empty-state">
          <p>📭 No registrations found</p>
          <Link to="/tournaments" className="browse-btn">Browse Tournaments</Link>
        </div>
      ) : (
        <div className="sections-container">
          {renderSection("Pending Registrations", pendingRegs, "No pending registrations found", "pending")}
          {renderSection("Pending Payment", pendingPaymentRegs, "No pending payment registrations found", "approved_pending_payment")}
          {renderSection("Approved Registrations", approvedRegs, "No approved registrations found", "approved")}
          {renderSection("Rejected Registrations", rejectedRegs, "No rejected registrations found", "rejected")}
        </div>
      )}
    </div>
  );
}