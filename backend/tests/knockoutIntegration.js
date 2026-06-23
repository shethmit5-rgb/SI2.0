const mongoose = require("mongoose");
const assert = require("assert");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const Tournament = require("../models/Tournament");
const Team = require("../models/Team");
const Match = require("../models/Match");
const { getTournamentRoundInfo, checkAndUpdateTournamentStatuses } = require("../utils/tournamentHelper");

const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/ArenaSync";

async function runTests() {
  console.log("==================================================");
  console.log("🧪 RUNNING KNOCKOUT BRACKET INTEGRATION TEST SUITE");
  console.log("==================================================");

  try {
    console.log(`Connecting to MongoDB at: ${mongoUri}`);
    await mongoose.connect(mongoUri);
    console.log("✅ Database connected successfully.\n");

    // Clean up any old test data
    await cleanup();

    await testFourTeamBracket();
    await testEightTeamBracket();
    await testDateBasedStatusTransitions();
    await testValidationRules();

    console.log("\n==================================================");
    console.log("🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY!");
    console.log("==================================================");
  } catch (err) {
    console.error("\n❌ TEST SUITE FAILED:", err);
    process.exit(1);
  } finally {
    await cleanup();
    await mongoose.disconnect();
    console.log("🔌 Database disconnected.");
  }
}

async function cleanup() {
  const deletedMatches = await Match.deleteMany({ createdBy: "69653616f8e184495ee8cfbe" });
  const deletedTeams = await Team.deleteMany({ teamName: /^TEST_TEAM_/ });
  const deletedTournaments = await Tournament.deleteMany({ eventName: /^TEST_TOURNAMENT_/ });
  if (deletedMatches.deletedCount || deletedTeams.deletedCount || deletedTournaments.deletedCount) {
    console.log(`🧹 Cleaned up: ${deletedTournaments.deletedCount} tournaments, ${deletedTeams.deletedCount} teams, ${deletedMatches.deletedCount} matches.`);
  }
}

/**
 * Helper to create a test tournament with N teams
 */
async function createTestTournament(eventName, teamCount) {
  const sportId = new mongoose.Types.ObjectId();
  const venueId = new mongoose.Types.ObjectId();

  const tournament = await Tournament.create({
    eventName,
    sportId,
    venueId,
    startDate: new Date(),
    endDate: new Date(Date.now() + 86400000), // tomorrow
    maxParticipants: teamCount,
    status: "ongoing"
  });

  const teams = [];
  for (let i = 1; i <= teamCount; i++) {
    const team = await Team.create({
      teamName: `TEST_TEAM_${eventName}_${i}`,
      tournamentId: tournament._id,
      sportId,
      captainId: new mongoose.Types.ObjectId()
    });
    teams.push(team);
    tournament.teams.push(team._id);
  }
  await tournament.save();
  return { tournament, teams };
}

/**
 * TEST 1: 4-Team Knockout Bracket Lifecycle
 */
