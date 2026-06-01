import "../Header.css";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useEffect, useState, useRef } from "react";
import api from "../../utils/axiosConfig";
import socket from "../../utils/socket";

export default function CoachHeader() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // State Management
  const [notifications, setNotifications] = useState([]);
  const [openNotification, setOpenNotification] = useState(false);
  const [isCaptain, setIsCaptain] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openProfile, setOpenProfile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const profileRef = useRef(null);
  const notificationRef = useRef(null);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const coachNavLinks = {
    main: [
      { path: "/", label: "Home", icon: "🏠" },
      { path: "/tournaments", label: "Events", icon: "🏆" },
      { path: "/schedule", label: "Schedule", icon: "📅" },
      { path: "/match-results", label: "Results", icon: "📊" },
    ],
    dropdowns: {
      myStuff: {
        icon: "👤",
        label: "My Stuff",
        links: [
          { path: "/my-teams", label: "My Teams", icon: "👥" },
          { path: "/teams/create", label: "Create Team", icon: "➕" },
          { path: "/my-registrations", label: "My Registrations", icon: "📋" },
          { path: "/profile", label: "My Profile", icon: "👤" },
          ...(isCaptain ? [{ path: "/approve-players", label: "Approve Players", icon: "✅" }] : []),
        ]
      },
      explore: {
        icon: "🔍",
        label: "Explore",
        links: [
          { path: "/leaderboard", label: "Leaderboard", icon: "🏆" },
          { path: "/speakers", label: "Speakers", icon: "🎤" },
          { path: "/gallery", label: "Gallery", icon: "🖼️" },
          { path: "/venue", label: "Venue", icon: "🏟️" },
          { path: "/sponsors", label: "Sponsors", icon: "🤝" },
        ]
      },
      info: {
        icon: "ℹ️",
        label: "Info",
        links: [
          { path: "/about", label: "About Us", icon: "📖" },
          { path: "/faq", label: "FAQ", icon: "❓" },
          { path: "/contact", label: "Contact", icon: "📞" },
          { path: "/terms", label: "Terms", icon: "📜" },
          { path: "/privacy", label: "Privacy", icon: "🔒" },
        ]
      }
    },
    notifications: { path: "/notifications", label: "Notifications", icon: "🔔" }
  };

  // Effects
  useEffect(() => {
    if (user) {
      api.get("/teams/captain-teams")
        .then(res => setIsCaptain(res.data.length > 0))
        .catch(() => setIsCaptain(false));
    }
  }, [user]);

  useEffect(() => {
    if (user?._id) socket.emit("register", user._id);
  }, [user]);

  useEffect(() => {
    const handleNotification = (data) => setNotifications(prev => [data, ...prev]);
    socket.on("new_notification", handleNotification);
    return () => socket.off("new_notification", handleNotification);
  }, []);

  useEffect(() => {
    if (user) {
      api.get("/notifications")
        .then(res => setNotifications(res.data))
        .catch(err => console.error("Notification fetch error", err));
    }
  }, [user]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setOpenProfile(false);
      if (notificationRef.current && !notificationRef.current.contains(e.target)) setOpenNotification(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setOpenProfile(false);
    navigate("/login");
  };

  const markAsRead = async (n) => {
    try {
      if (!n._id) return;
      await api.put(`/notifications/${n._id}`);
      setNotifications(prev => prev.map(item =>
        item._id === n._id ? { ...item, isRead: true } : item
      ));
      if (n.type === "join_request") {
        navigate("/approve-players");
        setOpenNotification(false);
      } else if (n.type === "registration_approved") {
        navigate("/my-registrations");
        setOpenNotification(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    const unreadNotifications = notifications.filter(n => !n.isRead);
    for (const n of unreadNotifications) {
      try { await api.put(`/notifications/${n._id}`); } catch (err) { console.error(err); }
    }
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <header className={`navbar ${scrolled ? "scrolled" : ""}`}>
        {/* Logo */}
        <div className="logo" onClick={() => navigate("/")}>
          🏆 ArenaSync
        </div>

        {/* Mobile Menu Button */}
        <div className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          ☰
        </div>

        {/* Navigation */}
        <nav className={mobileMenuOpen ? "mobile-open" : ""}>
          {/* Coach Main Links */}
          {coachNavLinks.main.map(link => (
            <Link key={link.path} to={link.path} className={isActive(link.path) ? "active" : ""}>
              {link.icon} {link.label}
            </Link>
          ))}
          {/* Coach Dropdowns */}
          {Object.values(coachNavLinks.dropdowns).map((dropdown, idx) => (
            <div key={idx} className="nav-dropdown">
              <span className="nav-link">{dropdown.icon} {dropdown.label} ▾</span>
              <div className="dropdown-menu">
                {dropdown.links.map(link => (
                  <Link key={link.path} to={link.path}>
                    {link.icon && <span style={{ marginRight: "8px" }}>{link.icon}</span>}
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
          {/* Notifications Link (Mobile/Nav) */}
          <Link to={coachNavLinks.notifications.path} className="notifications-link">
            🔔 {coachNavLinks.notifications.label}
            {unreadCount > 0 && <span className="notif-link-badge">{unreadCount}</span>}
          </Link>
        </nav>

        {/* Right Actions */}
        <div className="nav-actions">
          {/* Notification Icon */}
          <div className="notification-icon" onClick={() => setOpenNotification(!openNotification)}>
            🔔
            {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
          </div>

          {/* Profile */}
          <div className="profile-wrapper" ref={profileRef}>
            <div className="profile-icon" onClick={() => setOpenProfile(!openProfile)}>
              {user?.profileImage ? (
                <img src={user.profileImage} alt="Profile" />
              ) : (
                user?.name?.charAt(0)?.toUpperCase()
              )}
            </div>

            {openProfile && (
              <div className="profile-dropdown">
                <p><strong>{user?.name}</strong></p>
                <p className="profile-email">{user?.email}</p>
                <hr />
                <button onClick={() => { navigate("/profile"); setOpenProfile(false); }}>
                  👤 My Profile
                </button>
                <button onClick={handleLogout} className="logout-btn">
                  🚪 Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Notification Popup */}
      {openNotification && (
        <div className="notif-overlay" onClick={() => setOpenNotification(false)}>
          <div className="notif-popup" onClick={(e) => e.stopPropagation()} ref={notificationRef}>
            <div className="notif-header">
              <h3>🔔 Notifications</h3>
              <div>
                {notifications.some(n => !n.isRead) && (
                  <button onClick={markAllAsRead} className="mark-all-btn">Mark all read</button>
                )}
                <button onClick={() => setOpenNotification(false)} className="close-btn">×</button>
              </div>
            </div>
            {notifications.length > 0 ? (
              notifications.map(n => (
                <div key={n._id} className={`notif-item ${!n.isRead ? "unread" : ""}`} onClick={() => markAsRead(n)}>
                  <p>{n.message}</p>
                  <small>{n.createdAt ? new Date(n.createdAt).toLocaleString() : "Just now"}</small>
                </div>
              ))
            ) : (
              <div className="empty-notif">📭 No notifications</div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
