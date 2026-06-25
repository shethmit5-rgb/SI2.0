# Graph Report - react-clg-tournament-main  (2026-06-25)

## Corpus Check
- 151 files · ~89,258 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 708 nodes · 1263 edges · 40 communities (31 shown, 9 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `aad1dfd6`
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
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 44|Community 44]]

## God Nodes (most connected - your core abstractions)
1. `useAuth()` - 58 edges
2. `api` - 33 edges
3. `triggerDashboardUpdate()` - 27 edges
4. `checkAndUpdateTournamentStatuses()` - 17 edges
5. `socket` - 9 edges
6. `getTournamentRoundInfo()` - 9 edges
7. `loadRazorpayScript()` - 7 edges
8. `getRazorpayKey()` - 7 edges
9. `checkAndReleaseExpiredRegistrations()` - 7 edges
10. `updateRegistration()` - 7 edges

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

## Communities (40 total, 9 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.13
Nodes (16): { checkAndUpdateTournamentStatuses, getTournamentRoundInfo, triggerDashboardUpdate }, cloudinary, crypto, fs, getPublicTournamentById(), getTournamentById(), jwt, Match (+8 more)

### Community 1 - "Community 1"
Cohesion: 0.05
Nodes (30): AddTeam(), AdminUsers(), ApprovePlayers(), CreateTournament(), EditTournament(), Matches(), MatchList(), Registrations() (+22 more)

### Community 2 - "Community 2"
Cohesion: 0.05
Nodes (48): app, cors, express, http, io, mongoose, { Server }, users (+40 more)

### Community 3 - "Community 3"
Cohesion: 0.05
Nodes (59): cloudinary, createSponsor(), crypto, deleteSponsor(), fs, getMySponsorships(), getPublicSponsors(), getPublicSponsorsByTournament() (+51 more)

### Community 4 - "Community 4"
Cohesion: 0.16
Nodes (7): AdminSponsor(), SponsorshipChart(), AuthContext, EditTeam(), Schedule(), api, socket

### Community 5 - "Community 5"
Cohesion: 0.10
Nodes (27): nodemailer, sendResetPasswordEmail(), sendVerificationEmail(), sendWelcomeEmail(), transporter, bcrypt, checkEmail(), forgotPassword() (+19 more)

### Community 6 - "Community 6"
Cohesion: 0.10
Nodes (17): AdminFooter(), CoachFooter(), GuestFooter(), OrganizerFooter(), PlayerFooter(), AdminHeader(), CoachHeader(), GuestHeader() (+9 more)

### Community 7 - "Community 7"
Cohesion: 0.12
Nodes (28): acquireLock(), cancelRegistration(), checkAndReleaseExpiredRegistrations(), checkRegistration(), crypto, getAdminsAndOrganizer(), getAllRegistrations(), getMyRegistrations() (+20 more)

### Community 8 - "Community 8"
Cohesion: 0.08
Nodes (21): AdminProfile(), useAuth(), RoleLayout(), AdminRoute(), NonOrganizerRoute(), ApprovePlayers(), styles, CreateTeam() (+13 more)

### Community 10 - "Community 10"
Cohesion: 0.09
Nodes (20): bcrypt, changePassword(), cloudinary, deactivateAccount(), fs, getProfile(), path, updateProfile() (+12 more)

### Community 11 - "Community 11"
Cohesion: 0.14
Nodes (17): adminOverridePayment(), createOrder(), crypto, getAllPaymentsAdmin(), getRazorpayKey(), getTransactions(), Razorpay, Registration (+9 more)

### Community 12 - "Community 12"
Cohesion: 0.14
Nodes (17): AdminPayments(), CreateTournamentUser(), MyRegistrations(), MyTeamDashboard(), MyTournaments(), TournamentDetails(), adminOverridePayment(), createOrder() (+9 more)

### Community 13 - "Community 13"
Cohesion: 0.18
Nodes (6): AdminDashboard(), AnalyticsDashboard(), getThemeFromPathname(), THEME_CONFIGS, ThreeBgCanvas(), TiltCard()

### Community 14 - "Community 14"
Cohesion: 0.17
Nodes (13): createUser(), deleteUser(), getPublicUsers(), getUsers(), updateUser(), User, { validationResult }, auth (+5 more)

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
Cohesion: 0.29
Nodes (8): createSport(), deleteSport(), getSports(), Sport, updateSport(), {
  createSport,
  getSports,
  updateSport,
  deleteSport,
}, express, router

### Community 19 - "Community 19"
Cohesion: 0.29
Nodes (8): createVenue(), deleteVenue(), getVenues(), updateVenue(), Venue, {
  createVenue,
  getVenues,
  updateVenue,
  deleteVenue,
}, express, router

### Community 20 - "Community 20"
Cohesion: 0.24
Nodes (6): validateDates(), validateDescription(), validateNumber(), validateRules(), validateTournamentName(), validateTournament()

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

### Community 37 - "Community 37"
Cohesion: 0.13
Nodes (23): { checkAndUpdateTournamentStatuses }, getAnalyticsData(), getCoachDashboard(), getOrganizerDashboard(), getOrganizerStats(), getPlayerDashboard(), getRealtime(), getSponsorDashboard() (+15 more)

### Community 38 - "Community 38"
Cohesion: 0.08
Nodes (27): deleteNotification(), getNotifications(), markAsRead(), Notification, jwt, mongoose, NotificationSchema, auth (+19 more)

### Community 39 - "Community 39"
Cohesion: 0.15
Nodes (12): createTournament(), deleteTournament(), getMatchesByTournament(), getRoundInfo(), updateTournament(), auth, {
  createTournament,
  getMyTournaments,
  getPublicTournaments,
  getPublicTournamentById,
  getTournaments,
  getTournamentById,
  updateTournament,
  deleteTournament,
  getMatchesByTournament,
  getRoundInfo,
  verifyTournamentPayment,
}, express (+4 more)

### Community 41 - "Community 41"
Cohesion: 0.05
Nodes (32): mongoose, SportSchema, mongoose, TeamSchema, mongoose, TournamentSchema, mongoose, UserSchema (+24 more)

### Community 42 - "Community 42"
Cohesion: 0.60
Nodes (5): getMyTournaments(), getPublicTournaments(), getTournaments(), populateSponsorDetailsForArray(), checkAndUpdateTournamentStatuses()

## Knowledge Gaps
- **274 isolated node(s):** `THEME_CONFIGS`, `AuthContext`, `styles`, `images`, `speakers` (+269 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `triggerDashboardUpdate()` connect `Community 3` to `Community 0`, `Community 2`, `Community 39`, `Community 7`, `Community 11`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Why does `useAuth()` connect `Community 8` to `Community 1`, `Community 4`, `Community 6`, `Community 9`, `Community 12`, `Community 13`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Why does `checkAndUpdateTournamentStatuses()` connect `Community 42` to `Community 0`, `Community 2`, `Community 37`?**
  _High betweenness centrality (0.007) - this node is a cross-community bridge._
- **What connects `THEME_CONFIGS`, `AuthContext`, `styles` to the rest of the system?**
  _274 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.1323529411764706 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.049678550555230856 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.052597402597402594 - nodes in this community are weakly interconnected._