# Graph Report - react-clg-tournament-main  (2026-07-07)

## Corpus Check
- 180 files · ~93,207 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 809 nodes · 1611 edges · 34 communities (30 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `23480d3a`
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
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 39|Community 39]]

## God Nodes (most connected - your core abstractions)
1. `useAuth()` - 60 edges
2. `api` - 34 edges
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
- `AdminHeader()` --calls--> `useAuth()`  [EXTRACTED]
  Fronted/src/component/headers/AdminHeader.jsx → Fronted/src/context/AuthContext.jsx

## Import Cycles
- None detected.

## Communities (34 total, 4 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (44): app, { blockOrganizerJoin }, cors, express, { getSchedule }, http, io, mongoose (+36 more)

### Community 1 - "Community 1"
Cohesion: 0.05
Nodes (30): AddTeam(), AdminUsers(), ApprovePlayers(), CreateTournament(), EditTournament(), Matches(), MatchList(), Registrations() (+22 more)

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (35): { distributeTournamentPrizes }, getPrizeDistributionByTournament(), getPrizeDistributions(), manuallyDistributePrizes(), PrizeDistribution, Sponsor, Team, Tournament (+27 more)

### Community 3 - "Community 3"
Cohesion: 0.06
Nodes (53): applyToTeam(), approvePlayer(), blockMembers(), checkAndReleaseExpiredPlayerApprovals(), createTeam(), crypto, deleteTeamByAdmin(), deleteTeamByCaptain() (+45 more)

### Community 4 - "Community 4"
Cohesion: 0.10
Nodes (24): AdminProfile(), AuthContext, useAuth(), SkeletonForm(), SkeletonTeam(), AdminRoute(), ApprovePlayers(), styles (+16 more)

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
Cohesion: 0.11
Nodes (21): createTournament(), getMatchesByTournament(), getRoundInfo(), mongoose, auth, {
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
}, express (+13 more)

### Community 10 - "Community 10"
Cohesion: 0.07
Nodes (26): bcrypt, changePassword(), cloudinary, deactivateAccount(), fs, getProfile(), path, updateProfile() (+18 more)

### Community 11 - "Community 11"
Cohesion: 0.12
Nodes (20): { checkAndUpdateTournamentStatuses, getTournamentRoundInfo, triggerDashboardUpdate }, cloudinary, crypto, fs, getMyTournaments(), getPublicTournamentById(), getPublicTournaments(), getTournamentById() (+12 more)

### Community 12 - "Community 12"
Cohesion: 0.14
Nodes (16): AdminPayments(), SkeletonChart(), CreateTournamentUser(), MyRegistrations(), MyTeamDashboard(), MyTournaments(), TournamentDetails(), adminOverridePayment() (+8 more)

### Community 13 - "Community 13"
Cohesion: 0.14
Nodes (9): AdminDashboard(), AnalyticsDashboard(), getThemeFromPathname(), THEME_CONFIGS, ThreeBgCanvas(), TiltCard(), SkeletonDashboard(), NonOrganizerRoute() (+1 more)

### Community 14 - "Community 14"
Cohesion: 0.11
Nodes (17): deleteNotification(), getNotifications(), markAsRead(), Notification, jwt, mongoose, NotificationSchema, auth (+9 more)

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
Cohesion: 0.13
Nodes (17): createSport(), deleteSport(), getSports(), Sport, updateSport(), { validationResult }, {
  createSport,
  getSports,
  updateSport,
  deleteSport,
}, {
  createSportValidator,
  updateSportValidator,
  deleteSportValidator
} (+9 more)

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
Cohesion: 0.13
Nodes (18): createUser(), deleteUser(), getPublicUsers(), getUsers(), updateUser(), User, auth, {
  createUserValidator,
  updateUserValidator,
  deleteUserValidator
} (+10 more)

### Community 23 - "Community 23"
Cohesion: 0.21
Nodes (8): TournamentDetails(), Skeleton(), SkeletonAvatar(), SkeletonCard(), SkeletonList(), SkeletonStats(), SkeletonTable(), SkeletonTournament()

### Community 24 - "Community 24"
Cohesion: 0.23
Nodes (10): { body, param, query }, emailChain(), enumChain(), mongoose, nameChain(), passwordChain(), phoneChain(), {
  validateEmail,
  validatePassword,
  validateName,
} (+2 more)

### Community 25 - "Community 25"
Cohesion: 0.47
Nodes (3): SkeletonMatch(), MatchList(), Schedule()

### Community 37 - "Community 37"
Cohesion: 0.14
Nodes (24): { checkAndUpdateTournamentStatuses }, getAnalyticsData(), getCoachDashboard(), getOrganizerDashboard(), getOrganizerStats(), getPlayerDashboard(), getRealtime(), getSponsorDashboard() (+16 more)

### Community 39 - "Community 39"
Cohesion: 0.12
Nodes (13): SkeletonProfile(), ProfileActivityTimeline(), ProfileHero(), ProfileInfoCard(), ProfileLayout(), ProfileQuickActions(), ProfileStatsCard(), ProfileTabs() (+5 more)

## Knowledge Gaps
- **269 isolated node(s):** `THEME_CONFIGS`, `AuthContext`, `styles`, `images`, `OrganizerProfileContent` (+264 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `triggerDashboardUpdate()` connect `Community 3` to `Community 0`, `Community 7`, `Community 8`, `Community 11`, `Community 16`, `Community 21`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Why does `useAuth()` connect `Community 4` to `Community 1`, `Community 6`, `Community 39`, `Community 12`, `Community 13`, `Community 23`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **Why does `requiredMongoIdChain()` connect `Community 14` to `Community 0`, `Community 2`, `Community 3`, `Community 7`, `Community 8`, `Community 9`, `Community 18`, `Community 19`, `Community 21`, `Community 22`, `Community 24`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **What connects `THEME_CONFIGS`, `AuthContext`, `styles` to the rest of the system?**
  _269 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.05851063829787234 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.05297532656023222 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.059800664451827246 - nodes in this community are weakly interconnected._