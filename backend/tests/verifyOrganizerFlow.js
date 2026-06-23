const axios = require("c:/Users/mitsh/Desktop/project/rasume/SI/react-clg-tournament-main/react-clg-tournament-main/backend/node_modules/axios");
const jwt = require("c:/Users/mitsh/Desktop/project/rasume/SI/react-clg-tournament-main/react-clg-tournament-main/backend/node_modules/jsonwebtoken");
const mongoose = require("c:/Users/mitsh/Desktop/project/rasume/SI/react-clg-tournament-main/react-clg-tournament-main/backend/node_modules/mongoose");

const mongoUri = "mongodb://localhost:27017/ArenaSync";
const jwtSecret = "my_super_secret";
const baseUrl = "http://localhost:5000/api";

const mitId = "6a0986903e64d4411066cb6d";
const rajId = "6a0985eb3e64d4411066cb02";

const mitToken = jwt.sign({ userId: mitId, role: "organizer" }, jwtSecret, { expiresIn: "1h" });
const rajToken = jwt.sign({ userId: rajId, role: "organizer" }, jwtSecret, { expiresIn: "1h" });

const mitHeaders = { headers: { Authorization: `Bearer ${mitToken}` } };
const rajHeaders = { headers: { Authorization: `Bearer ${rajToken}` } };

