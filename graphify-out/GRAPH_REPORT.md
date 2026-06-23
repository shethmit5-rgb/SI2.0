# Graph Report - react-clg-tournament-main  (2026-06-23)

## Corpus Check
- 147 files · ~80,884 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 649 nodes · 1121 edges · 36 communities (28 shown, 8 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `333281dd`
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
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]

## God Nodes (most connected - your core abstractions)
1. `useAuth()` - 54 edges
2. `api` - 33 edges
3. `checkAndUpdateTournamentStatuses()` - 13 edges
4. `getTournamentRoundInfo()` - 9 edges
5. `loadRazorpayScript()` - 7 edges
6. `getRazorpayKey()` - 7 edges
7. `checkAndReleaseExpiredRegistrations()` - 7 edges
8. `TiltCard()` - 6 edges
9. `socket` - 6 edges
10. `validateTournamentForm()` - 6 edges

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

## Communities (36 total, 8 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (52): { checkAndUpdateTournamentStatuses }, getAnalyticsData(), getOrganizerStats(), getRealtime(), getStats(), Match, Registration, Sponsor (+44 more)

### Community 1 - "Community 1"
Cohesion: 0.06
Nodes (26): AddTeam(), AdminUsers(), ApprovePlayers(), CreateTournament(), EditTournament(), Matches(), MatchList(), Registrations() (+18 more)

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (44): createMatch(), deleteMatch(), getCompletedMatches(), getMatchById(), getMatches(), getMatchesByTournament(), getPublicMatchesByTournament(), { getTournamentRoundInfo } (+36 more)

### Community 3 - "Community 3"
Cohesion: 0.06
Nodes (39): deleteNotification(), getNotifications(), markAsRead(), Notification, applyToTeam(), approvePlayer(), blockMembers(), createTeam() (+31 more)

### Community 4 - "Community 4"
Cohesion: 0.13
Nodes (10): AuthContext, Events(), Leaderboard(), MatchResults(), Schedule(), SponsorDashboard(), cardStyle, Sponsors() (+2 more)

### Community 5 - "Community 5"
Cohesion: 0.10
Nodes (27): nodemailer, sendResetPasswordEmail(), sendVerificationEmail(), sendWelcomeEmail(), transporter, bcrypt, checkEmail(), forgotPassword() (+19 more)

### Community 6 - "Community 6"
Cohesion: 0.10
Nodes (17): AdminFooter(), CoachFooter(), GuestFooter(), OrganizerFooter(), PlayerFooter(), AdminHeader(), CoachHeader(), GuestHeader() (+9 more)

### Community 7 - "Community 7"
Cohesion: 0.13
Nodes (27): acquireLock(), cancelRegistration(), checkAndReleaseExpiredRegistrations(), checkRegistration(), crypto, getAdminsAndOrganizer(), getAllRegistrations(), getMyRegistrations() (+19 more)

### Community 8 - "Community 8"
Cohesion: 0.09
Nodes (22): AdminProfile(), useAuth(), RoleLayout(), AdminRoute(), NonOrganizerRoute(), ApprovePlayers(), styles, CreateTeam() (+14 more)

### Community 9 - "Community 9"
Cohesion: 0.11
Nodes (25): cloudinary, createSponsor(), crypto, deleteSponsor(), fs, getMySponsorships(), getPublicSponsors(), getPublicSponsorsByTournament() (+17 more)

### Community 10 - "Community 10"
Cohesion: 0.09
Nodes (20): bcrypt, changePassword(), cloudinary, deactivateAccount(), fs, getProfile(), path, updateProfile() (+12 more)

### Community 11 - "Community 11"
Cohesion: 0.11
Nodes (20): adminOverridePayment(), createOrder(), crypto, getAllPaymentsAdmin(), getRazorpayKey(), getTransactions(), Razorpay, Registration (+12 more)

### Community 12 - "Community 12"
Cohesion: 0.19
Nodes (13): AdminPayments(), MyTournaments(), adminOverridePayment(), createOrder(), getAdminPayments(), getRazorpayKey(), initiateJoinPayment(), initiateRegistrationPayment() (+5 more)

### Community 13 - "Community 13"
Cohesion: 0.15
Nodes (7): AdminDashboard(), AnalyticsDashboard(), getThemeFromPathname(), THEME_CONFIGS, ThreeBgCanvas(), TiltCard(), OrganizerDashboard()

### Community 14 - "Community 14"
Cohesion: 0.13
Nodes (15): createUser(), deleteUser(), getPublicUsers(), getUsers(), updateUser(), User, { validationResult }, mongoose (+7 more)

### Community 15 - "Community 15"
Cohesion: 0.15
Nodes (14): validateDates(), validateDescription(), validateEmail(), validateName(), validateNumber(), validatePassword(), validateRules(), validateTournamentName() (+6 more)

### Community 16 - "Community 16"
Cohesion: 0.13
Nodes (13): adminHeaders, adminToken, axios, bcrypt, coachHeaders, coachToken, crypto, jwt (+5 more)

### Community 17 - "Community 17"
Cohesion: 0.13
Nodes (13): adminHeaders, adminToken, axios, bcrypt, coachHeaders, coachToken, crypto, jwt (+5 more)

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
Cohesion: 0.22
Nodes (8): app, cors, express, http, io, mongoose, { Server }, users

### Community 22 - "Community 22"
Cohesion: 0.22
Nodes (7): axios, jwt, mitHeaders, mitToken, mongoose, rajHeaders, rajToken

### Community 23 - "Community 23"
Cohesion: 0.32
Nodes (5): nodemailer, sendResetCode(), sendResetEmail(), sendResetSMS(), twilio

### Community 24 - "Community 24"
Cohesion: 0.33
Nodes (4): axios, bcrypt, jwt, mongoose

### Community 26 - "Community 26"
Cohesion: 0.50
Nodes (3): mongoose, path, { seedUsers }

## Knowledge Gaps
- **236 isolated node(s):** `THEME_CONFIGS`, `AuthContext`, `styles`, `images`, `speakers` (+231 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useAuth()` connect `Community 8` to `Community 1`, `Community 4`, `Community 6`, `Community 12`, `Community 13`, `Community 28`, `Community 29`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **What connects `THEME_CONFIGS`, `AuthContext`, `styles` to the rest of the system?**
  _236 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.0514216575922565 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.05656108597285068 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.06033182503770739 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.06280193236714976 - nodes in this community are weakly interconnected._
- **Should `Community 4` be split into smaller, more focused modules?**
  _Cohesion score 0.13257575757575757 - nodes in this community are weakly interconnected._