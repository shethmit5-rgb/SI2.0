# Graph Report - react-clg-tournament-main  (2026-07-07)

## Corpus Check
- 180 files · ~94,292 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 809 nodes · 1623 edges · 41 communities (33 shown, 8 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `84510819`
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
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]

## God Nodes (most connected - your core abstractions)
1. `useAuth()` - 60 edges
2. `api` - 35 edges
3. `triggerDashboardUpdate()` - 27 edges
4. `SkeletonTable()` - 17 edges
5. `checkAndUpdateTournamentStatuses()` - 16 edges
6. `Skeleton()` - 13 edges
7. `requiredMongoIdChain()` - 12 edges
8. `enumChain()` - 10 edges
9. `socket` - 9 edges
10. `SkeletonDashboard()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `updateMatchResult()` --calls--> `distributeTournamentPrizes()`  [INFERRED]
  backend/controllers/matchController.js → backend/utils/prizeDistributionHelper.js
- `checkAndUpdateTournamentStatuses()` --calls--> `distributeTournamentPrizes()`  [INFERRED]
  backend/utils/tournamentHelper.js → backend/utils/prizeDistributionHelper.js
- `AdminOrOrganizerRoute()` --calls--> `useAuth()`  [EXTRACTED]
  Fronted/src/App.jsx → Fronted/src/context/AuthContext.jsx
- `SponsorDashboardOrHome()` --calls--> `useAuth()`  [EXTRACTED]
  Fronted/src/App.jsx → Fronted/src/context/AuthContext.jsx
- `AdminProfile()` --calls--> `useAuth()`  [EXTRACTED]
  Fronted/src/adminside/AdminProfile.jsx → Fronted/src/context/AuthContext.jsx

## Import Cycles
- None detected.

## Communities (41 total, 8 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (43): app, { blockOrganizerJoin }, cors, express, { getSchedule }, http, io, mongoose (+35 more)

### Community 1 - "Community 1"
Cohesion: 0.06
Nodes (37): AddTeam(), AdminUsers(), CreateTournament(), EditTournament(), Matches(), useAuth(), AdminRoute(), NonOrganizerRoute() (+29 more)

### Community 2 - "Community 2"
Cohesion: 0.14
Nodes (12): jwt, { validationResult }, auth, express, {
  getPrizeDistributionByTournamentValidator,
  distributePrizesValidator
}, {
  getPrizeDistributions,
  getPrizeDistributionByTournament,
  manuallyDistributePrizes
}, role, router (+4 more)

### Community 3 - "Community 3"
Cohesion: 0.06
Nodes (53): applyToTeam(), approvePlayer(), blockMembers(), checkAndReleaseExpiredPlayerApprovals(), createTeam(), crypto, deleteTeamByAdmin(), deleteTeamByCaptain() (+45 more)

### Community 4 - "Community 4"
Cohesion: 0.12
Nodes (10): AuthContext, AuthProvider(), styles, EditTeam(), Events(), cardStyle, Sponsors(), App() (+2 more)

### Community 5 - "Community 5"
Cohesion: 0.07
Nodes (40): nodemailer, sendRegistrationEmailOtp(), sendResetPasswordEmail(), sendVerificationEmail(), sendWelcomeEmail(), transporter, bcrypt, checkEmail() (+32 more)

### Community 6 - "Community 6"
Cohesion: 0.09
Nodes (18): AdminFooter(), CoachFooter(), GuestFooter(), OrganizerFooter(), PlayerFooter(), AdminHeader(), CoachHeader(), GuestHeader() (+10 more)

### Community 7 - "Community 7"
Cohesion: 0.09
Nodes (38): acquireLock(), cancelRegistration(), checkAndReleaseExpiredRegistrations(), checkRegistration(), crypto, getAdminsAndOrganizer(), getAllRegistrations(), getMyRegistrations() (+30 more)

### Community 8 - "Community 8"
Cohesion: 0.07
Nodes (37): cloudinary, createSponsor(), crypto, deleteSponsor(), fs, getMySponsorships(), getPublicSponsors(), getPublicSponsorsByTournament() (+29 more)

### Community 9 - "Community 9"
Cohesion: 0.10
Nodes (22): createTournament(), getMatchesByTournament(), getRoundInfo(), mongoose, auth, {
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
}, {
  createTournamentValidator,
  verifyTournamentPaymentValidator,
  getTournamentValidator,
  updateTournamentValidator,
  deleteTournamentValidator,
  getTournamentMatchesValidator,
  getTournamentRoundInfoValidator
}, express (+14 more)

### Community 10 - "Community 10"
Cohesion: 0.13
Nodes (16): bcrypt, changePassword(), cloudinary, deactivateAccount(), fs, getProfile(), path, updateProfile() (+8 more)

### Community 11 - "Community 11"
Cohesion: 0.12
Nodes (20): { checkAndUpdateTournamentStatuses, getTournamentRoundInfo, triggerDashboardUpdate }, cloudinary, crypto, fs, getMyTournaments(), getPublicTournamentById(), getPublicTournaments(), getTournamentById() (+12 more)

### Community 12 - "Community 12"
Cohesion: 0.17
Nodes (11): AdminPayments(), TournamentDetails(), SkeletonTournament(), MyTournaments(), adminOverridePayment(), getAdminPayments(), getRazorpayKey(), initiateRegistrationPayment() (+3 more)

### Community 13 - "Community 13"
Cohesion: 0.12
Nodes (12): AdminDashboard(), AdminSponsor(), AnalyticsDashboard(), SponsorshipChart(), getThemeFromPathname(), THEME_CONFIGS, ThreeBgCanvas(), TiltCard() (+4 more)

### Community 14 - "Community 14"
Cohesion: 0.15
Nodes (14): deleteNotification(), getNotifications(), markAsRead(), Notification, auth, express, {
  getNotifications,
  markAsRead,
  deleteNotification,
}, {
  markNotificationReadValidator,
  deleteNotificationValidator
} (+6 more)

### Community 15 - "Community 15"
Cohesion: 0.15
Nodes (14): validateDates(), validateDescription(), validateEmail(), validateName(), validateNumber(), validatePassword(), validateRules(), validateTournamentName() (+6 more)

### Community 16 - "Community 16"
Cohesion: 0.29
Nodes (4): MatchSchema, mongoose, Match, Tournament

### Community 17 - "Community 17"
Cohesion: 0.47
Nodes (5): dns, getDbNameFromUri(), maskUri(), mongoose, runMigration()

### Community 18 - "Community 18"
Cohesion: 0.12
Nodes (18): createSport(), deleteSport(), getSports(), Sport, updateSport(), mongoose, SportSchema, {
  createSport,
  getSports,
  updateSport,
  deleteSport,
} (+10 more)

### Community 19 - "Community 19"
Cohesion: 0.13
Nodes (17): createVenue(), deleteVenue(), getVenues(), updateVenue(), Venue, mongoose, VenueSchema, {
  createVenue,
  getVenues,
  updateVenue,
  deleteVenue,
} (+9 more)

### Community 20 - "Community 20"
Cohesion: 0.24
Nodes (6): validateDates(), validateDescription(), validateNumber(), validateRules(), validateTournamentName(), validateTournament()

### Community 21 - "Community 21"
Cohesion: 0.09
Nodes (26): adminOverridePayment(), createOrder(), crypto, getAllPaymentsAdmin(), getRazorpayKey(), getTransactions(), Razorpay, Registration (+18 more)

### Community 22 - "Community 22"
Cohesion: 0.18
Nodes (13): createUser(), deleteUser(), getPublicUsers(), getUsers(), updateUser(), User, auth, {
  createUserValidator,
  updateUserValidator,
  deleteUserValidator
} (+5 more)

### Community 23 - "Community 23"
Cohesion: 0.11
Nodes (17): ApprovePlayers(), MatchList(), Registrations(), Reports(), SponsorAccountManagement(), SportManagement(), TeamList(), TournamentList() (+9 more)

### Community 24 - "Community 24"
Cohesion: 0.14
Nodes (17): { body, param, query }, emailChain(), enumChain(), mongoose, nameChain(), passwordChain(), phoneChain(), {
  validateEmail,
  validatePassword,
  validateName,
} (+9 more)

### Community 25 - "Community 25"
Cohesion: 0.47
Nodes (3): SkeletonMatch(), MatchList(), Schedule()

### Community 26 - "Community 26"
Cohesion: 0.18
Nodes (9): { distributeTournamentPrizes }, getPrizeDistributionByTournament(), getPrizeDistributions(), PrizeDistribution, Sponsor, Team, Tournament, mongoose (+1 more)

### Community 27 - "Community 27"
Cohesion: 0.20
Nodes (10): manuallyDistributePrizes(), distributeTournamentPrizes(), distributeWithRetry(), mongoose, Notification, PrizeDistribution, Sponsor, Team (+2 more)

### Community 29 - "Community 29"
Cohesion: 0.25
Nodes (6): fs, multer, path, storage, upload, uploadDir

### Community 37 - "Community 37"
Cohesion: 0.14
Nodes (24): { checkAndUpdateTournamentStatuses }, getAnalyticsData(), getCoachDashboard(), getOrganizerDashboard(), getOrganizerStats(), getPlayerDashboard(), getRealtime(), getSponsorDashboard() (+16 more)

### Community 39 - "Community 39"
Cohesion: 0.13
Nodes (14): AdminProfile(), SkeletonProfile(), ProfileActivityTimeline(), ProfileHero(), ProfileInfoCard(), ProfileLayout(), ProfileQuickActions(), ProfileStatsCard() (+6 more)

## Knowledge Gaps
- **269 isolated node(s):** `THEME_CONFIGS`, `AuthContext`, `styles`, `images`, `OrganizerProfileContent` (+264 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `triggerDashboardUpdate()` connect `Community 3` to `Community 0`, `Community 7`, `Community 8`, `Community 11`, `Community 16`, `Community 21`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Why does `useAuth()` connect `Community 1` to `Community 4`, `Community 6`, `Community 39`, `Community 12`, `Community 13`, `Community 23`, `Community 30`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **Why does `requiredMongoIdChain()` connect `Community 14` to `Community 0`, `Community 2`, `Community 3`, `Community 7`, `Community 8`, `Community 9`, `Community 18`, `Community 19`, `Community 21`, `Community 24`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **What connects `THEME_CONFIGS`, `AuthContext`, `styles` to the rest of the system?**
  _269 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.060129509713228495 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.0649895178197065 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.14166666666666666 - nodes in this community are weakly interconnected._