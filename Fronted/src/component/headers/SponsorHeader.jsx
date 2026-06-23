import "../Header.css";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useState, useRef, useEffect } from "react";

export default function SponsorHeader() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [openProfile, setOpenProfile] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setOpenProfile(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setOpenProfile(false);
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className={`navbar ${scrolled ? "scrolled" : ""}`}>
      {/* Logo */}
      <div className="logo" onClick={() => navigate("/")}>
        🏆 ArenaSync
      </div>

      {/* Mobile Menu Button */}
      <div className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
        ☰
      </div>

      {/* Navigation - Sponsor should have only: Home, Events, Profile */}
      <nav className={mobileMenuOpen ? "mobile-open" : ""}>
        <Link to="/" className={isActive("/") ? "active" : ""}>
          🏠 Home
        </Link>
        <Link to="/tournaments" className={isActive("/tournaments") || isActive("/events") ? "active" : ""}>
          🏆 Events
        </Link>
        <Link to="/profile" className={isActive("/profile") ? "active" : ""}>
          👤 Profile
        </Link>
      </nav>

      {/* Right Actions */}
      <div className="nav-actions">
        {/* Profile Dropdown */}
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
  );
}
