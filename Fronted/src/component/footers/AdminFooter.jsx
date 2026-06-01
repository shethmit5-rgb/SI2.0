import { Link } from "react-router-dom";
import "../../static/Footer.css";

const AdminFooter = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="footer footer-animate">
      <div className="footer-container">
        {/* COLUMN 1 - Brand */}
        <div className="footer-col">
          <h2 className="footer-logo">ArenaSync Admin</h2>
          <p className="footer-tagline">
            System administration and management dashboard.
          </p>
        </div>

        {/* COLUMN 2 - Quick Links */}
        <div className="footer-col">
          <h4>Admin Links</h4>
          <ul>
            <li><Link to="/admin/dashboard" onClick={scrollToTop}>Dashboard</Link></li>
            <li><Link to="/admin/users" onClick={scrollToTop}>Manage Users</Link></li>
            <li><Link to="/admin/tournaments" onClick={scrollToTop}>Manage Tournaments</Link></li>
            <li><Link to="/admin/teams" onClick={scrollToTop}>Manage Teams</Link></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p>
          © {new Date().getFullYear()} <strong>ArenaSync</strong>. Admin Portal.
        </p>
        <button className="scroll-top-btn" onClick={scrollToTop}>
          ↑ Back to Top
        </button>
      </div>
    </footer>
  );
};

export default AdminFooter;
