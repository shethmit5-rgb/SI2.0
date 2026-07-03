import React, { useState, useEffect, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/axiosConfig";
import { useAuth } from "../context/AuthContext";
import ProfileLayout from "../components/profile/ProfileLayout";
import ProfileHero from "../components/profile/ProfileHero";
import ProfileTabs from "../components/profile/ProfileTabs";
import ProfileQuickActions from "../components/profile/ProfileQuickActions";
import "../static/Profile.css";

// Lazy-loaded role-specific contents
const OrganizerProfileContent = React.lazy(() => import("../components/profile/OrganizerProfileContent"));
const CoachProfileContent = React.lazy(() => import("../components/profile/CoachProfileContent"));
const PlayerProfileContent = React.lazy(() => import("../components/profile/PlayerProfileContent"));
const SponsorProfileContent = React.lazy(() => import("../components/profile/SponsorProfileContent"));

export default function Profile() {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    phoneNumber: "",
    location: "",
    description: "",
    gender: "",
    age: "",
  });

  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Set default active tab to overview
  const [activeTab, setActiveTab] = useState("overview");
  const [profileData, setProfileData] = useState(null);
  const [dashboardData, setDashboardData] = useState({});

  // ================= FETCH PROFILE & DASHBOARD DATA =================
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/profile/me");
        setProfileData(res.data);
        setForm({
          name: res.data.name || "",
          phoneNumber: res.data.phoneNumber || "",
          location: res.data.location || "",
          description: res.data.description || "",
          gender: res.data.gender || "",
          age: res.data.age || "",
        });
        setPreview(res.data.profileImage || "");
      } catch (err) {
        console.error("Profile load failed", err);
      } finally {
        setProfileLoading(false);
      }
    };

    const fetchDashboard = async () => {
      if (!user?.role) return;
      try {
        const res = await api.get(`/analytics/${user.role}-dashboard`);
        setDashboardData(res.data);
      } catch (err) {
        console.error("Dashboard load failed", err);
      } finally {
        setDashboardLoading(false);
      }
    };

    fetchProfile();
    fetchDashboard();
  }, [user]);

  // ================= HANDLERS =================
  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

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

      login(res.data.user, localStorage.getItem("token"));
      alert("Profile updated successfully ✅");
      setIsEditing(false);
      if (res.data.user.profileImage) {
        setPreview(res.data.user.profileImage);
      }
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Profile update failed ❌");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to deactivate your account? This action cannot be undone.")) return;

    try {
      await api.delete("/profile/delete");
      logout();
      navigate("/");
    } catch (err) {
      alert("Deactivate failed ❌");
    }
  };

  // ================= SKELETON LOADER =================
  if (profileLoading || dashboardLoading) {
    return <ProfileSkeletonLoader />;
  }

  // ================= ROLE PARAMETERS CONFIGURATION =================
  const role = user?.role || "player";
  
  let tabs = [];
  let primaryStats = [];
  let achievements = [];

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  if (role === "organizer") {
    tabs = ["Overview", "Tournaments", "Matches", "Reports", "Activity", "Settings"];
    const s = dashboardData.stats || {};
    primaryStats = [
      { label: "Tournaments", value: s.totalTournaments || 0 },
      { label: "Success Rate", value: "98%" },
    ];
    achievements = [
      { icon: "🏆", title: "Elite Organizer", desc: "Successfully managed sports events" },
      { icon: "⭐", title: "Top Rated Organizer", desc: "Consistent active reviews" },
    ];
  } else if (role === "coach") {
    tabs = ["Overview", "Teams", "Players", "Matches", "Achievements", "Settings"];
    const s = dashboardData.stats || {};
    primaryStats = [
      { label: "Teams Managed", value: s.teamsCreated || 0 },
      { label: "Win Rate", value: `${s.winRate || 0}%` },
    ];
    achievements = [
      { icon: "🏆", title: "Champion Coach", desc: "Roster matches champion status" },
      { icon: "👥", title: "Development Expert", desc: "Trained 5+ collegiate players" },
    ];
  } else if (role === "player") {
    tabs = ["Overview", "Performance", "Rewards", "Achievements", "History", "Settings"];
    const s = dashboardData.stats || {};
    const f = dashboardData.financials || {};
    primaryStats = [
      { label: "Matches Played", value: s.totalMatchesPlayed || 0 },
      { label: "Earnings", value: formatCurrency(f.totalPrizeMoneyEarned || 0) },
    ];
    achievements = [
      { icon: "🥇", title: "MVP Bracket", desc: "Top competitive performance" },
      { icon: "💰", title: "Prize Winner", desc: "Earned direct payouts" },
    ];
  } else if (role === "sponsor") {
    tabs = ["Overview", "Sponsorships", "Prize Distribution", "Invoices", "Analytics", "Settings"];
    const s = dashboardData.stats || {};
    const f = dashboardData.financials || {};
    primaryStats = [
      { label: "Sponsored Amount", value: formatCurrency(f.totalSponsoredAmount || 0) },
      { label: "Active Sponsorships", value: s.activeSponsorships || 0 },
    ];
    achievements = [
      { icon: "💎", title: "Platinum Sponsor", desc: "Significant collegiate sports funding" },
      { icon: "🤝", title: "Community Supporter", desc: "Direct brand engagement" },
    ];
  }

  // ================= RENDER DYNAMIC COMPONENTS =================
  const heroComponent = (
    <ProfileHero
      name={profileData?.name || user?.name}
      role={role}
      email={user?.email}
      createdAt={profileData?.createdAt}
      preview={preview}
      isEditing={isEditing}
      handleImageChange={handleImageChange}
      primaryStats={primaryStats}
      form={form}
      organizationName={profileData?.organizationName}
      brandName={profileData?.brandName}
    />
  );

  const tabsComponent = (
    <ProfileTabs
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    />
  );

  const sidebarComponent = (
    <div className="profile-sidebar-column">
      <ProfileQuickActions role={role} user={user} />
      
      {/* Achievements Card */}
      <div className="achievements-sidebar-card glass-panel">
        <h3>🏆 Achievements</h3>
        <div className="timeline-container">
          {achievements.map((ach, idx) => (
            <div key={idx} className="timeline-item" style={{ gap: "10px" }}>
              <span style={{ fontSize: "20px" }}>{ach.icon}</span>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <strong style={{ fontSize: "13px", color: "var(--text)" }}>{ach.title}</strong>
                <small style={{ fontSize: "11px", color: "var(--text-muted)" }}>{ach.desc}</small>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const contentComponent = (
    <Suspense fallback={<div className="glass-card skeleton-loader" style={{ height: "400px" }}></div>}>
      {role === "organizer" && (
        <OrganizerProfileContent
          activeTab={activeTab}
          dashboardData={dashboardData}
          user={user}
          form={form}
          isEditing={isEditing}
          setIsEditing={setIsEditing}
          handleChange={handleChange}
          handleSubmit={handleSubmit}
          saving={saving}
          handleDelete={handleDelete}
        />
      )}
      {role === "coach" && (
        <CoachProfileContent
          activeTab={activeTab}
          dashboardData={dashboardData}
          user={user}
          form={form}
          isEditing={isEditing}
          setIsEditing={setIsEditing}
          handleChange={handleChange}
          handleSubmit={handleSubmit}
          saving={saving}
          handleDelete={handleDelete}
        />
      )}
      {role === "player" && (
        <PlayerProfileContent
          activeTab={activeTab}
          dashboardData={dashboardData}
          user={user}
          form={form}
          isEditing={isEditing}
          setIsEditing={setIsEditing}
          handleChange={handleChange}
          handleSubmit={handleSubmit}
          saving={saving}
          handleDelete={handleDelete}
        />
      )}
      {role === "sponsor" && (
        <SponsorProfileContent
          activeTab={activeTab}
          dashboardData={dashboardData}
          user={user}
          form={form}
          isEditing={isEditing}
          setIsEditing={setIsEditing}
          handleChange={handleChange}
          handleSubmit={handleSubmit}
          saving={saving}
          handleDelete={handleDelete}
        />
      )}
    </Suspense>
  );

  return (
    <ProfileLayout
      hero={heroComponent}
      tabs={tabsComponent}
      sidebar={sidebarComponent}
      content={contentComponent}
    />
  );
}

// Glassmorphism Skeleton Loader Component
function ProfileSkeletonLoader() {
  return (
    <div className="profile-page-wrapper" style={{ padding: "40px 20px" }}>
      <div className="profile-hero-card glass-panel skeleton-loader" style={{ height: "240px", marginBottom: "30px" }}></div>
      <div className="profile-tabs glass-panel skeleton-loader" style={{ height: "60px", marginBottom: "30px" }}></div>
      <div className="profile-grid-container">
        <div className="profile-sidebar-column">
          <div className="glass-panel skeleton-loader" style={{ height: "200px" }}></div>
          <div className="glass-panel skeleton-loader" style={{ height: "180px" }}></div>
        </div>
        <div className="profile-main-column">
          <div className="glass-panel skeleton-loader" style={{ height: "400px" }}></div>
        </div>
      </div>
    </div>
  );
}