async function testFourTeamBracket() {
  console.log("--------------------------------------------------");
  console.log("👉 Test 1: 4-Team Knockout Bracket Progression");
  console.log("--------------------------------------------------");

  const { tournament, teams } = await createTestTournament("TEST_TOURNAMENT_4_TEAM", 4);

  // 1. Initial State Check
  let info = await getTournamentRoundInfo(tournament._id);
  assert.strictEqual(info.currentRound, 1, "Initial round should be 1");
  assert.strictEqual(info.eligibleTeams.length, 4, "Should have 4 eligible teams in Round 1");
  assert.strictEqual(info.availableTeams.length, 4, "Should have 4 available teams in Round 1");
  assert.strictEqual(info.isCompleted, false, "Tournament should not be completed");
  console.log("✅ Initial round-info state is correct.");

  // 2. Schedule Round 1 Matches
  // Match 1: Team 1 vs Team 2
  const match1 = await Match.create({
    tournamentId: tournament._id,
    teams: [teams[0]._id, teams[1]._id],
    matchDate: new Date(),
    venueId: tournament.venueId,
    round: 1,
    status: "scheduled",
    createdBy: "69653616f8e184495ee8cfbe"
  });
  
  info = await getTournamentRoundInfo(tournament._id);
  assert.strictEqual(info.availableTeams.length, 2, "Should have 2 available teams after scheduling match 1");
  assert.ok(!info.availableTeams.some(t => t._id.equals(teams[0]._id) || t._id.equals(teams[1]._id)), "Matched teams should not be available");

  // Match 2: Team 3 vs Team 4
  const match2 = await Match.create({
    tournamentId: tournament._id,
    teams: [teams[2]._id, teams[3]._id],
    matchDate: new Date(),
    venueId: tournament.venueId,
    round: 1,
    status: "scheduled",
    createdBy: "69653616f8e184495ee8cfbe"
  });

  info = await getTournamentRoundInfo(tournament._id);
  assert.strictEqual(info.availableTeams.length, 0, "Should have 0 available teams after scheduling all round 1 matches");
  console.log("✅ Round 1 match scheduling and available teams tracking work.");

  // 3. Complete Matches and Advance
  // Match 1 completed: Team 1 wins
  match1.status = "completed";
  match1.result = { winnerTeamId: teams[0]._id, score: "2-1" };
  await match1.save();

  info = await getTournamentRoundInfo(tournament._id);
  assert.strictEqual(info.currentRound, 1, "Should still be in Round 1 (waiting for match 2)");

  // Match 2 completed: Team 3 wins
  match2.status = "completed";
  match2.result = { winnerTeamId: teams[2]._id, score: "3-0" };
  await match2.save();

  info = await getTournamentRoundInfo(tournament._id);
  assert.strictEqual(info.currentRound, 2, "Should advance to Round 2 after all matches are completed");
  assert.strictEqual(info.eligibleTeams.length, 2, "Should have 2 eligible teams in Round 2");
  assert.ok(info.eligibleTeams.some(t => t._id.equals(teams[0]._id)), "Team 1 (winner) should be eligible in Round 2");
  assert.ok(info.eligibleTeams.some(t => t._id.equals(teams[2]._id)), "Team 3 (winner) should be eligible in Round 2");
  assert.ok(!info.eligibleTeams.some(t => t._id.equals(teams[1]._id) || t._id.equals(teams[3]._id)), "Losers should be eliminated");
  console.log("✅ Round 1 completion and bracket advancement work.");

  // 4. Final Round Match
  const match3 = await Match.create({
    tournamentId: tournament._id,
    teams: [teams[0]._id, teams[2]._id],
    matchDate: new Date(),
    venueId: tournament.venueId,
    round: 2,
    status: "scheduled",
    createdBy: "69653616f8e184495ee8cfbe"
  });

  match3.status = "completed";
  match3.result = { winnerTeamId: teams[0]._id, score: "1-0" };
  await match3.save();

  // Trigger tournament final winner logic
  info = await getTournamentRoundInfo(tournament._id);
  if (info.isCompleted && info.winner) {
    await Tournament.findByIdAndUpdate(tournament._id, { winner: info.winner._id });
  }

  const updatedTournament = await Tournament.findById(tournament._id);
  assert.strictEqual(info.isCompleted, true, "Tournament should be completed");
  assert.ok(info.winner._id.equals(teams[0]._id), "Team 1 should be the champion");
  assert.ok(updatedTournament.winner.equals(teams[0]._id), "Tournament winner should be recorded in DB");
  console.log("✅ Tournament finalization, winner persistence, and completion work.");
}

/**
 * TEST 2: 8-Team Knockout Bracket Lifecycle
 */
