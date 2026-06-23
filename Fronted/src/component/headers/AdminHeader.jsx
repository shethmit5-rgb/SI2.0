import "../Header.css";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useEffect, useState, useRef } from "react";
import api from "../../utils/axiosConfig";
import socket from "../../utils/socket";

export default function AdminHeader() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // State Management
  const [notifications, setNotifications] = useState([]);
  const [openNotification, setOpenNotification] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openProfile, setOpenProfile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const profileRef = useRef(null);
  const notificationRef = useRef(null);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const adminNavLinks = {
    main: [
      { path: "/admin/dashboard", label: "Dashboard", icon: "📊" },

      { path: "/admin/sponsor-management", label: "Sponsor Management", icon: "🤝" },
      { path: "/admin/registrations", label: "Registrations", icon: "📝" },
      { path: "/admin/payments", label: "Payments", icon: "💳" },
    ],
    dropdowns: {
      tournament: {
        icon: "🏆",
        label: "Tournament",
        links: [
          { path: "/admin/tournament/create", label: "Create Tournament" },
          { path: "/admin/tournaments", label: "Tournament List" },
        ]
      },
      teams: {
        icon: "👥",
        label: "Teams",
        links: [
          { path: "/admin/teams/add", label: "Add Team" },
          { path: "/admin/teams", label: "Team List" },
          { path: "/admin/players/approve", label: "Approve Players" },
        ]
      },
      matches: {
        icon: "⚽",
        label: "Matches",
        links: [
          { path: "/admin/matches", label: "Create Match" },
          { path: "/admin/matches/list", label: "Match List" },
        ]
      },
      settings: {
        icon: "⚙️",
        label: "Settings",
        links: [
          { path: "/admin/sports", label: "Sports" },
          { path: "/admin/venues", label: "Venues" },
          { path: "/admin/sponsors", label: "Sponsors" },
        ]
      },
      analytics: {
        icon: "📊",
        label: "Analytics",
        links: [
          { path: "/admin/analytics", label: "Dashboard" },
          { path: "/admin/reports", label: "Reports" },
        ]
      }
    }
  };

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
  const breadcrumb = location.pathname.replace("/admin", "").replace("/", "").replace(/-/g, " ") || "dashboard";

  return (
    <>
      <header className={`navbar admin-navbar ${scrolled ? "scrolled" : ""}`}>
        {/* Logo */}
        <div className="logo" onClick={() => navigate("/admin/dashboard")}>
          <span className="logo-icon">🏆</span>
          <span className="logo-text">ArenaSync </span>
        </div>

        {/* Mobile Menu Button */}
        <div className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          ☰
        </div>

        {/* Navigation */}
        <nav className={mobileMenuOpen ? "mobile-open" : ""}>
          {adminNavLinks.main.map(link => (
            <Link key={link.path} to={link.path} className={isActive(link.path) ? "active" : ""}>
              <span className="nav-icon">{link.icon}</span>{" "}
              <span className="nav-label">{link.label}</span>
            </Link>
          ))}
          {/* Admin Dropdowns */}
          {Object.values(adminNavLinks.dropdowns).map((dropdown, idx) => (
            <div key={idx} className="nav-dropdown">
              <span className="nav-link">
                <span className="nav-icon">{dropdown.icon}</span>{" "}
                <span className="nav-label">{dropdown.label}</span>
                <span className="nav-arrow"> ▾</span>
              </span>
              <div className="dropdown-menu">
                {dropdown.links.map(link => (
                  <Link key={link.path} to={link.path}>{link.label}</Link>
                ))}
              </div>
            </div>
          ))}
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
                <button onClick={() => { navigate("/admin/profile"); setOpenProfile(false); }}>
                  👤 Admin Profile
                </button>
                <button onClick={handleLogout} className="logout-btn">
                  🚪 Logout
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="admin-breadcrumb">Admin / {breadcrumb}</div>
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
