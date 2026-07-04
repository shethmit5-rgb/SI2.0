import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import SkeletonDashboard from "../components/loading/SkeletonDashboard";

const NonOrganizerRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ padding: "40px" }}>
        <SkeletonDashboard />
      </div>
    );
  }

  // If user is not logged in, they can't access these protected routes anyway,
  // but just in case, redirect to login.
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If user is an organizer, they are blocked from these routes.
  if (user.role === "organizer") {
    alert("Access Denied. Organizers are not allowed to access this page.");
    return <Navigate to="/my-tournaments" replace />;
  }

  // Otherwise, render the child component.
  return children;
};

export default NonOrganizerRoute;