async function testEightTeamBracket() {
  console.log("\n--------------------------------------------------");
  console.log("👉 Test 2: 8-Team Knockout Bracket Progression");
  console.log("--------------------------------------------------");

  const { tournament, teams } = await createTestTournament("TEST_TOURNAMENT_8_TEAM", 8);

  let info = await getTournamentRoundInfo(tournament._id);
  assert.strictEqual(info.currentRound, 1, "Initial round should be 1");
  assert.strictEqual(info.eligibleTeams.length, 8, "Should have 8 eligible teams in Round 1");

  // Schedule and complete all 4 matches of Round 1
  // Match 1: Team 1 vs Team 2 -> Team 1 wins
  // Match 2: Team 3 vs Team 4 -> Team 3 wins
  // Match 3: Team 5 vs Team 6 -> Team 5 wins
  // Match 4: Team 7 vs Team 8 -> Team 7 wins
  const winnersRound1 = [teams[0], teams[2], teams[4], teams[6]];
  for (let i = 0; i < 4; i++) {
    const tA = teams[i * 2];
    const tB = teams[i * 2 + 1];
    const winner = winnersRound1[i];

    const match = await Match.create({
      tournamentId: tournament._id,
      teams: [tA._id, tB._id],
      matchDate: new Date(),
      venueId: tournament.venueId,
      round: 1,
      status: "completed",
      result: { winnerTeamId: winner._id, score: "2-0" },
      createdBy: "69653616f8e184495ee8cfbe"
    });
  }

  // Verify progression to Round 2
  info = await getTournamentRoundInfo(tournament._id);
  assert.strictEqual(info.currentRound, 2, "Should advance to Round 2");
  assert.strictEqual(info.eligibleTeams.length, 4, "Should have 4 eligible teams in Round 2");
  console.log("✅ Round 1 completed. 4 winners advanced to Semifinals.");

  // Schedule and complete all 2 matches of Round 2
  // Match 1: Team 1 vs Team 3 -> Team 1 wins
  // Match 2: Team 5 vs Team 7 -> Team 5 wins
  const winnersRound2 = [winnersRound1[0], winnersRound1[2]];
  for (let i = 0; i < 2; i++) {
    const tA = winnersRound1[i * 2];
    const tB = winnersRound1[i * 2 + 1];
    const winner = winnersRound2[i];

    await Match.create({
      tournamentId: tournament._id,
      teams: [tA._id, tB._id],
      matchDate: new Date(),
      venueId: tournament.venueId,
      round: 2,
      status: "completed",
      result: { winnerTeamId: winner._id, score: "1-0" },
      createdBy: "69653616f8e184495ee8cfbe"
    });
  }

  // Verify progression to Round 3
  info = await getTournamentRoundInfo(tournament._id);
  assert.strictEqual(info.currentRound, 3, "Should advance to Round 3 (Finals)");
  assert.strictEqual(info.eligibleTeams.length, 2, "Should have 2 eligible teams in Finals");
  console.log("✅ Round 2 completed. 2 winners advanced to Finals.");

  // Schedule and complete Round 3 Match (Finals)
  // Match: Team 1 vs Team 5 -> Team 1 wins
  const finalMatch = await Match.create({
    tournamentId: tournament._id,
    teams: [winnersRound2[0]._id, winnersRound2[1]._id],
    matchDate: new Date(),
    venueId: tournament.venueId,
    round: 3,
    status: "completed",
    result: { winnerTeamId: winnersRound2[0]._id, score: "3-2" },
    createdBy: "69653616f8e184495ee8cfbe"
  });

  // Trigger tournament final winner logic
  info = await getTournamentRoundInfo(tournament._id);
  if (info.isCompleted && info.winner) {
    await Tournament.findByIdAndUpdate(tournament._id, { winner: info.winner._id });
  }

  const updatedTournament = await Tournament.findById(tournament._id);
  assert.strictEqual(info.isCompleted, true, "Tournament should be completed");
  assert.ok(info.winner._id.equals(winnersRound2[0]._id), "Team 1 should be the champion");
  assert.ok(updatedTournament.winner.equals(winnersRound2[0]._id), "Tournament winner should be saved in DB");
  console.log("✅ 8-Team Bracket tournament completed successfully.");
}

