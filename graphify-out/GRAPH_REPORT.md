# Graph Report - react-clg-tournament-main  (2026-06-30)

## Corpus Check
- 136 files · ~77,448 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 584 nodes · 1107 edges · 25 communities (21 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b1bcbddf`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 39|Community 39]]

## God Nodes (most connected - your core abstractions)
1. `useAuth()` - 58 edges
2. `api` - 33 edges
3. `triggerDashboardUpdate()` - 27 edges
4. `checkAndUpdateTournamentStatuses()` - 15 edges
5. `socket` - 9 edges
6. `checkAndReleaseExpiredRegistrations()` - 7 edges
7. `updateRegistration()` - 7 edges
8. `verifyRegistrationPayment()` - 7 edges
9. `TiltCard()` - 6 edges
10. `loadRazorpayScript()` - 6 edges

## Surprising Connections (you probably didn't know these)
- `AdminOrOrganizerRoute()` --calls--> `useAuth()`  [EXTRACTED]
  Fronted/src/App.jsx → Fronted/src/context/AuthContext.jsx
- `SponsorDashboardOrHome()` --calls--> `useAuth()`  [EXTRACTED]
  Fronted/src/App.jsx → Fronted/src/context/AuthContext.jsx
- `AdminHeader()` --calls--> `useAuth()`  [EXTRACTED]
  Fronted/src/component/headers/AdminHeader.jsx → Fronted/src/context/AuthContext.jsx
- `CoachHeader()` --calls--> `useAuth()`  [EXTRACTED]
  Fronted/src/component/headers/CoachHeader.jsx → Fronted/src/context/AuthContext.jsx
- `OrganizerHeader()` --calls--> `useAuth()`  [EXTRACTED]
  Fronted/src/component/headers/OrganizerHeader.jsx → Fronted/src/context/AuthContext.jsx

## Import Cycles
- None detected.

## Communities (25 total, 4 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (55): createMatch(), deleteMatch(), getCompletedMatches(), getMatchById(), getMatches(), getMatchesByTournament(), getPublicMatchesByTournament(), { getTournamentRoundInfo, triggerDashboardUpdate } (+47 more)

### Community 1 - "Community 1"
Cohesion: 0.05
Nodes (29): AddTeam(), AdminUsers(), ApprovePlayers(), CreateTournament(), EditTournament(), Matches(), MatchList(), Registrations() (+21 more)

### Community 3 - "Community 3"
Cohesion: 0.06
Nodes (43): app, { blockOrganizerJoin }, cors, express, { getSchedule }, http, io, mongoose (+35 more)

### Community 4 - "Community 4"
Cohesion: 0.16
Nodes (7): AdminSponsor(), SponsorshipChart(), AuthContext, Leaderboard(), Schedule(), api, socket

### Community 5 - "Community 5"
Cohesion: 0.09
Nodes (28): nodemailer, sendRegistrationEmailOtp(), sendResetPasswordEmail(), sendVerificationEmail(), sendWelcomeEmail(), transporter, bcrypt, checkEmail() (+20 more)

### Community 6 - "Community 6"
Cohesion: 0.10
Nodes (17): AdminFooter(), CoachFooter(), GuestFooter(), OrganizerFooter(), PlayerFooter(), AdminHeader(), CoachHeader(), GuestHeader() (+9 more)

### Community 7 - "Community 7"
Cohesion: 0.12
Nodes (28): acquireLock(), cancelRegistration(), checkAndReleaseExpiredRegistrations(), checkRegistration(), crypto, getAdminsAndOrganizer(), getAllRegistrations(), getMyRegistrations() (+20 more)

### Community 8 - "Community 8"
Cohesion: 0.08
Nodes (22): AdminProfile(), useAuth(), RoleLayout(), AdminRoute(), NonOrganizerRoute(), ApprovePlayers(), styles, CreateTeam() (+14 more)

### Community 10 - "Community 10"
Cohesion: 0.09
Nodes (20): bcrypt, changePassword(), cloudinary, deactivateAccount(), fs, getProfile(), path, updateProfile() (+12 more)

### Community 12 - "Community 12"
Cohesion: 0.16
Nodes (14): AdminPayments(), CreateTournamentUser(), MyRegistrations(), MyTeamDashboard(), MyTournaments(), adminOverridePayment(), getAdminPayments(), getRazorpayKey() (+6 more)

### Community 13 - "Community 13"
Cohesion: 0.18
Nodes (6): AdminDashboard(), AnalyticsDashboard(), getThemeFromPathname(), THEME_CONFIGS, ThreeBgCanvas(), TiltCard()

### Community 14 - "Community 14"
Cohesion: 0.13
Nodes (15): createUser(), deleteUser(), getPublicUsers(), getUsers(), updateUser(), User, { validationResult }, mongoose (+7 more)

### Community 15 - "Community 15"
Cohesion: 0.15
Nodes (14): validateDates(), validateDescription(), validateEmail(), validateName(), validateNumber(), validatePassword(), validateRules(), validateTournamentName() (+6 more)

### Community 18 - "Community 18"
Cohesion: 0.21
Nodes (10): createSport(), deleteSport(), getSports(), Sport, updateSport(), mongoose, SportSchema, {
  createSport,
  getSports,
  updateSport,
  deleteSport,
} (+2 more)

### Community 19 - "Community 19"
Cohesion: 0.21
Nodes (10): createVenue(), deleteVenue(), getVenues(), updateVenue(), Venue, mongoose, VenueSchema, {
  createVenue,
  getVenues,
  updateVenue,
  deleteVenue,
} (+2 more)

### Community 20 - "Community 20"
Cohesion: 0.24
Nodes (6): validateDates(), validateDescription(), validateNumber(), validateRules(), validateTournamentName(), validateTournament()

### Community 21 - "Community 21"
Cohesion: 0.09
Nodes (23): adminOverridePayment(), createOrder(), crypto, getAllPaymentsAdmin(), getRazorpayKey(), getTransactions(), Razorpay, Registration (+15 more)

### Community 30 - "Community 30"
Cohesion: 0.16
Nodes (11): deleteNotification(), getNotifications(), markAsRead(), Notification, jwt, mongoose, NotificationSchema, auth (+3 more)

### Community 37 - "Community 37"
Cohesion: 0.05
Nodes (59): { checkAndUpdateTournamentStatuses }, getAnalyticsData(), getCoachDashboard(), getOrganizerDashboard(), getOrganizerStats(), getPlayerDashboard(), getRealtime(), getSponsorDashboard() (+51 more)

## Knowledge Gaps
- **193 isolated node(s):** `THEME_CONFIGS`, `AuthContext`, `styles`, `images`, `speakers` (+188 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `triggerDashboardUpdate()` connect `Community 0` to `Community 37`, `Community 3`, `Community 21`, `Community 7`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **Why does `useAuth()` connect `Community 8` to `Community 1`, `Community 4`, `Community 6`, `Community 39`, `Community 12`, `Community 13`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **What connects `THEME_CONFIGS`, `AuthContext`, `styles` to the rest of the system?**
  _193 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.051203277009728626 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.05200501253132832 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.061979648473635525 - nodes in this community are weakly interconnected._
- **Should `Community 5` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._