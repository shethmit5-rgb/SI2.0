import React, { useState } from "react";
import api from "../../utils/axiosConfig";
import "../../static/Profile.css";

export default function ProfileInfoCard({
  user,
  form,
  isEditing,
  setIsEditing,
  handleChange,
  handleSubmit,
  saving,
  handleDelete,
  preview,
  handleImageChange,
}) {
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Notification preferences state
  const [notifs, setNotifs] = useState({
    emailAlerts: true,
    matchReminder: true,
    sponsorshipUpdate: true,
    securityAlert: true,
  });

  const handleNotifChange = (e) => {
    setNotifs(prev => ({
      ...prev,
      [e.target.name]: e.target.checked,
    }));
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert("New passwords do not match!");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      alert("New password must be at least 6 characters!");
      return;
    }

    try {
      setPasswordLoading(true);
      await api.put("/profile/change-password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      alert("Password updated successfully! ✅");
      setShowPasswordModal(false);
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to update password ❌");
    } finally {
      setPasswordLoading(false);
    }
  };

  const avatarSrc = preview || user?.profileImage || `https://ui-avatars.com/api/?name=${form.name || user?.name || "User"}&background=4f46e5&color=fff`;

  return (
    <div className="profile-info-section glass-panel">
      <div className="info-section-header">
        <h2>👤 Personal Details & Settings</h2>
        {!isEditing && (
          <button className="edit-profile-btn" onClick={() => setIsEditing(true)}>
            ✎ Edit Profile
          </button>
        )}
      </div>

      {/* Small avatar preview above personal details */}
      <div className="personal-details-avatar-preview">
        {isEditing ? (
          <div
            className="personal-details-avatar-editable-wrapper"
            onClick={() => document.getElementById("details-avatar-upload").click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                document.getElementById("details-avatar-upload").click();
              }
            }}
            tabIndex={0}
            role="button"
            aria-label="Change profile photo"
          >
            <img src={avatarSrc} className="small-avatar-preview editable" alt="Avatar Preview" />
            <div className="details-avatar-hover-overlay">
              <span>Change Photo</span>
            </div>
            <div className="details-avatar-camera-btn">
              <span>📷</span>
            </div>
            <input
              id="details-avatar-upload"
              type="file"
              hidden
              accept="image/*"
              onChange={handleImageChange}
            />
          </div>
        ) : (
          <div className="personal-details-avatar-preview-wrapper">
            <img src={avatarSrc} className="small-avatar-preview" alt="Avatar Preview" />
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="profile-form">
        <div className="form-row">
          {/* Email (Always Read-Only) */}
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" value={user?.email || ""} disabled={true} />
          </div>

          {/* Full Name */}
          <div className="form-group">
            <label>Full Name</label>
            <input
              name="name"
              value={form.name || ""}
              onChange={handleChange}
              disabled={!isEditing}
              placeholder="Full Name"
            />
          </div>
        </div>

        <div className="form-row">
          {/* Phone Number */}
          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="tel"
              name="phoneNumber"
              value={form.phoneNumber || ""}
              onChange={handleChange}
              disabled={!isEditing}
              placeholder="10-digit number"
            />
          </div>

          {/* Location */}
          <div className="form-group">
            <label>Location / Address</label>
            <input
              name="location"
              value={form.location || ""}
              onChange={handleChange}
              disabled={!isEditing}
              placeholder="City, State"
            />
          </div>
        </div>

        {/* Organizer fields */}
        {user?.role === "organizer" && (
          <div className="form-row">
            <div className="form-group">
              <label>Organization Name</label>
              <input
                name="organizationName"
                value={isEditing ? (form.organizationName || "") : (form.organizationName || "No Organization Name Added")}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="Organization Name"
              />
            </div>

            <div className="form-group">
              <label>Gender</label>
              <select
                name="gender"
                value={form.gender || ""}
                onChange={handleChange}
                disabled={!isEditing}
                className="gender-select-premium"
              >
                <option value="" disabled>Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer-not-to-say">Prefer not to say</option>
              </select>
            </div>
          </div>
        )}

        {/* Sponsor fields */}
        {user?.role === "sponsor" && (
          <div className="form-row">
            <div className="form-group">
              <label>Brand Name</label>
              <input
                name="brandName"
                value={isEditing ? (form.brandName || "") : (form.brandName || "No Brand Name Added")}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="Brand Name"
              />
            </div>

            <div className="form-group">
              <label>Gender</label>
              <select
                name="gender"
                value={form.gender || ""}
                onChange={handleChange}
                disabled={!isEditing}
                className="gender-select-premium"
              >
                <option value="" disabled>Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer-not-to-say">Prefer not to say</option>
              </select>
            </div>
          </div>
        )}

        {/* Coach / Player fields */}
        {user?.role !== "organizer" && user?.role !== "sponsor" && (
          <div className="form-row">
            <div className="form-group">
              <label>Gender</label>
              <select
                name="gender"
                value={form.gender || ""}
                onChange={handleChange}
                disabled={!isEditing}
                className="gender-select-premium"
              >
                <option value="" disabled>Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer-not-to-say">Prefer not to say</option>
              </select>
            </div>

            <div className="form-group empty-placeholder"></div>
          </div>
        )}

        {/* Bio / Description */}
        <div className="form-group full-width">
          <label>Bio / Description</label>
          <textarea
            name="description"
            value={form.description || ""}
            onChange={handleChange}
            disabled={!isEditing}
            placeholder="Tell us about yourself..."
            rows="3"
          />
        </div>

        {isEditing && (
          <div className="form-actions">
            <button type="submit" className="save-btn" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button"
              className="cancel-btn"
              onClick={() => {
                setIsEditing(false);
                window.location.reload();
              }}
            >
              Cancel
            </button>
          </div>
        )}
      </form>

      {/* Account Settings & Notification preferences */}
      <div className="account-preferences-section">
        <h3>🔔 Notification Preferences</h3>
        <div className="notif-grid">
          <label className="notif-toggle">
            <input
              type="checkbox"
              name="emailAlerts"
              checked={notifs.emailAlerts}
              onChange={handleNotifChange}
            />
            <span>Email notifications</span>
          </label>
          <label className="notif-toggle">
            <input
              type="checkbox"
              name="matchReminder"
              checked={notifs.matchReminder}
              onChange={handleNotifChange}
            />
            <span>Match schedule updates</span>
          </label>
          <label className="notif-toggle">
            <input
              type="checkbox"
              name="sponsorshipUpdate"
              checked={notifs.sponsorshipUpdate}
              onChange={handleNotifChange}
            />
            <span>Sponsorship news</span>
          </label>
          <label className="notif-toggle">
            <input
              type="checkbox"
              name="securityAlert"
              checked={notifs.securityAlert}
              onChange={handleNotifChange}
            />
            <span>Security alerts</span>
          </label>
        </div>
      </div>

      {/* Security Actions */}
      <div className="security-settings-section">
        <h3>🔐 Security</h3>
        <div className="security-actions-row">
          <button 
            type="button" 
            className="change-password-btn-premium"
            onClick={() => setShowPasswordModal(true)}
          >
            Change Password
          </button>
          <button 
            type="button" 
            className="deactivate-account-btn-premium"
            onClick={handleDelete}
          >
            Deactivate Account
          </button>
        </div>
      </div>

      {/* CHANGE PASSWORD MODAL */}
      {showPasswordModal && (
        <div className="modal">
          <div className="modal-content glass-panel animate-zoom-in">
            <h3>🔐 Change Password</h3>
            <form onSubmit={handlePasswordSubmit}>
              <div className="form-group">
                <label>Current Password</label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      currentPassword: e.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      newPassword: e.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      confirmPassword: e.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="save-btn" disabled={passwordLoading}>
                  {passwordLoading ? "Updating..." : "Update Password"}
                </button>
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowPasswordModal(false)}
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
