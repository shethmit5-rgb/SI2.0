import "../Header.css";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

export default function GuestHeader() {
  const location = useLocation();
  const navigate = useNavigate();

  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isActive = (path) => location.pathname === path;

  const guestNavLinks = {
    main: [
      { path: "/", label: "Home", icon: "🏠" },
      { path: "/tournaments", label: "Events", icon: "🏆" },
      { path: "/schedule", label: "Schedule", icon: "📅" },
      { path: "/match-results", label: "Results", icon: "📊" },
    ],
    dropdowns: {
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
    }
  };

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

      {/* Navigation */}
      <nav className={mobileMenuOpen ? "mobile-open" : ""}>
        {/* Main Links */}
        {guestNavLinks.main.map(link => (
          <Link key={link.path} to={link.path} className={isActive(link.path) ? "active" : ""}>
            {link.icon} {link.label}
          </Link>
        ))}
        {/* Dropdowns */}
        {Object.values(guestNavLinks.dropdowns).map((dropdown, idx) => (
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
      </nav>

      {/* Right Actions */}
      <div className="nav-actions">
        <Link to="/login" className="login-btn">🔐 Login</Link>
      </div>
    </header>
  );
}
