# Graph Report - react-clg-tournament-main  (2026-07-04)

## Corpus Check
- 165 files · ~91,082 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 670 nodes · 1342 edges · 31 communities (28 shown, 3 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a49b7e32`
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
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 39|Community 39]]

## God Nodes (most connected - your core abstractions)
1. `useAuth()` - 60 edges
2. `api` - 34 edges
3. `triggerDashboardUpdate()` - 27 edges
4. `SkeletonTable()` - 17 edges
5. `checkAndUpdateTournamentStatuses()` - 16 edges
6. `Skeleton()` - 13 edges
7. `socket` - 9 edges
8. `SkeletonDashboard()` - 7 edges
9. `SkeletonStats()` - 7 edges
10. `checkAndReleaseExpiredRegistrations()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `AdminOrOrganizerRoute()` --calls--> `useAuth()`  [EXTRACTED]
  Fronted/src/App.jsx → Fronted/src/context/AuthContext.jsx
- `SponsorDashboardOrHome()` --calls--> `useAuth()`  [EXTRACTED]
  Fronted/src/App.jsx → Fronted/src/context/AuthContext.jsx
- `updateMatchResult()` --calls--> `distributeTournamentPrizes()`  [INFERRED]
  backend/controllers/matchController.js → backend/utils/prizeDistributionHelper.js
- `checkAndUpdateTournamentStatuses()` --calls--> `distributeTournamentPrizes()`  [INFERRED]
  backend/utils/tournamentHelper.js → backend/utils/prizeDistributionHelper.js
- `RoleLayout()` --calls--> `useAuth()`  [EXTRACTED]
  Fronted/src/layouts/RoleLayout.jsx → Fronted/src/context/AuthContext.jsx

## Import Cycles
- None detected.

## Communities (31 total, 3 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.13
Nodes (22): createMatch(), deleteMatch(), getCompletedMatches(), getMatchById(), getMatches(), getMatchesByTournament(), getPublicMatchesByTournament(), { getTournamentRoundInfo, triggerDashboardUpdate } (+14 more)

### Community 1 - "Community 1"
Cohesion: 0.07
Nodes (23): AddTeam(), AdminUsers(), CreateTournament(), EditTournament(), Matches(), AuthProvider(), RoleLayout(), AboutUs() (+15 more)

### Community 2 - "Community 2"
Cohesion: 0.14
Nodes (15): { distributeTournamentPrizes }, getPrizeDistributionByTournament(), getPrizeDistributions(), manuallyDistributePrizes(), PrizeDistribution, Sponsor, Team, Tournament (+7 more)

### Community 3 - "Community 3"
Cohesion: 0.09
Nodes (32): applyToTeam(), approvePlayer(), blockMembers(), checkAndReleaseExpiredPlayerApprovals(), createTeam(), crypto, deleteTeamByAdmin(), deleteTeamByCaptain() (+24 more)

### Community 4 - "Community 4"
Cohesion: 0.14
Nodes (19): AdminProfile(), AuthContext, useAuth(), AdminHeader(), CoachHeader(), OrganizerHeader(), PlayerHeader(), SponsorHeader() (+11 more)

### Community 5 - "Community 5"
Cohesion: 0.09
Nodes (28): nodemailer, sendRegistrationEmailOtp(), sendResetPasswordEmail(), sendVerificationEmail(), sendWelcomeEmail(), transporter, bcrypt, checkEmail() (+20 more)

### Community 6 - "Community 6"
Cohesion: 0.09
Nodes (16): AnalyticsDashboard(), getThemeFromPathname(), THEME_CONFIGS, ThreeBgCanvas(), AdminFooter(), CoachFooter(), GuestFooter(), OrganizerFooter() (+8 more)

### Community 7 - "Community 7"
Cohesion: 0.12
Nodes (28): acquireLock(), cancelRegistration(), checkAndReleaseExpiredRegistrations(), checkRegistration(), crypto, getAdminsAndOrganizer(), getAllRegistrations(), getMyRegistrations() (+20 more)

### Community 8 - "Community 8"
Cohesion: 0.10
Nodes (28): cloudinary, createSponsor(), crypto, deleteSponsor(), fs, getMySponsorships(), getPublicSponsors(), getPublicSponsorsByTournament() (+20 more)

### Community 10 - "Community 10"
Cohesion: 0.09
Nodes (20): bcrypt, changePassword(), cloudinary, deactivateAccount(), fs, getProfile(), path, updateProfile() (+12 more)

### Community 11 - "Community 11"
Cohesion: 0.14
Nodes (11): mongoose, PrizeDistributionSchema, mongoose, sponsorSchema, mongoose, Notification, PrizeDistribution, Sponsor (+3 more)

### Community 12 - "Community 12"
Cohesion: 0.15
Nodes (15): AdminPayments(), CreateTournamentUser(), MyRegistrations(), MyTeamDashboard(), MyTournaments(), TournamentDetails(), adminOverridePayment(), getAdminPayments() (+7 more)

### Community 13 - "Community 13"
Cohesion: 0.19
Nodes (6): AdminDashboard(), TiltCard(), SkeletonDashboard(), NonOrganizerRoute(), Home(), OrganizerDashboard()

### Community 14 - "Community 14"
Cohesion: 0.08
Nodes (26): deleteNotification(), getNotifications(), markAsRead(), Notification, createUser(), deleteUser(), getPublicUsers(), getUsers() (+18 more)

### Community 15 - "Community 15"
Cohesion: 0.15
Nodes (14): validateDates(), validateDescription(), validateEmail(), validateName(), validateNumber(), validatePassword(), validateRules(), validateTournamentName() (+6 more)

### Community 16 - "Community 16"
Cohesion: 0.20
Nodes (6): MatchSchema, mongoose, mongoose, TournamentSchema, Match, Tournament

### Community 17 - "Community 17"
Cohesion: 0.47
Nodes (5): dns, getDbNameFromUri(), maskUri(), mongoose, runMigration()

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
Cohesion: 0.10
Nodes (21): adminOverridePayment(), createOrder(), crypto, getAllPaymentsAdmin(), getRazorpayKey(), getTransactions(), Razorpay, Registration (+13 more)

### Community 22 - "Community 22"
Cohesion: 0.15
Nodes (12): app, { blockOrganizerJoin }, cors, express, { getSchedule }, http, io, mongoose (+4 more)

### Community 23 - "Community 23"
Cohesion: 0.07
Nodes (25): AdminSponsor(), ApprovePlayers(), MatchList(), Registrations(), Reports(), SponsorAccountManagement(), SponsorshipChart(), SportManagement() (+17 more)

### Community 27 - "Community 27"
Cohesion: 0.14
Nodes (6): ApprovePlayers(), styles, EditTeam(), Leaderboard(), cardStyle, Sponsors()

### Community 37 - "Community 37"
Cohesion: 0.06
Nodes (56): { checkAndUpdateTournamentStatuses }, getAnalyticsData(), getCoachDashboard(), getOrganizerDashboard(), getOrganizerStats(), getPlayerDashboard(), getRealtime(), getSponsorDashboard() (+48 more)

### Community 39 - "Community 39"
Cohesion: 0.13
Nodes (12): SkeletonProfile(), ProfileActivityTimeline(), ProfileHero(), ProfileInfoCard(), ProfileLayout(), ProfileQuickActions(), ProfileStatsCard(), ProfileTabs() (+4 more)

## Knowledge Gaps
- **219 isolated node(s):** `THEME_CONFIGS`, `AuthContext`, `styles`, `images`, `OrganizerProfileContent` (+214 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `triggerDashboardUpdate()` connect `Community 8` to `Community 0`, `Community 3`, `Community 37`, `Community 7`, `Community 16`, `Community 21`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Why does `useAuth()` connect `Community 4` to `Community 1`, `Community 6`, `Community 39`, `Community 9`, `Community 12`, `Community 13`, `Community 27`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Why does `api` connect `Community 4` to `Community 1`, `Community 39`, `Community 9`, `Community 12`, `Community 13`, `Community 23`, `Community 27`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **What connects `THEME_CONFIGS`, `AuthContext`, `styles` to the rest of the system?**
  _219 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.12681159420289856 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.06829268292682927 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.13725490196078433 - nodes in this community are weakly interconnected._