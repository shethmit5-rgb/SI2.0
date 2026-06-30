import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

import RoleLayout from "./layouts/RoleLayout";
import NonOrganizerRoute from "./routes/NonOrganizerRoute";

/* ================= PUBLIC ================= */
import Home from "./screen/Home";
import Login from "./screen/Login";
import Events from "./screen/Events";
import Schedule from "./screen/Schedule";
import Speakers from "./screen/Speakers";
import Gallery from "./screen/Gallery";
import Venue from "./screen/Venue";
import Sponsors from "./screen/Sponsors";
import Contact from "./screen/Contact";
import Profile from "./screen/Profile";
import TeamsList from "./screen/TeamsList";
import TeamDetails from "./screen/TeamDetails";
import CreateTeam from "./screen/CreateTeam";
import MyTeamDashboard from "./screen/MyTeamDashboard";
import MyRegistrations from "./screen/MyRegistrations";
import RegisterTeam from "./screen/RegisterTeam";
import TournamentDetailsss from "./screen/TournamentDetails";
import ApprovePlayerss from "./screen/ApprovePlayers";
import Notifications from "./screen/Notifications";
import ForgotPassword from "./screen/ForgotPassword";
import AboutUs from "./screen/AboutUs";
import FAQ from "./screen/FAQ";
import Terms from "./screen/Terms";
import Privacy from "./screen/Privacy";
import Leaderboard from "./screen/Leaderboard";
import CreateTournamentUser from "./screen/CreateTournamentUser";
import MyTournaments from "./screen/MyTournaments";
import EditTeam from "./screen/EditTeam";
import RegisterWithVerification from "./screen/RegisterWithVerification";
import OrganizerMatches from "./screen/OrganizerMatches";
import OrganizerMatchList from "./screen/MatchList";
import MatchResults from "./screen/MatchResults";
import EditTournamentPage from "./screen/EditTournamentPage";
import SponsorManagement from "./screen/SponsorManagement";
import OrganizerDashboard from "./screen/OrganizerDashboard";
import SponsorAccountManagement from "./adminside/SponsorAccountManagement";
import SponsorDashboard from "./screen/SponsorDashboard";

/* ================= ADMIN CORE ================= */
import AdminRoute from "./routes/AdminRoute";
import AdminDashboard from "./adminside/AdminDashboard";
import AdminUsers from "./adminside/AdminUsers";
import AdminPayments from "./adminside/AdminPayments";

/* ================= ADMIN TOURNAMENT ================= */
import TournamentList from "./adminside/TournamentList";
import TournamentDetails from "./adminside/TournamentDetails";
import CreateTournament from "./adminside/CreateTournament";
import EditTournament from "./adminside/EditTournament";

/* ================= ADMIN TEAM / PLAYER ================= */
import AddTeam from "./adminside/AddTeam";
import TeamList from "./adminside/TeamList";
import ApprovePlayers from "./adminside/ApprovePlayers";

/* ================= ADMIN MATCH ================= */
import Matches from "./adminside/Matches";
import MatchList from "./adminside/MatchList";

/* ================= ADMIN OTHER ================= */
import Registrations from "./adminside/Registrations";
import Adminsponser from "./adminside/Adminsponser";
import SportManagement from "./adminside/SportManagement";
import VenueManagement from "./adminside/VenueManagement";
import AdminProfile from "./adminside/AdminProfile";
import AnalyticsDashboard from "./adminside/AnalyticsDashboard";
import Reports from "./adminside/Reports";


import "./index.css";
import "./App.css";

function AdminOrOrganizerRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin" && user.role !== "organizer") return <Navigate to="/" replace />;
  return children;
}

function SponsorDashboardOrHome() {
  const { user } = useAuth();
  if (user?.role === "sponsor") {
    return <SponsorDashboard />;
  }
  return <Home />;
}