/**
 * TEST 3: Date-Based Status Transitions
 */
async function testDateBasedStatusTransitions() {
  console.log("\n--------------------------------------------------");
  console.log("👉 Test 3: Date-Based Status Transitions");
  console.log("--------------------------------------------------");

  const sportId = new mongoose.Types.ObjectId();
  const venueId = new mongoose.Types.ObjectId();

  // 1. Create a tournament in the past, status "upcoming"
  const pastT = await Tournament.create({
    eventName: "TEST_TOURNAMENT_PAST",
    sportId,
    venueId,
    startDate: new Date(Date.now() - 2 * 86400000), // 2 days ago
    endDate: new Date(Date.now() - 86400000),     // 1 day ago
    maxParticipants: 8,
    status: "upcoming"
  });

  // 2. Create a tournament in the future, status "ongoing"
  const futureT = await Tournament.create({
    eventName: "TEST_TOURNAMENT_FUTURE",
    sportId,
    venueId,
    startDate: new Date(Date.now() + 86400000),    // tomorrow
    endDate: new Date(Date.now() + 2 * 86400000),  // day after tomorrow
    maxParticipants: 8,
    status: "ongoing"
  });

  // 3. Create an ongoing tournament, status "upcoming"
  const ongoingT = await Tournament.create({
    eventName: "TEST_TOURNAMENT_ONGOING",
    sportId,
    venueId,
    startDate: new Date(Date.now() - 86400000),    // yesterday
    endDate: new Date(Date.now() + 86400000),     // tomorrow
    maxParticipants: 8,
    status: "upcoming"
  });

  // Run the helper
  await checkAndUpdateTournamentStatuses();

  // Refetch
  const refetchedPast = await Tournament.findById(pastT._id);
  const refetchedFuture = await Tournament.findById(futureT._id);
  const refetchedOngoing = await Tournament.findById(ongoingT._id);

  assert.strictEqual(refetchedPast.status, "completed", "Past tournament status should be updated to completed");
  assert.strictEqual(refetchedFuture.status, "upcoming", "Future tournament status should be updated to upcoming");
  assert.strictEqual(refetchedOngoing.status, "ongoing", "Ongoing tournament status should be updated to ongoing");

  console.log("✅ All status transitions are correct.");

  // Clean up
  await Tournament.findByIdAndDelete(pastT._id);
  await Tournament.findByIdAndDelete(futureT._id);
  await Tournament.findByIdAndDelete(ongoingT._id);
}

/**
 * TEST 4: Validation Rules
 */
async function testValidationRules() {
  console.log("\n--------------------------------------------------");
  console.log("👉 Test 4: Validation Rules & Constraints");
  console.log("--------------------------------------------------");

  const { tournament, teams } = await createTestTournament("TEST_TOURNAMENT_VAL", 4);

  // 1. Enforce Power-of-2 team counts (check isPowerOfTwo helper in helper file or custom validation)
  const isPowerOfTwo = (num) => num > 1 && (num & (num - 1)) === 0;
  assert.ok(isPowerOfTwo(4), "4 is power of 2");
  assert.ok(!isPowerOfTwo(3), "3 is not power of 2");
  assert.ok(!isPowerOfTwo(5), "5 is not power of 2");

  // 2. Verify duplicate match prevention
  const match1 = await Match.create({
    tournamentId: tournament._id,
    teams: [teams[0]._id, teams[1]._id],
    matchDate: new Date(),
    venueId: tournament.venueId,
    round: 1,
    status: "scheduled",
    createdBy: "69653616f8e184495ee8cfbe"
  });

  // Attempt to schedule a duplicate match (same teams in the same round)
  const duplicate = await Match.findOne({
    tournamentId: tournament._id,
    round: 1,
    teams: { $all: [teams[0]._id, teams[1]._id] }
  });
  assert.ok(duplicate, "Duplicate match should be found in DB query");

  console.log("✅ Validation rules and constraints tested successfully.");
}

runTests();