async function runTest() {
  console.log("==================================================");
  console.log("🧪 RUNNING COMPREHENSIVE ORGANIZER FLOW VALIDATION");
  console.log("==================================================");

  try {
    // 1. GET /my-tournaments for Mit
    console.log("\n👉 Test 1: GET /my-tournaments for Mit");
    const mitToursRes = await axios.get(`${baseUrl}/tournaments/my-tournaments`, mitHeaders);
    const mitTourNames = mitToursRes.data.map(t => t.eventName);
    console.log("Mit's Tournaments:", mitTourNames);
    const hasCCL = mitTourNames.includes("Champions Cricket League");
    const hasUFC = mitTourNames.includes("Ultimate Football Cup");
    const hasBT = mitTourNames.includes("Basketball Titans");
    const hasTM = mitTourNames.includes("Tennis Masters");
    
    console.log(`- Champions Cricket League (Created by Mit): ${hasCCL} (Expected: true)`);
    console.log(`- Ultimate Football Cup (Created by Admin, Assigned to Mit): ${hasUFC} (Expected: true)`);
    console.log(`- Basketball Titans (Created by Raj): ${hasBT} (Expected: false)`);
    console.log(`- Tennis Masters (Created by Admin, Assigned to Raj): ${hasTM} (Expected: false)`);

    if (hasCCL && hasUFC && !hasBT && !hasTM) {
      console.log("✅ Test 1 PASSED: Mit sees exactly the union of tournaments created by or assigned to him.");
    } else {
      throw new Error("Test 1 FAILED: Incorrect tournaments returned for Mit.");
    }

    // 2. GET /my-tournaments for Raj
    console.log("\n👉 Test 2: GET /my-tournaments for Raj");
    const rajToursRes = await axios.get(`${baseUrl}/tournaments/my-tournaments`, rajHeaders);
    const rajTourNames = rajToursRes.data.map(t => t.eventName);
    console.log("Raj's Tournaments:", rajTourNames);
    const rajHasCCL = rajTourNames.includes("Champions Cricket League");
    const rajHasUFC = rajTourNames.includes("Ultimate Football Cup");
    const rajHasBT = rajTourNames.includes("Basketball Titans");
    const rajHasTM = rajTourNames.includes("Tennis Masters");
    
    console.log(`- Champions Cricket League (Created by Mit): ${rajHasCCL} (Expected: false)`);
    console.log(`- Ultimate Football Cup (Created by Admin, Assigned to Mit): ${rajHasUFC} (Expected: false)`);
    console.log(`- Basketball Titans (Created by Raj): ${rajHasBT} (Expected: true)`);
    console.log(`- Tennis Masters (Created by Admin, Assigned to Raj): ${rajHasTM} (Expected: true)`);

    if (!rajHasCCL && !rajHasUFC && rajHasBT && rajHasTM) {
      console.log("✅ Test 2 PASSED: Raj sees exactly the union of tournaments created by or assigned to him.");
    } else {
      throw new Error("Test 2 FAILED: Incorrect tournaments returned for Raj.");
    }

    // 3. Round Info access controls
    console.log("\n👉 Test 3: GET /:id/round-info Access Controls");
    
    // Mit attempts to fetch round-info for Champions Cricket League (Allowed)
    try {
      const res = await axios.get(`${baseUrl}/tournaments/69ee10000000000000000001/round-info`, mitHeaders);
      console.log("- Mit fetching Champions Cricket League round-info: Allowed ✅");
    } catch (err) {
      console.error("- Mit fetching Champions Cricket League round-info failed:", err.response?.data || err.message);
      throw new Error("Mit should be allowed to view round-info of his own tournament");
    }

    // Mit attempts to fetch round-info for Basketball Titans (Denied)
    try {
      await axios.get(`${baseUrl}/tournaments/69ee10000000000000000003/round-info`, mitHeaders);
      throw new Error("Mit should be blocked from viewing round-info of Raj's tournament");
    } catch (err) {
      if (err.response?.status === 403) {
        console.log("- Mit fetching Basketball Titans round-info: Blocked with 403 (Expected) ✅");
      } else {
        console.error("- Mit fetching Basketball Titans round-info returned incorrect status:", err.response?.status);
        throw err;
      }
    }

    // 4. Update Tournament access controls
    console.log("\n👉 Test 4: PUT /:id (Update Tournament) Access Controls");
    
    // Mit attempts to update Champions Cricket League (Allowed)
    try {
      const res = await axios.put(`${baseUrl}/tournaments/69ee10000000000000000001`, {
        description: "Updated description by Mit"
      }, mitHeaders);
      console.log("- Mit updating Champions Cricket League: Allowed ✅");
    } catch (err) {
      console.error("- Mit updating Champions Cricket League failed:", err.response?.data || err.message);
      throw new Error("Mit should be allowed to update his own tournament");
    }

    // Mit attempts to update Basketball Titans (Denied)
    try {
      await axios.put(`${baseUrl}/tournaments/69ee10000000000000000003`, {
        description: "Hacked description"
      }, mitHeaders);
      throw new Error("Mit should be blocked from updating Raj's tournament");
    } catch (err) {
      if (err.response?.status === 403) {
        console.log("- Mit updating Basketball Titans: Blocked with 403 (Expected) ✅");
      } else {
        console.error("- Mit updating Basketball Titans returned incorrect status:", err.response?.status);
        throw err;
      }
    }

    // 5. GET /api/matches filtering
    console.log("\n👉 Test 5: GET /api/matches Filtering for Organizers");
    
    // Seed a match for Champions Cricket League (Mit) if not exist
    await mongoose.connect(mongoUri);
    const Match = require("c:/Users/mitsh/Desktop/project/rasume/SI/react-clg-tournament-main/react-clg-tournament-main/backend/models/Match");
    
    // Clear old test matches
    await Match.deleteMany({ tournamentId: { $in: ["69ee10000000000000000001", "69ee10000000000000000003"] } });
    
    // Create one match for Mit's tournament and one for Raj's tournament
    const matchMit = await Match.create({
      tournamentId: "69ee10000000000000000001",
      teams: [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()],
      matchDate: new Date(),
      venueId: new mongoose.Types.ObjectId(),
      status: "scheduled",
      round: 1
    });
    
    const matchRaj = await Match.create({
      tournamentId: "69ee10000000000000000003",
      teams: [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()],
      matchDate: new Date(),
      venueId: new mongoose.Types.ObjectId(),
      status: "scheduled",
      round: 1
    });
    await mongoose.disconnect();
    
    // Fetch as Mit
    const mitMatchesRes = await axios.get(`${baseUrl}/matches`, mitHeaders);
    const mitMatchIds = mitMatchesRes.data.map(m => m._id.toString());
    console.log(`- Mit fetched matches count: ${mitMatchIds.length}`);
    const containsMitMatch = mitMatchIds.includes(matchMit._id.toString());
    const containsRajMatch = mitMatchIds.includes(matchRaj._id.toString());
    console.log(`  Contains Mit's tournament match: ${containsMitMatch} (Expected: true)`);
    console.log(`  Contains Raj's tournament match: ${containsRajMatch} (Expected: false)`);
    
    if (containsMitMatch && !containsRajMatch) {
      console.log("✅ Test 5 PASSED: Match list filter is correct for Mit.");
    } else {
      throw new Error("Test 5 FAILED: Match list contains matches from unauthorized tournaments.");
    }

    // 6. Match result update access controls
    console.log("\n👉 Test 6: PUT /api/matches/:id/result Access Controls");
    
    // Mit attempts to update result of matchMit (Allowed)
    try {
      await axios.put(`${baseUrl}/matches/${matchMit._id}/result`, {
        winnerTeamId: matchMit.teams[0],
        score: "3-2",
        status: "completed"
      }, mitHeaders);
      console.log("- Mit updating own match result: Allowed ✅");
    } catch (err) {
      console.error("- Mit updating own match result failed:", err.response?.data || err.message);
      throw new Error("Mit should be allowed to update match results for his own tournament");
    }

    // Mit attempts to update result of matchRaj (Denied)
    try {
      await axios.put(`${baseUrl}/matches/${matchRaj._id}/result`, {
        winnerTeamId: matchRaj.teams[0],
        score: "5-0",
        status: "completed"
      }, mitHeaders);
      throw new Error("Mit should be blocked from updating match results for Raj's tournament");
    } catch (err) {
      if (err.response?.status === 403) {
        console.log("- Mit updating Raj's match result: Blocked with 403 (Expected) ✅");
      } else {
        console.error("- Mit updating Raj's match result returned incorrect status:", err.response?.status);
        throw err;
      }
    }

    // Clean up created matches
    await mongoose.connect(mongoUri);
    await Match.deleteMany({ _id: { $in: [matchMit._id, matchRaj._id] } });
    await mongoose.disconnect();
    
    console.log("\n==================================================");
    console.log("🎉 ALL FLOW AND PERMISSION VERIFICATIONS PASSED!");
    console.log("==================================================");

  } catch (error) {
    console.error("\n❌ VALIDATION ERROR:", error.message);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
}

runTest();