function App() {
  return (
    <RoleLayout>
      <Routes>
        {/* ========== PUBLIC ROUTES ========== */}
        <Route path="/" element={<SponsorDashboardOrHome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<RegisterWithVerification />} />
        <Route path="/events" element={<Events />} />
        <Route path="/tournaments" element={<Events />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/speakers" element={<Speakers />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/venue" element={<Venue />} />
        <Route path="/sponsors" element={<Sponsors />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/tournament/:id" element={<TournamentDetailsss />} />
        <Route path="/teams" element={<TeamsList />} />
        <Route path="/team/:id" element={<TeamDetails />} />
        <Route path="/teams/create" element={<NonOrganizerRoute><CreateTeam /></NonOrganizerRoute>} />
        <Route path="/my-teams" element={<NonOrganizerRoute><MyTeamDashboard /></NonOrganizerRoute>} />
        <Route path="/my-registrations" element={<NonOrganizerRoute><MyRegistrations /></NonOrganizerRoute>} />
        <Route path="/RegisterTeam" element={<NonOrganizerRoute><RegisterTeam /></NonOrganizerRoute>} />
        <Route path="/approve-players" element={<ApprovePlayerss />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/create-tournament" element={<CreateTournamentUser />} />
        <Route path="/my-tournaments" element={<MyTournaments />} />
        <Route path="/teams/edit/:id" element={<EditTeam />} />
        <Route
          path="/organizer/matches"
          element={
            <AdminOrOrganizerRoute>
              <OrganizerMatches />
            </AdminOrOrganizerRoute>
          }
        />
        <Route
          path="/organizer/matches/list"
          element={
            <AdminOrOrganizerRoute>
              <OrganizerMatchList />
            </AdminOrOrganizerRoute>
          }
        />
        <Route path="/match-results" element={<MatchResults />} />
        <Route path="/edit-tournament/:id" element={<EditTournamentPage />} />
        <Route path="/my-sponsors" element={<SponsorManagement />} />
        <Route path="/organizer/dashboard" element={<OrganizerDashboard />} />
        <Route
          path="/organizer/registrations"
          element={
            <AdminOrOrganizerRoute>
              <Registrations />
            </AdminOrOrganizerRoute>
          }
        />

        {/* ========== ADMIN ROUTES ========== */}
        <Route
          path="/admin/dashboard"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/users"
          element={
            <AdminRoute>
              <AdminUsers />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/payments"
          element={
            <AdminRoute>
              <AdminPayments />
            </AdminRoute>
          }
        />

        {/* ----- TOURNAMENT ----- */}
        <Route
          path="/admin/tournaments"
          element={
            <AdminRoute>
              <TournamentList />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/tournament/create"
          element={
            <AdminRoute>
              <CreateTournament />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/tournament/:id"
          element={
            <AdminRoute>
              <TournamentDetails />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/tournament/edit/:id"
          element={
            <AdminRoute>
              <EditTournament />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/sports"
          element={
            <AdminRoute>
              <SportManagement />
            </AdminRoute>
          }
        />

        {/* ----- TEAMS ----- */}
        <Route
          path="/admin/teams/add"
          element={
            <AdminRoute>
              <AddTeam />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/teams"
          element={
            <AdminRoute>
              <TeamList />
            </AdminRoute>
          }
        />

        {/* ----- PLAYERS ----- */}
        <Route
          path="/admin/players/approve"
          element={
            <AdminRoute>
              <ApprovePlayers />
            </AdminRoute>
          }
        />

        {/* ----- MATCHES ----- */}
        <Route
          path="/admin/matches"
          element={
            <AdminRoute>
              <Matches />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/matches/list"
          element={
            <AdminRoute>
              <MatchList />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/venues"
          element={
            <AdminRoute>
              <VenueManagement />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/profile"
          element={
            <AdminRoute>
              <AdminProfile />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/analytics"
          element={
            <AdminOrOrganizerRoute>
              <AnalyticsDashboard />
            </AdminOrOrganizerRoute>
          }
        />

        <Route
          path="/admin/reports"
          element={
            <AdminRoute>
              <Reports />
            </AdminRoute>
          }
        />

        {/* ----- OTHER ----- */}
        <Route
          path="/admin/registrations"
          element={
            <AdminRoute>
              <Registrations />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/sponsors"
          element={
            <AdminRoute>
              <Adminsponser />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/sponsor-management"
          element={
            <AdminRoute>
              <SponsorAccountManagement />
            </AdminRoute>
          }
        />
      </Routes>
    </RoleLayout>
  );
}

export default App;
