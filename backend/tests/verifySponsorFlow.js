const axios = require("axios");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const mongoUri = "mongodb://127.0.0.1:27017/ArenaSync";
const jwtSecret = "my_super_secret";
const baseUrl = "http://127.0.0.1:5000/api";

async function runTest() {
  console.log("==================================================");
  console.log("🧪 RUNNING COMPREHENSIVE SPONSOR FLOW VALIDATION");
  console.log("==================================================");

  try {
    // Connect to database
    console.log("Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("Connected successfully to MongoDB.");

    const User = require("../models/User");
    const Sponsor = require("../models/Sponsor");
    const Tournament = require("../models/Tournament");

    // Clean up old test data
    console.log("Cleaning up old test data...");
    await User.deleteMany({ email: "test_sponsor@gmail.com" });
    await Sponsor.deleteMany({ name: { $in: ["Nike Test Brand", "Adidas Test Brand"] } });
    await Tournament.deleteMany({ eventName: { $in: ["Sponsor Test League", "Past Test Cup"] } });

    // 1. Test registration block status
    console.log("\n👉 Test 1: Register pending sponsor account and verify login block");
    const hashedPassword = await bcrypt.hash("Password123!", 10);
    const sponsorUser = await User.create({
      name: "Nike Sponsor User",
      email: "test_sponsor@gmail.com",
      phoneNumber: "+918888888888",
      password: hashedPassword,
      role: "sponsor",
      status: "Pending Approval",
      isPhoneVerified: true
    });
    console.log("- Sponsor created with status: 'Pending Approval' ✅");

    // Attempt login
    try {
      await axios.post(`${baseUrl}/login`, {
        email: "test_sponsor@gmail.com",
        password: "Password123!"
      });
      throw new Error("Login should have failed for Pending Approval status.");
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.message === "Your Sponsor account is awaiting Admin approval.") {
        console.log("- Login blocked with 403 'Your Sponsor account is awaiting Admin approval.' (Expected) ✅");
      } else {
        console.error("Incorrect login response:", err.response?.status, err.response?.data);
        throw err;
      }
    }

    // 2. Test Login after admin approval
    console.log("\n👉 Test 2: Approve sponsor and verify login success");
    sponsorUser.status = "active";
    await sponsorUser.save();
    console.log("- Sponsor status updated to 'active' ✅");

    const loginRes = await axios.post(`${baseUrl}/login`, {
      email: "test_sponsor@gmail.com",
      password: "Password123!"
    });

    if (loginRes.data.success && loginRes.data.token) {
      console.log("- Login succeeded and returned token ✅");
    } else {
      throw new Error("Login failed for active sponsor user.");
    }

    const sponsorToken = loginRes.data.token;
    const sponsorHeaders = { headers: { Authorization: `Bearer ${sponsorToken}` } };

    // 3. Test self-sponsorship restrictions & order creation
    console.log("\n👉 Test 3: Test self-sponsor date and duplicate title sponsor rules");
    
    // Create an upcoming tournament (starts tomorrow) and a past tournament (started yesterday)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const upcomingTour = await Tournament.create({
      eventName: "Sponsor Test League",
      sportId: new mongoose.Types.ObjectId(),
      venueId: new mongoose.Types.ObjectId(),
      startDate: tomorrow,
      endDate: new Date(tomorrow.getTime() + 86400000),
      location: "Test Venue",
      status: "upcoming",
      prizePool: 0
    });

    const pastTour = await Tournament.create({
      eventName: "Past Test Cup",
      sportId: new mongoose.Types.ObjectId(),
      venueId: new mongoose.Types.ObjectId(),
      startDate: yesterday,
      endDate: new Date(yesterday.getTime() + 86400000),
      location: "Test Venue",
      status: "upcoming",
      prizePool: 0
    });

    console.log("- Created test tournaments: upcoming and past start date ✅");

    // Test Date Restriction: attempt to sponsor a tournament that has already started
    try {
      await axios.post(`${baseUrl}/sponsors/self-sponsor`, {
        brandName: "Nike Test Brand",
        tournamentId: pastTour._id,
        type: "title",
        winnerPrize: 100000,
        runnerUpPrize: 50000
      }, sponsorHeaders);
      throw new Error("Sponsorship should be closed for past tournaments.");
    } catch (err) {
      if (err.response?.status === 400 && err.response?.data?.message.includes("tournament has already started")) {
        console.log("- Sponsoring past tournament correctly blocked with message: 'Sponsorship is closed because the tournament has already started.' ✅");
      } else {
        console.error("Incorrect date check response:", err.response?.status, err.response?.data);
        throw err;
      }
    }

    // Test duplicate Title Sponsor protection
    console.log("\n👉 Test 4: Verify duplicate Title Sponsor protection");
    
    // Create an active Title Sponsor directly in DB for upcomingTour
    const activeTitleSponsor = await Sponsor.create({
      name: "Nike Test Brand",
      amount: 150000,
      tournamentId: upcomingTour._id,
      sponsorId: sponsorUser._id,
      type: "title",
      winnerPrize: 100000,
      runnerUpPrize: 50000,
      status: "active"
    });
    console.log("- Active Title Sponsor inserted directly in DB ✅");

    // Try to create another title sponsor (should be blocked by backend check)
    try {
      await axios.post(`${baseUrl}/sponsors/self-sponsor`, {
        brandName: "Adidas Test Brand",
        tournamentId: upcomingTour._id,
        type: "title",
        winnerPrize: 120000,
        runnerUpPrize: 60000
      }, sponsorHeaders);
      throw new Error("Should block duplicate Title Sponsorship request.");
    } catch (err) {
      if (err.response?.status === 400 && err.response?.data?.message === "This tournament already has a Title Sponsor.") {
        console.log("- Duplicate Title Sponsor correctly blocked with: 'This tournament already has a Title Sponsor.' ✅");
      } else {
        console.error("Incorrect duplicate title check response:", err.response?.status, err.response?.data);
        throw err;
      }
    }

    // Test duplicate pending request by same sponsor
    // Delete the active sponsor and insert a pending request instead
    await Sponsor.deleteOne({ _id: activeTitleSponsor._id });
    await Sponsor.create({
      name: "Nike Test Brand",
      amount: 150000,
      tournamentId: upcomingTour._id,
      sponsorId: sponsorUser._id,
      type: "title",
      winnerPrize: 100000,
      runnerUpPrize: 50000,
      status: "pending"
    });
    console.log("- Pending Title Sponsor request by the same sponsor inserted ✅");

    try {
      await axios.post(`${baseUrl}/sponsors/self-sponsor`, {
        brandName: "Nike Test Brand",
        tournamentId: upcomingTour._id,
        type: "title",
        winnerPrize: 100000,
        runnerUpPrize: 50000
      }, sponsorHeaders);
      throw new Error("Should block duplicate pending Title Sponsorship request by the same sponsor.");
    } catch (err) {
      if (err.response?.status === 400 && err.response?.data?.message === "You already have a pending Title Sponsor request for this tournament.") {
        console.log("- Duplicate pending Title Sponsor request correctly blocked with: 'You already have a pending Title Sponsor request for this tournament.' ✅");
      } else {
        console.error("Incorrect pending request check response:", err.response?.status, err.response?.data);
        throw err;
      }
    }

    // 4. Test In-Kind unique equipment rules
    console.log("\n👉 Test 5: Test In-Kind equipment unique category rule");
    
    // Clear pending sponsor
    await Sponsor.deleteMany({ tournamentId: upcomingTour._id });
    
    // Create an active In-Kind sponsor sponsoring "Jerseys"
    await Sponsor.create({
      name: "Nike Test Brand",
      amount: 40000,
      tournamentId: upcomingTour._id,
      sponsorId: sponsorUser._id,
      type: "inkind",
      equipment: "Jerseys",
      status: "active"
    });
    console.log("- Active In-Kind Sponsor for 'Jerseys' inserted directly ✅");

    // Sponsoring same equipment should fail
    try {
      await axios.post(`${baseUrl}/sponsors/self-sponsor`, {
        brandName: "Nike Test Brand",
        tournamentId: upcomingTour._id,
        type: "inkind",
        equipment: "Jerseys",
        amount: 30000
      }, sponsorHeaders);
      throw new Error("Should block sponsoring same equipment category.");
    } catch (err) {
      if (err.response?.status === 400 && err.response?.data?.message === "You are already sponsoring this equipment category for this tournament.") {
        console.log("- Sponsoring same equipment correctly blocked with: 'You are already sponsoring this equipment category for this tournament.' ✅");
      } else {
        console.error("Incorrect equipment check response:", err.response?.status, err.response?.data);
        throw err;
      }
    }

    // 5. Test dynamic tournament retrieving rules
    console.log("\n👉 Test 6: Verify dynamic tournament branding & prize pool calculation (without DB writes)");
    
    // Clear all sponsors for upcomingTour
    await Sponsor.deleteMany({ tournamentId: upcomingTour._id });

    // Fetch tournament (no title sponsor, not started yet)
    let tourRes = await axios.get(`${baseUrl}/tournaments/public/${upcomingTour._id}`);
    console.log(`- Empty sponsor upcoming tournament prizePool: ₹${tourRes.data.prizePool} (Expected: 0) ✅`);
    console.log(`- Empty sponsor upcoming tournament name: '${tourRes.data.eventName}' (Expected: 'Sponsor Test League') ✅`);

    if (tourRes.data.prizePool !== 0 || tourRes.data.eventName !== "Sponsor Test League") {
      throw new Error("Default upcoming tournament fields before start are incorrect.");
    }

    // Insert active Title Sponsor
    await Sponsor.create({
      name: "Nike",
      amount: 180000,
      tournamentId: upcomingTour._id,
      sponsorId: sponsorUser._id,
      type: "title",
      winnerPrize: 120000,
      runnerUpPrize: 60000,
      status: "active"
    });
    console.log("- Active Title Sponsor (Nike) inserted ✅");

    // Fetch tournament (now has active title sponsor)
    tourRes = await axios.get(`${baseUrl}/tournaments/public/${upcomingTour._id}`);
    console.log(`- Sponsored tournament prizePool: ₹${tourRes.data.prizePool} (Expected: 180000) ✅`);
    console.log(`- Sponsored tournament name: '${tourRes.data.eventName}' (Expected: 'Nike Sponsor Test League') ✅`);

    if (tourRes.data.prizePool !== 180000 || tourRes.data.eventName !== "Nike Sponsor Test League") {
      throw new Error("Dynamic sponsored tournament name/prize pool is incorrect.");
    }

    // Verify DB remains unmodified (original values still stored)
    const dbTour = await Tournament.findById(upcomingTour._id);
    console.log(`- DB original tournament prizePool: ₹${dbTour.prizePool} (Expected: 0) ✅`);
    console.log(`- DB original tournament name: '${dbTour.eventName}' (Expected: 'Sponsor Test League') ✅`);

    if (dbTour.prizePool !== 0 || dbTour.eventName !== "Sponsor Test League") {
      throw new Error("Original tournament record in the DB was incorrectly modified!");
    }

    // Test Default Prize Pool Rule: Start date has passed, and NO active title sponsor exists
    await Sponsor.deleteMany({ tournamentId: upcomingTour._id }); // remove sponsors
    
    // Set start date to yesterday to simulate started tournament
    upcomingTour.startDate = yesterday;
    await upcomingTour.save();
    console.log("- Tournament start date moved to yesterday ✅");

    tourRes = await axios.get(`${baseUrl}/tournaments/public/${upcomingTour._id}`);
    console.log(`- Started tournament with no title sponsor prizePool: ₹${tourRes.data.prizePool} (Expected: 150000) ✅`);
    console.log(`- Winner Prize: ₹${tourRes.data.winnerPrize} (Expected: 100000) ✅`);
    console.log(`- Runner-Up Prize: ₹${tourRes.data.runnerUpPrize} (Expected: 50000) ✅`);

    if (tourRes.data.prizePool !== 150000 || tourRes.data.winnerPrize !== 100000 || tourRes.data.runnerUpPrize !== 50000) {
      throw new Error("Default started tournament prizes are incorrect.");
    }

    // Clean up created records
    console.log("\nCleaning up created test records...");
    await User.deleteMany({ email: "test_sponsor@gmail.com" });
    await Sponsor.deleteMany({ tournamentId: { $in: [upcomingTour._id, pastTour._id] } });
    await Tournament.deleteMany({ _id: { $in: [upcomingTour._id, pastTour._id] } });

    console.log("\n==================================================");
    console.log("🎉 ALL SPONSOR FLOW INTEGRATION TESTS PASSED!");
    console.log("==================================================");

    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    console.error("\n❌ VALIDATION ERROR:", error.message);
    if (error.response) {
      console.error("Response data:", error.response.data);
    }
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
}

runTest();
