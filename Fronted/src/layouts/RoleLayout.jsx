import { useAuth } from "../context/AuthContext";
import GuestLayout from "./GuestLayout";
import PlayerLayout from "./PlayerLayout";
import CoachLayout from "./CoachLayout";
import OrganizerLayout from "./OrganizerLayout";
import AdminLayout from "./AdminLayout";

const RoleLayout = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading-spinner">Loading...</div>;
  }

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
    default:
      return <GuestLayout>{children}</GuestLayout>;
  }
};

export default RoleLayout;
