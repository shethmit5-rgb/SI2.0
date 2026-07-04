import GuestLayout from "./GuestLayout";
import PlayerLayout from "./PlayerLayout";
import CoachLayout from "./CoachLayout";
import OrganizerLayout from "./OrganizerLayout";
import AdminLayout from "./AdminLayout";
import SponsorLayout from "./SponsorLayout";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import ThreeBgCanvas from "../components/ThreeBgCanvas";
import SkeletonDashboard from "../components/loading/SkeletonDashboard";

const RoleLayout = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ padding: "40px" }}>
        <SkeletonDashboard />
      </div>
    );
  }

  const renderLayoutContent = () => {
    if (!user) {
      return <GuestLayout>{children}</GuestLayout>;
    }

    switch (user.role) {
      case "player":
        return <PlayerLayout>{children}</PlayerLayout>;
      case "coach":
        return <CoachLayout>{children}</CoachLayout>;
      case "organizer":
        return <OrganizerLayout>{children}</OrganizerLayout>;
      case "admin":
        return <AdminLayout>{children}</AdminLayout>;
      case "sponsor":
        return <SponsorLayout>{children}</SponsorLayout>;
      default:
        return <GuestLayout>{children}</GuestLayout>;
    }
  };

  return (
    <div className="global-app-container perspective-viewport" style={{ position: "relative", minHeight: "100vh", overflowX: "hidden" }}>
      {/* Global Three.js Particle System Backdrop */}
      <ThreeBgCanvas />

      {/* Global Page Transition Wrapper */}
      <motion.div
        key={user ? user.role : "guest"}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        style={{ position: "relative", zIndex: 10, width: "100%", height: "100%" }}
      >
        {renderLayoutContent()}
      </motion.div>
    </div>
  );
};

export default RoleLayout;
