import React, { useEffect, useState } from "react";
import { getAdminPayments, adminOverridePayment } from "../services/paymentService";
import { 
  RotateCw, 
  Search, 
  Eye, 
  Edit, 
  Copy, 
  Check, 
  IndianRupee, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  Trophy, 
  Users, 
  Award, 
  CreditCard, 
  User, 
  Sparkles,
  Shield,
  Calendar,
  DollarSign
} from "lucide-react";
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
  const [copiedId, setCopiedId] = useState(null);

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

  const getStatusBadgeClass = (status) => {
    const s = (status || "").toLowerCase();
    if (s === "paid" || s === "completed") return "status-paid";
    if (s === "failed" || s === "cancelled") return "status-failed";
    if (s === "refunded") return "status-refunded";
    if (s === "created" || s === "attempted" || s === "pending") return "status-pending";
    return "status-neutral";
  };

  const getRoleBadgeStyle = (role) => {
    const r = (role || "").toLowerCase();
    switch (r) {
      case "admin":
        return { backgroundColor: "rgba(168, 85, 247, 0.12)", color: "#a855f7", border: "1px solid rgba(168, 85, 247, 0.2)" };
      case "organizer":
        return { backgroundColor: "rgba(59, 130, 246, 0.12)", color: "#3b82f6", border: "1px solid rgba(59, 130, 246, 0.2)" };
      case "coach":
        return { backgroundColor: "rgba(34, 197, 94, 0.12)", color: "#22c55e", border: "1px solid rgba(34, 197, 94, 0.2)" };
      case "player":
        return { backgroundColor: "rgba(249, 115, 22, 0.12)", color: "#f97316", border: "1px solid rgba(249, 115, 22, 0.2)" };
      case "sponsor":
        return { backgroundColor: "rgba(234, 179, 8, 0.12)", color: "#eab308", border: "1px solid rgba(234, 179, 8, 0.2)" };
      default:
        return { backgroundColor: "rgba(107, 114, 128, 0.12)", color: "#6b7280", border: "1px solid rgba(107, 114, 128, 0.2)" };
    }
  };

  const getInitials = (name) => {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const getAvatarGradient = (name) => {
    if (!name) return "linear-gradient(135deg, #64748b, #475569)";
    const colors = [
      ["#3b82f6", "#1d4ed8"],
      ["#10b981", "#047857"],
      ["#f59e0b", "#b45309"],
      ["#8b5cf6", "#6d28d9"],
      ["#ec4899", "#be185d"],
      ["#f43f5e", "#be123c"],
      ["#06b6d4", "#0891b2"],
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return `linear-gradient(135deg, ${colors[index][0]}, ${colors[index][1]})`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return { date: "N/A", time: "" };
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return { date: "N/A", time: "" };

    const day = d.getDate();
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    const dateText = `${day} ${month} ${year}`;

    const timeOptions = { hour: "numeric", minute: "2-digit", hour12: true };
    const timeText = d.toLocaleTimeString("en-US", timeOptions);
    return { date: dateText, time: timeText };
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    }).catch((err) => {
      console.error("Could not copy text: ", err);
    });
  };

  const renderPaymentTypeChip = (type) => {
    switch (type) {
      case "tournament_creation":
        return (
          <span className="type-chip type-tournament">
            <Trophy size={13} />
            Tournament Creation
          </span>
        );
      case "team_registration":
        return (
          <span className="type-chip type-team-reg">
            <Users size={13} />
            Team Registration
          </span>
        );
      case "player_joining":
        return (
          <span className="type-chip type-player-join">
            <User size={13} />
            Player Joining
          </span>
        );
      case "sponsorship":
        return (
          <span className="type-chip type-sponsor">
            <Award size={13} />
            Sponsorship
          </span>
        );
      default:
        return (
          <span className="type-chip type-default">
            <CreditCard size={13} />
            {type || "N/A"}
          </span>
        );
    }
  };

  // Safe search and filters (Strictly kept identical)
  const filteredPayments = payments.filter((p) => {
    if (!p) return false;

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

    let matchesStatus = true;
    if (statusFilter !== "all") {
      if (statusFilter === "pending") {
        matchesStatus = p.status === "created" || p.status === "attempted";
      } else {
        matchesStatus = p.status === statusFilter;
      }
    }

    let matchesType = true;
    if (typeFilter !== "all") {
      matchesType = p.paymentType === typeFilter;
    }

    return matchesSearch && matchesStatus && matchesType;
  });

  // Calculate dynamic analytics statistics
  const totalTransactions = payments.length;
  const successfulPayments = payments.filter((p) => p.status === "paid").length;
  const pendingPayments = payments.filter((p) => p.status === "created" || p.status === "attempted").length;
  const failedPayments = payments.filter((p) => p.status === "failed").length;
  const totalRevenue = payments.reduce((acc, p) => p.status === "paid" ? acc + (p.amount || 0) : acc, 0);

  return (
    <div className="admin-payments-page">
      <main className="content">
        
        {/* HEADER SECTION */}
        <div className="admin-header-row">
          <div>
            <h1>💳 Payments Management</h1>
            <p className="admin-subtitle">Monitor, search and manage all payment transactions.</p>
          </div>
          <button 
            onClick={loadPayments} 
            className="refresh-btn-premium light-sweep-wrapper"
            aria-label="Refresh Payments Data"
            disabled={loading}
          >
            <RotateCw size={16} className={loading ? "spin-animation" : ""} />
            <span>Refresh Payments</span>
          </button>
        </div>

        {/* ANALYTICS CARDS */}
        <div className="analytics-grid">
          {loading ? (
            // Skeleton Analytics Cards
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="analytics-card skeleton-pulse">
                <div className="card-skeleton-header">
                  <div className="skeleton-icon-circle"></div>
                  <div className="skeleton-line short"></div>
                </div>
                <div className="skeleton-line medium"></div>
                <div className="skeleton-line long"></div>
              </div>
            ))
          ) : (
            <>
              {/* Card 1: Total Transactions */}
              <div className="analytics-card">
                <div className="card-header-icon-row">
                  <span className="card-label">Total Transactions</span>
                  <div className="card-icon-container blue-theme">
                    <CreditCard size={18} />
                  </div>
                </div>
                <div className="card-value-display">
                  <span className="card-large-number">{totalTransactions}</span>
                </div>
                <div className="card-footer-metric">
                  <span className="footer-trend-neutral">Total volume tracked</span>
                </div>
              </div>

              {/* Card 2: Successful Payments */}
              <div className="analytics-card">
                <div className="card-header-icon-row">
                  <span className="card-label">Successful Payments</span>
                  <div className="card-icon-container green-theme">
                    <CheckCircle2 size={18} />
                  </div>
                </div>
                <div className="card-value-display">
                  <span className="card-large-number text-success-bold">{successfulPayments}</span>
                </div>
                <div className="card-footer-metric">
                  <span className="footer-trend-success">
                    {totalTransactions ? ((successfulPayments / totalTransactions) * 100).toFixed(1) : 0}% success rate
                  </span>
                </div>
              </div>

              {/* Card 3: Pending Payments */}
              <div className="analytics-card">
                <div className="card-header-icon-row">
                  <span className="card-label">Pending Payments</span>
                  <div className="card-icon-container orange-theme">
                    <Clock size={18} />
                  </div>
                </div>
                <div className="card-value-display">
                  <span className="card-large-number text-pending-bold">{pendingPayments}</span>
                </div>
                <div className="card-footer-metric">
                  <span className="footer-trend-neutral">Awaiting confirmation</span>
                </div>
              </div>

              {/* Card 4: Failed Payments */}
              <div className="analytics-card">
                <div className="card-header-icon-row">
                  <span className="card-label">Failed Payments</span>
                  <div className="card-icon-container red-theme">
                    <AlertCircle size={18} />
                  </div>
                </div>
                <div className="card-value-display">
                  <span className="card-large-number text-danger-bold">{failedPayments}</span>
                </div>
                <div className="card-footer-metric">
                  <span className={failedPayments > 0 ? "footer-trend-danger" : "footer-trend-neutral"}>
                    {totalTransactions ? ((failedPayments / totalTransactions) * 100).toFixed(1) : 0}% failure rate
                  </span>
                </div>
              </div>

              {/* Card 5: Total Revenue */}
              <div className="analytics-card">
                <div className="card-header-icon-row">
                  <span className="card-label">Total Revenue</span>
                  <div className="card-icon-container gold-theme">
                    <IndianRupee size={18} />
                  </div>
                </div>
                <div className="card-value-display">
                  <span className="card-large-number text-success-bold">
                    ₹{totalRevenue.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="card-footer-metric">
                  <span className="footer-trend-success">From settled payments</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* SEARCH & FILTERS SECTION */}
        <div className="filters-card-wrapper">
          <div className="filters-container-premium">
            <div className="filter-item-premium search-field-premium">
              <label htmlFor="search-input">Search Transactions</label>
              <div className="search-input-wrapper">
                <Search size={18} className="search-icon" />
                <input
                  id="search-input"
                  type="text"
                  placeholder="Search by User name, email, Order ID, Payment ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="filter-item-premium">
              <label htmlFor="status-filter">Status</label>
              <select 
                id="status-filter" 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>

            <div className="filter-item-premium">
              <label htmlFor="type-filter">Payment Type</label>
              <select 
                id="type-filter" 
                value={typeFilter} 
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="tournament_creation">Tournament Creation</option>
                <option value="team_registration">Team Registration</option>
                <option value="player_joining">Player Joining</option>
                <option value="sponsorship">Sponsorship</option>
              </select>
            </div>
          </div>
        </div>

        {/* TRANSACTIONS TABLE */}
        <div className="table-card-premium">
          <div className="table-container-fixed-premium">
            <table className="payments-table-premium">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Payment Type</th>
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
                  // Skeleton Table Rows
                  Array.from({ length: 6 }).map((_, idx) => (
                    <tr key={idx} className="skeleton-row-premium">
                      <td>
                        <div className="skeleton-avatar-row">
                          <div className="skeleton-circle-avatar"></div>
                          <div className="skeleton-avatar-text">
                            <div className="skeleton-line-tiny"></div>
                            <div className="skeleton-line-tiny short"></div>
                          </div>
                        </div>
                      </td>
                      <td><div className="skeleton-line-pill"></div></td>
                      <td>
                        <div className="skeleton-stack">
                          <div className="skeleton-line-tiny"></div>
                          <div className="skeleton-line-tiny short"></div>
                        </div>
                      </td>
                      <td><div className="skeleton-line-tiny bold"></div></td>
                      <td>
                        <div className="skeleton-stack">
                          <div className="skeleton-line-code"></div>
                          <div className="skeleton-line-code"></div>
                        </div>
                      </td>
                      <td>
                        <div className="skeleton-stack">
                          <div className="skeleton-line-tiny"></div>
                          <div className="skeleton-line-tiny short"></div>
                        </div>
                      </td>
                      <td><div className="skeleton-line-pill"></div></td>
                      <td>
                        <div className="skeleton-actions-row">
                          <div className="skeleton-square-btn"></div>
                          <div className="skeleton-square-btn"></div>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : filteredPayments.length > 0 ? (
                  filteredPayments.map((p) => {
                    const formattedDateObj = formatDate(p.createdAt);
                    return (
                      <tr key={p._id || Math.random()} className="table-body-row-premium">
                        <td>
                          <div className="user-profile-cell">
                            <div 
                              className="avatar-initials-wrapper" 
                              style={{ background: getAvatarGradient(p.userId?.name) }}
                            >
                              {getInitials(p.userId?.name)}
                            </div>
                            <div className="user-text-info">
                              <span className="user-display-name">{p.userId?.name || "N/A"}</span>
                              <span className="user-display-email">{p.userId?.email || "N/A"}</span>
                              <span className="user-badge" style={getRoleBadgeStyle(p.userId?.role)}>
                                {p.userId?.role || "N/A"}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td>
                          {renderPaymentTypeChip(p.paymentType)}
                        </td>
                        <td>
                          <div className="entity-details-premium">
                            {p.paymentType === "tournament_creation" && (
                              <div className="entity-cell">
                                <span className="entity-meta-label">Tournament:</span>
                                <strong className="entity-meta-value">{p.tempData?.eventName || "N/A"}</strong>
                              </div>
                            )}
                            {p.paymentType === "team_registration" && (
                              <div className="entity-cell-stack">
                                <div className="entity-cell">
                                  <span className="entity-meta-label">Tournament:</span>{" "}
                                  <strong className="entity-meta-value">{p.tournamentId?.eventName || "N/A"}</strong>
                                </div>
                                <div className="entity-cell">
                                  <span className="entity-meta-label">Team:</span>{" "}
                                  <strong className="entity-meta-value">{p.teamId?.teamName || "N/A"}</strong>
                                </div>
                              </div>
                            )}
                            {p.paymentType === "player_joining" && (
                              <div className="entity-cell">
                                <span className="entity-meta-label">Team:</span>{" "}
                                <strong className="entity-meta-value">{p.teamId?.teamName || "N/A"}</strong>
                              </div>
                            )}
                            {p.paymentType === "sponsorship" && (
                              <div className="entity-cell">
                                <span className="entity-meta-tag-gold">Sponsor Flow</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="amount-wrapper-premium">
                            <span className={`amount-bold-val ${p.status === "refunded" ? "amount-refunded" : "amount-paid"}`}>
                              ₹{(p.amount || 0).toLocaleString("en-IN")}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="ids-cell-premium">
                            <div className="code-badge-premium">
                              <span className="badge-type-lbl">ORDER</span>
                              <span className="badge-value-txt">{p.razorpayOrderId || "N/A"}</span>
                              {p.razorpayOrderId && (
                                <button
                                  type="button"
                                  className="copy-badge-btn"
                                  onClick={() => handleCopy(p.razorpayOrderId, p._id + "-order")}
                                  title="Copy Order ID"
                                >
                                  {copiedId === p._id + "-order" ? (
                                    <Check size={12} className="text-success-copied" />
                                  ) : (
                                    <Copy size={12} />
                                  )}
                                  {copiedId === p._id + "-order" && (
                                    <span className="tooltip-badge">Copied!</span>
                                  )}
                                </button>
                              )}
                            </div>
                            <div className="code-badge-premium">
                              <span className="badge-type-lbl">PAY</span>
                              <span className="badge-value-txt">{p.razorpayPaymentId || "N/A"}</span>
                              {p.razorpayPaymentId && (
                                <button
                                  type="button"
                                  className="copy-badge-btn"
                                  onClick={() => handleCopy(p.razorpayPaymentId, p._id + "-pay")}
                                  title="Copy Payment ID"
                                >
                                  {copiedId === p._id + "-pay" ? (
                                    <Check size={12} className="text-success-copied" />
                                  ) : (
                                    <Copy size={12} />
                                  )}
                                  {copiedId === p._id + "-pay" && (
                                    <span className="tooltip-badge">Copied!</span>
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="date-time-wrapper">
                            <span className="formatted-date">{formattedDateObj.date}</span>
                            <span className="formatted-time">{formattedDateObj.time}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`status-pill-premium ${getStatusBadgeClass(p.status)}`}>
                            <span className="status-indicator-dot"></span>
                            <span>{p.status === "created" || p.status === "attempted" ? "Pending" : p.status}</span>
                          </span>
                        </td>
                        <td>
                          <div className="actions-flex-premium">
                            <button
                              type="button"
                              className="icon-action-btn view-btn-premium"
                              onClick={() => setSelectedPayment(p)}
                              title="View Details"
                              aria-label="View Details"
                            >
                              <Eye size={18} />
                              <span className="action-hover-tooltip">View Details</span>
                            </button>
                            <button
                              type="button"
                              className="icon-action-btn override-btn-premium"
                              onClick={() => handleOpenOverride(p)}
                              title="Override Status"
                              aria-label="Override Status"
                            >
                              <Edit size={18} />
                              <span className="action-hover-tooltip">Override Status</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  // Empty State inside Table Body
                  <tr>
                    <td colSpan="8">
                      <div className="empty-state-card">
                        <div className="empty-state-illustration">
                          <Search size={40} className="empty-search-icon" />
                        </div>
                        <h3>No Transactions Found</h3>
                        <p>No payments matched your search query or filters. Check your spelling or try resetting the filter options.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* VIEW DETAILS MODAL */}
        {selectedPayment && (
          <div className="modal-overlay-premium" onClick={() => setSelectedPayment(null)}>
            <div className="modal-container-premium" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header-premium">
                <div className="modal-title-wrapper">
                  <Sparkles className="sparkles-decor" size={18} />
                  <h3>Payment Transaction Details</h3>
                </div>
                <button className="close-btn-x" onClick={() => setSelectedPayment(null)} aria-label="Close modal">
                  ×
                </button>
              </div>

              <div className="modal-body-premium">
                <div className="modal-grid-layout">
                  {/* Status Bar */}
                  <div className="modal-full-width-status">
                    <span className="status-label">Current Payment Status</span>
                    <span className={`status-pill-premium ${getStatusBadgeClass(selectedPayment.status)}`}>
                      <span className="status-indicator-dot"></span>
                      <span>{selectedPayment.status === "created" || selectedPayment.status === "attempted" ? "Pending" : selectedPayment.status}</span>
                    </span>
                  </div>

                  {/* Block 1: Payment Details */}
                  <div className="modal-info-card">
                    <div className="info-card-header">
                      <CreditCard size={15} />
                      <h4>Payment Information</h4>
                    </div>
                    <div className="info-card-body">
                      <div className="info-row">
                        <span className="row-lbl">Payment Type</span>
                        <span className="row-val">{formatPaymentType(selectedPayment.paymentType)}</span>
                      </div>
                      <div className="info-row">
                        <span className="row-lbl">Amount Charged</span>
                        <span className="row-val amount-highlight-val">
                          ₹{(selectedPayment.amount || 0).toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Block 2: Customer Information */}
                  <div className="modal-info-card">
                    <div className="info-card-header">
                      <User size={15} />
                      <h4>Customer Information</h4>
                    </div>
                    <div className="info-card-body">
                      <div className="user-avatar-row-modal">
                        <div 
                          className="modal-avatar-initials" 
                          style={{ background: getAvatarGradient(selectedPayment.userId?.name) }}
                        >
                          {getInitials(selectedPayment.userId?.name)}
                        </div>
                        <div className="modal-user-meta">
                          <strong className="modal-user-name">{selectedPayment.userId?.name || "N/A"}</strong>
                          <span className="modal-user-email">{selectedPayment.userId?.email || "N/A"}</span>
                        </div>
                      </div>
                      <div className="info-row" style={{ marginTop: "12px" }}>
                        <span className="row-lbl">Account Role</span>
                        <span className="user-badge" style={getRoleBadgeStyle(selectedPayment.userId?.role)}>
                          {selectedPayment.userId?.role || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Block 3: Target Entities */}
                  <div className="modal-info-card modal-full-width">
                    <div className="info-card-header">
                      <Shield size={15} />
                      <h4>Target Entities / Registry</h4>
                    </div>
                    <div className="info-card-body">
                      {selectedPayment.paymentType === "tournament_creation" && (
                        <div className="info-row">
                          <span className="row-lbl">Pending Tournament</span>
                          <span className="row-val-bold">{selectedPayment.tempData?.eventName || "N/A"}</span>
                        </div>
                      )}
                      {selectedPayment.paymentType === "team_registration" && (
                        <>
                          <div className="info-row">
                            <span className="row-lbl">Tournament Event</span>
                            <span className="row-val-bold">{selectedPayment.tournamentId?.eventName || "N/A"}</span>
                          </div>
                          <div className="info-row">
                            <span className="row-lbl">Registered Team</span>
                            <span className="row-val-bold">{selectedPayment.teamId?.teamName || "N/A"}</span>
                          </div>
                        </>
                      )}
                      {selectedPayment.paymentType === "player_joining" && (
                        <div className="info-row">
                          <span className="row-lbl">Joined Team</span>
                          <span className="row-val-bold">{selectedPayment.teamId?.teamName || "N/A"}</span>
                        </div>
                      )}
                      {selectedPayment.paymentType === "sponsorship" && (
                        <div className="info-row">
                          <span className="row-lbl">Sponsor Flow</span>
                          <span className="row-val-bold text-gold">Corporate Sponsorship Partnership</span>
                        </div>
                      )}
                      {!selectedPayment.tournamentId && !selectedPayment.teamId && !selectedPayment.tempData && (
                        <div className="info-row">
                          <span className="row-lbl">Details</span>
                          <span className="row-val-muted">No associated tournament or team records found.</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Block 4: Transaction IDs */}
                  <div className="modal-info-card modal-full-width">
                    <div className="info-card-header">
                      <Shield size={15} />
                      <h4>Transaction Identifiers</h4>
                    </div>
                    <div className="info-card-body ids-layout-modal">
                      <div className="id-modal-box">
                        <span className="modal-id-lbl">RAZORPAY ORDER ID</span>
                        <div className="modal-id-flex">
                          <code className="modal-code-text">{selectedPayment.razorpayOrderId || "N/A"}</code>
                          {selectedPayment.razorpayOrderId && (
                            <button
                              type="button"
                              className="modal-copy-btn"
                              onClick={() => handleCopy(selectedPayment.razorpayOrderId, "modal-order")}
                              title="Copy Order ID"
                            >
                              {copiedId === "modal-order" ? <Check size={13} className="text-success-copied" /> : <Copy size={13} />}
                              {copiedId === "modal-order" && <span className="tooltip-modal">Copied!</span>}
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="id-modal-box">
                        <span className="modal-id-lbl">RAZORPAY PAYMENT ID</span>
                        <div className="modal-id-flex">
                          <code className="modal-code-text">{selectedPayment.razorpayPaymentId || "N/A"}</code>
                          {selectedPayment.razorpayPaymentId && (
                            <button
                              type="button"
                              className="modal-copy-btn"
                              onClick={() => handleCopy(selectedPayment.razorpayPaymentId, "modal-pay")}
                              title="Copy Payment ID"
                            >
                              {copiedId === "modal-pay" ? <Check size={13} className="text-success-copied" /> : <Copy size={13} />}
                              {copiedId === "modal-pay" && <span className="tooltip-modal">Copied!</span>}
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="id-modal-box modal-full-width">
                        <span className="modal-id-lbl">PAYMENT SIGNATURE</span>
                        <div className="modal-id-flex">
                          <code className="modal-code-text signature-wrap">{selectedPayment.razorpaySignature || "N/A"}</code>
                          {selectedPayment.razorpaySignature && (
                            <button
                              type="button"
                              className="modal-copy-btn"
                              onClick={() => handleCopy(selectedPayment.razorpaySignature, "modal-sig")}
                              title="Copy Signature"
                            >
                              {copiedId === "modal-sig" ? <Check size={13} className="text-success-copied" /> : <Copy size={13} />}
                              {copiedId === "modal-sig" && <span className="tooltip-modal">Copied!</span>}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Block 5: Timeline */}
                  <div className="modal-info-card modal-full-width">
                    <div className="info-card-header">
                      <Calendar size={15} />
                      <h4>Transaction Timeline</h4>
                    </div>
                    <div className="info-card-body timeline-layout">
                      <div className="timeline-node">
                        <div className="timeline-dot"></div>
                        <div className="timeline-content">
                          <span className="timeline-label">Created At</span>
                          <span className="timeline-time">
                            {selectedPayment.createdAt ? new Date(selectedPayment.createdAt).toLocaleString() : "N/A"}
                          </span>
                        </div>
                      </div>
                      <div className="timeline-node">
                        <div className="timeline-dot"></div>
                        <div className="timeline-content">
                          <span className="timeline-label">Last Updated</span>
                          <span className="timeline-time">
                            {selectedPayment.updatedAt ? new Date(selectedPayment.updatedAt).toLocaleString() : "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Temporary Event Data (JSON) */}
                  {selectedPayment.paymentType === "tournament_creation" && selectedPayment.tempData && (
                    <div className="modal-info-card modal-full-width">
                      <div className="info-card-header">
                        <Info size={15} />
                        <h4>Raw Temporary Event Data</h4>
                      </div>
                      <div className="info-card-body">
                        <pre className="raw-json-premium">
                          {JSON.stringify(selectedPayment.tempData, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer-premium">
                <button type="button" className="close-modal-btn-premium" onClick={() => setSelectedPayment(null)}>
                  Close Detail Overview
                </button>
              </div>
            </div>
          </div>
        )}

        {/* OVERRIDE STATUS POPUP */}
        {overridePayment && (
          <div className="popup-overlay-premium" onClick={handleCloseOverride}>
            <div className="popup-container-premium" onClick={(e) => e.stopPropagation()}>
              <div className="popup-header-premium">
                <h2>Override Payment Status</h2>
                <button type="button" className="popup-close-x" onClick={handleCloseOverride}>×</button>
              </div>
              
              <div className="popup-body-premium">
                <div className="override-warning-box-premium">
                  <div className="warning-icon-wrapper">
                    <AlertCircle size={20} />
                  </div>
                  <div className="warning-text-content">
                    <strong>Administrative Status Override Notice:</strong>
                    <p>Manually overriding the state modifies backend registrations directly. Changing to "Paid" constructs relevant target records; changing to "Failed"/"Refunded" leaves items intact but halts workflow validation.</p>
                  </div>
                </div>

                <div className="popup-field-premium">
                  <label htmlFor="override-txn-id">Transaction System ID</label>
                  <input 
                    id="override-txn-id"
                    type="text" 
                    value={overridePayment._id} 
                    disabled 
                    className="disabled-input-premium" 
                  />
                </div>

                <div className="popup-field-premium">
                  <label>Current Status</label>
                  <div style={{ marginTop: "6px" }}>
                    <span className={`status-pill-premium ${getStatusBadgeClass(overridePayment.status)}`}>
                      <span className="status-indicator-dot"></span>
                      <span>{overridePayment.status}</span>
                    </span>
                  </div>
                </div>

                <div className="popup-field-premium">
                  <label htmlFor="new-override-status">New Override Status</label>
                  <select 
                    id="new-override-status"
                    value={newStatus} 
                    onChange={(e) => setNewStatus(e.target.value)}
                  >
                    <option value="paid">✅ Paid (Completes action / creates entity)</option>
                    <option value="failed">❌ Failed</option>
                    <option value="refunded">🔄 Refunded</option>
                    <option value="created">⏳ Pending (Created)</option>
                  </select>
                </div>
              </div>

              <div className="popup-footer-premium">
                <button 
                  type="button" 
                  className="popup-cancel-btn-premium" 
                  onClick={handleCloseOverride} 
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="popup-save-btn-premium" 
                  onClick={handleSaveOverride} 
                  disabled={submitting}
                >
                  {submitting ? "Saving changes..." : "Save Override State"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
