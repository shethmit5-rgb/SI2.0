import React, { useState, useEffect } from "react";
import api from "../utils/axiosConfig";
import { useAuth } from "../context/AuthContext";
import ProfileLayout from "../components/profile/ProfileLayout";
import ProfileHero from "../components/profile/ProfileHero";
import ProfileTabs from "../components/profile/ProfileTabs";
import ProfileInfoCard from "../components/profile/ProfileInfoCard";
import SkeletonProfile from "../components/loading/SkeletonProfile";
import "../static/Profile.css";

export default function AdminProfile() {
  const { user, login, logout } = useAuth();
  const token = localStorage.getItem("token");

  const [form, setForm] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    location: "",
    description: "",
    gender: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [profileLoading, setProfileLoading] = useState(true);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState(null);
  const [message, setMessage] = useState(null);

  // Fetch Profile & Statistics on Mount
  useEffect(() => {
    fetchProfile();
    fetchStats();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get("/profile/me");
      setForm({
        name: res.data.name || "",
        email: res.data.email || "",
        phoneNumber: res.data.phoneNumber || "",
        location: res.data.location || "",
        description: res.data.description || "",
        gender: res.data.gender || "",
      });
      setPreview(res.data.profileImage || "");
    } catch (err) {
      console.error("Failed to fetch profile:", err);
      setMessage({ type: "error", text: "Failed to load profile" });
    } finally {
      setProfileLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get("/analytics/stats");
      setStats(res.data.stats || null);
    } catch (err) {
      console.error("Failed to load statistics:", err);
    } finally {
      setDashboardLoading(false);
    }
  };

  // Form input changes
  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePasswordChange = (e) => {
    setPasswordForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Image Selection Handler
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("Image must be under 10MB");
      return;
    }

    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  // Save changes handler (Unified upload/profile update)
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const data = new FormData();
      Object.keys(form).forEach((key) => {
        if (form[key]) data.append(key, form[key]);
      });
      if (image) {
        data.append("profileImage", image);
      }

      const res = await api.put("/profile/update", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      login(res.data.user, token);
      setMessage({ type: "success", text: "Profile updated successfully! ✅" });
      setIsEditing(false);
      setImage(null);
      if (res.data.user.profileImage) {
        setPreview(res.data.user.profileImage);
      }
    } catch (error) {
      console.error(error);
      const errors = error.response?.data?.errors;
      const msg = error.response?.data?.message;
      if (Array.isArray(errors) && errors.length > 0) {
        const fieldErrors = errors.map(err => `• ${err.field}: ${err.message}`).join("\n");
        setMessage({ type: "error", text: `Validation failed:\n${fieldErrors}` });
      } else {
        setMessage({ type: "error", text: msg || "Profile update failed ❌" });
      }
    } finally {
      setSaving(false);
    }
  };

  // Change password handler
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match ❌" });
      setSaving(false);
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setMessage({ type: "error", text: "Password must be at least 6 characters ❌" });
      setSaving(false);
      return;
    }

    try {
      await api.put("/profile/change-password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setMessage({ type: "success", text: "Password changed successfully! ✅" });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      console.error("Password change failed:", err);
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to change password ❌" });
    } finally {
      setSaving(false);
    }
  };

  // Deactivate account handler (reusing delete endpoint)
  const handleDeactivate = async () => {
    if (!window.confirm("Are you sure you want to deactivate your account? This action cannot be undone.")) return;

    try {
      await api.delete("/profile/delete");
      logout();
      window.location.href = "/login";
    } catch (err) {
      console.error("Deactivation failed:", err);
      alert("Failed to deactivate account ❌");
    }
  };

  if (profileLoading || dashboardLoading) {
    return <SkeletonProfile />;
  }

  const tabsList = ["Overview", "Profile Details", "Security & Login", "System Activity", "Settings"];

  // Layout components
  const heroComponent = (
    <ProfileHero
      name={form.name || user?.name}
      role="admin"
      email={form.email || user?.email}
      createdAt={user?.createdAt}
      preview={preview}
      isEditing={isEditing}
      handleImageChange={handleImageChange}
      form={form}
    />
  );

  const tabsComponent = (
    <ProfileTabs
      tabs={tabsList}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    />
  );

  const sidebar3Col = {
    left: (
      <>
        {/* Quick Actions Card */}
        <div className="glass-panel" style={{ padding: "20px", marginBottom: "20px" }}>
          <h3>⚙️ Quick Actions</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "15px" }}>
            <a href="/admin" className="edit-profile-btn" style={{ textAlign: "center", textDecoration: "none" }}>📊 Admin Dashboard</a>
            <a href="/admin/users" className="edit-profile-btn" style={{ textAlign: "center", textDecoration: "none" }}>👥 Manage Users</a>
            <a href="/admin/venues" className="edit-profile-btn" style={{ textAlign: "center", textDecoration: "none" }}>🏆 Manage Venues</a>
          </div>
        </div>

        {/* Security Status Card */}
        <div className="glass-panel" style={{ padding: "20px", marginBottom: "20px" }}>
          <h3>🔒 Security Status</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "15px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-muted)" }}>Password:</span>
              <span style={{ color: "#10b981", fontWeight: "bold" }}>Configured ✓</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-muted)" }}>2FA Security:</span>
              <span style={{ color: "#ef4444", fontWeight: "bold" }}>Disabled ✗</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-muted)" }}>Access Level:</span>
              <span style={{ color: "#D4AF37", fontWeight: "bold" }}>Super Admin</span>
            </div>
          </div>
        </div>

        {/* Account Status Card */}
        <div className="glass-panel" style={{ padding: "20px" }}>
          <h3>🟢 Account Status</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "15px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-muted)" }}>Status:</span>
              <span style={{ color: "#10b981", fontWeight: "bold" }}>Active 🟢</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-muted)" }}>API Verification:</span>
              <span style={{ color: "#10b981", fontWeight: "bold" }}>Verified ✓</span>
            </div>
          </div>
        </div>
      </>
    ),
    right: (
      <>
        {/* Profile Summary Card */}
        <div className="glass-panel" style={{ padding: "20px", marginBottom: "20px" }}>
          <h3>ℹ️ Profile Summary</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "10px", lineHeight: "1.5" }}>
            {form.description || "No bio added yet. Click edit profile under the Profile Details tab to add one."}
          </p>
        </div>

        {/* System Information Card */}
        <div className="glass-panel" style={{ padding: "20px", marginBottom: "20px" }}>
          <h3>🖥️ System Information</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "15px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-muted)" }}>Environment:</span>
              <span>Production</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-muted)" }}>Database:</span>
              <span>MongoDB Atlas</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-muted)" }}>Asset Storage:</span>
              <span>Cloudinary ✅</span>
            </div>
          </div>
        </div>

        {/* Admin Permissions Card */}
        <div className="glass-panel" style={{ padding: "20px", marginBottom: "20px" }}>
          <h3>🛡️ Admin Permissions</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "15px" }}>
            <span className="status-pill active" style={{ fontSize: "0.75rem" }}>ALL_PRIVILEGES</span>
            <span className="status-pill active" style={{ fontSize: "0.75rem" }}>MANAGE_USERS</span>
            <span className="status-pill active" style={{ fontSize: "0.75rem" }}>MANAGE_SYSTEM</span>
            <span className="status-pill active" style={{ fontSize: "0.75rem" }}>AUDIT_LOGS</span>
          </div>
        </div>

        {/* Account Metadata Card */}
        <div className="glass-panel" style={{ padding: "20px" }}>
          <h3>📁 Account Metadata</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "15px", fontSize: "0.85rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <span style={{ color: "var(--text-muted)" }}>Database ID:</span>
              <span style={{ wordBreak: "break-all", fontFamily: "monospace", color: "var(--text)" }}>{user?.id || user?._id || "N/A"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
              <span style={{ color: "var(--text-muted)" }}>Email Verified:</span>
              <span style={{ color: user?.isEmailVerified ? "#10b981" : "#ef4444", fontWeight: "bold" }}>
                {user?.isEmailVerified ? "Yes ✓" : "No ✗"}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-muted)" }}>Phone Verified:</span>
              <span style={{ color: user?.isPhoneVerified ? "#10b981" : "#ef4444", fontWeight: "bold" }}>
                {user?.isPhoneVerified ? "Yes ✓" : "No ✗"}
              </span>
            </div>
          </div>
        </div>
      </>
    )
  };

  const getCenterContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <>
            {/* Status alerts */}
            {message && (
              <div className="glass-card" style={{
                padding: "12px 20px",
                borderRadius: "12px",
                marginBottom: "20px",
                background: message.type === "success" ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
                color: message.type === "success" ? "#10b981" : "#ef4444",
                border: `1px solid ${message.type === "success" ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
                fontWeight: "500",
                display: "flex",
                alignItems: "center",
                gap: "10px"
              }}>
                <span>{message.type === "success" ? "✅" : "❌"}</span>
                <span style={{ whiteSpace: "pre-line" }}>{message.text}</span>
              </div>
            )}

            {/* Statistics */}
            {stats ? (
              <div className="glass-panel" style={{ padding: "20px", marginBottom: "20px" }}>
                <h3>📊 Admin Statistics</h3>
                <div className="profile-stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "15px", marginTop: "15px" }}>
                  <div className="hero-stat-card glass-card" style={{ padding: "15px", textAlign: "center" }}>
                    <h4 style={{ fontSize: "1.8rem", margin: "0" }}>{stats.users || 0}</h4>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Total Users</span>
                  </div>
                  <div className="hero-stat-card glass-card" style={{ padding: "15px", textAlign: "center" }}>
                    <h4 style={{ fontSize: "1.8rem", margin: "0" }}>{stats.sponsors || 0}</h4>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Total Sponsors</span>
                  </div>
                  <div className="hero-stat-card glass-card" style={{ padding: "15px", textAlign: "center" }}>
                    <h4 style={{ fontSize: "1.8rem", margin: "0" }}>{stats.tournaments || 0}</h4>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Tournaments</span>
                  </div>
                  <div className="hero-stat-card glass-card" style={{ padding: "15px", textAlign: "center" }}>
                    <h4 style={{ fontSize: "1.8rem", margin: "0" }}>{stats.matches || 0}</h4>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Total Matches</span>
                  </div>
                  <div className="hero-stat-card glass-card" style={{ padding: "15px", textAlign: "center" }}>
                    <h4 style={{ fontSize: "1.8rem", margin: "0" }}>{stats.teams || 0}</h4>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Total Teams</span>
                  </div>
                  <div className="hero-stat-card glass-card" style={{ padding: "15px", textAlign: "center" }}>
                    <h4 style={{ fontSize: "1.8rem", margin: "0" }}>₹{stats.totalPrizePool || 0}</h4>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Prize Pool</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="timeline-empty-state glass-card" style={{ padding: "30px", marginBottom: "20px" }}>
                <span className="empty-state-icon">📊</span>
                <p>No statistics available at the moment.</p>
              </div>
            )}

            {/* Recent Activity */}
            <div className="glass-panel" style={{ padding: "20px" }}>
              <h3>⚡ Recent Activity</h3>
              <div className="timeline-empty-state glass-card" style={{ marginTop: "15px", padding: "30px" }}>
                <span className="empty-state-icon">📋</span>
                <p>No recent activity logs recorded in this session.</p>
              </div>
            </div>
          </>
        );

      case "profile-details":
        return (
          <>
            {message && (
              <div className="glass-card" style={{
                padding: "12px 20px",
                borderRadius: "12px",
                marginBottom: "20px",
                background: message.type === "success" ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
                color: message.type === "success" ? "#10b981" : "#ef4444",
                border: `1px solid ${message.type === "success" ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
                fontWeight: "500",
                display: "flex",
                alignItems: "center",
                gap: "10px"
              }}>
                <span>{message.type === "success" ? "✅" : "❌"}</span>
                <span style={{ whiteSpace: "pre-line" }}>{message.text}</span>
              </div>
            )}
            <ProfileInfoCard
              user={user}
              form={form}
              isEditing={isEditing}
              setIsEditing={setIsEditing}
              handleChange={handleChange}
              handleSubmit={handleUpdateProfile}
              saving={saving}
              handleDelete={handleDeactivate}
              preview={preview}
              handleImageChange={handleImageChange}
            />
          </>
        );

      case "security-&-login":
        return (
          <>
            {message && (
              <div className="glass-card" style={{
                padding: "12px 20px",
                borderRadius: "12px",
                marginBottom: "20px",
                background: message.type === "success" ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
                color: message.type === "success" ? "#10b981" : "#ef4444",
                border: `1px solid ${message.type === "success" ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
                fontWeight: "500",
                display: "flex",
                alignItems: "center",
                gap: "10px"
              }}>
                <span>{message.type === "success" ? "✅" : "❌"}</span>
                <span style={{ whiteSpace: "pre-line" }}>{message.text}</span>
              </div>
            )}
            <div className="glass-panel" style={{ padding: "25px" }}>
              <h3>🔒 Change Password</h3>
              <form onSubmit={handleChangePassword} className="profile-form" style={{ marginTop: "20px" }}>
                <div className="form-group" style={{ marginBottom: "15px" }}>
                  <label>Current Password</label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter current password"
                    style={{ width: "100%", padding: "12px 16px", background: "rgba(255, 255, 255, 0.08)", border: "1px solid rgba(255, 255, 255, 0.15)", borderRadius: "12px", color: "white", outline: "none" }}
                    required
                  />
                </div>
                <div className="form-group" style={{ marginBottom: "15px" }}>
                  <label>New Password</label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter new password (min 6 characters)"
                    style={{ width: "100%", padding: "12px 16px", background: "rgba(255, 255, 255, 0.08)", border: "1px solid rgba(255, 255, 255, 0.15)", borderRadius: "12px", color: "white", outline: "none" }}
                    required
                  />
                </div>
                <div className="form-group" style={{ marginBottom: "20px" }}>
                  <label>Confirm New Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordChange}
                    placeholder="Confirm new password"
                    style={{ width: "100%", padding: "12px 16px", background: "rgba(255, 255, 255, 0.08)", border: "1px solid rgba(255, 255, 255, 0.15)", borderRadius: "12px", color: "white", outline: "none" }}
                    required
                  />
                </div>
                <button type="submit" className="save-btn" disabled={saving}>
                  {saving ? "Changing..." : "Change Password"}
                </button>
              </form>
            </div>
          </>
        );

      case "system-activity":
        return (
          <div className="glass-panel" style={{ padding: "20px" }}>
            <h3>⚡ System Activity Logs</h3>
            <div className="timeline-empty-state glass-card" style={{ marginTop: "15px", padding: "30px" }}>
              <span className="empty-state-icon">📋</span>
              <p>No recent activity logs recorded in this session.</p>
            </div>
          </div>
        );

      case "settings":
        return (
          <div className="glass-panel danger-zone" style={{ padding: "25px" }}>
            <h3>⚠️ Danger Zone</h3>
            <p style={{ color: "var(--text-muted)", marginTop: "10px", lineHeight: "1.5" }}>
              Deactivating your admin account will immediately revoke all access privileges. This action is irreversible.
            </p>
            <button className="deactivate-btn" onClick={handleDeactivate} style={{ marginTop: "20px" }}>
              Deactivate Account
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  const centerComponent = {
    center: getCenterContent()
  };

  return (
    <ProfileLayout
      hero={heroComponent}
      tabs={tabsComponent}
      sidebar={sidebar3Col}
      content={centerComponent}
      role="admin"
    />
  );
}