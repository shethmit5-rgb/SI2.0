const axios = require("axios");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const mongoUri = "mongodb://127.0.0.1:27017/ArenaSync";
const jwtSecret = "my_super_secret";
const baseUrl = "http://127.0.0.1:5000/api";

const testOrgId = "6a0986903e64d4411066cb6d"; // Match standard test ID or generate new
const testCoachId = "6a0985eb3e64d4411066cb02";
const testPlayerId = "6a09873d3e64d4411066cbcf";
const testAdminId = "6a0988cc3e64d4411066cbd1";

const orgToken = jwt.sign({ userId: testOrgId, role: "organizer" }, jwtSecret, { expiresIn: "1h" });
const coachToken = jwt.sign({ userId: testCoachId, role: "coach" }, jwtSecret, { expiresIn: "1h" });
const playerToken = jwt.sign({ userId: testPlayerId, role: "player" }, jwtSecret, { expiresIn: "1h" });
const adminToken = jwt.sign({ userId: testAdminId, role: "admin" }, jwtSecret, { expiresIn: "1h" });

const orgHeaders = { headers: { Authorization: `Bearer ${orgToken}` } };
const coachHeaders = { headers: { Authorization: `Bearer ${coachToken}` } };
const playerHeaders = { headers: { Authorization: `Bearer ${playerToken}` } };
const adminHeaders = { headers: { Authorization: `Bearer ${adminToken}` } };

async function runTest() {
  console.log("==================================================");
  console.log("🧪 RUNNING COMPREHENSIVE PAYMENTS FLOW VALIDATION");
  console.log("==================================================");

  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("Connected successfully to MongoDB.");

    const User = require("../models/User");
    const Tournament = require("../models/Tournament");
    const Team = require("../models/Team");
    const Registration = require("../models/Registration");
    const Transaction = require("../models/Transaction");
    const Sport = require("../models/Sport");
    const Venue = require("../models/Venue");

    // Clean up old test data
    console.log("Cleaning up old test data...");
    await User.deleteMany({
      $or: [
        { email: { $in: ["test_org@example.com", "test_coach@example.com", "test_player@example.com", "test_admin@example.com"] } },
        { _id: { $in: [testOrgId, testCoachId, testPlayerId, testAdminId] } }
      ]
    });
    await Tournament.deleteMany({ eventName: { $in: ["Payment Test League", "Admin Free Tournament", "Paid Reg Tournament"] } });
    await Team.deleteMany({ teamName: { $in: ["Payment Test Team"] } });
    await Transaction.deleteMany({ userId: { $in: [testOrgId, testCoachId, testPlayerId, testAdminId] } });
    await Sport.deleteMany({ name: "Payment Test Sport" });
    await Venue.deleteMany({ name: "Payment Test Venue" });

    // Seed test users
    console.log("Seeding test users...");
    const hashedPassword = await bcrypt.hash("Password123!", 10);
    
    await User.create({
      _id: testOrgId,
      name: "Test Organizer",
      email: "test_org@example.com",
      password: hashedPassword,
      role: "organizer",
      status: "active",
      phoneNumber: "+919876543211",
      isPhoneVerified: true
    });

    await User.create({
      _id: testCoachId,
      name: "Test Coach",
      email: "test_coach@example.com",
      password: hashedPassword,
      role: "coach",
      status: "active",
      phoneNumber: "+919876543212",
      isPhoneVerified: true
    });

    await User.create({
      _id: testPlayerId,
      name: "Test Player",
      email: "test_player@example.com",
      password: hashedPassword,
      role: "player",
      status: "active",
      phoneNumber: "+919876543213",
      isPhoneVerified: true
    });

    await User.create({
      _id: testAdminId,
      name: "Test Admin",
      email: "test_admin@example.com",
      password: hashedPassword,
      role: "admin",
      status: "active",
      phoneNumber: "+919876543214",
      isPhoneVerified: true
    });

    const sport = await Sport.create({ name: "Payment Test Sport" });
    const venue = await Venue.create({ name: "Payment Test Venue" });

    console.log("Test users and entities seeded successfully.");

    // ==========================================================
    // TEST 1: ORGANIZER TOURNAMENT CREATION (REQUIRES PAYMENT)
    // ==========================================================
    console.log("\n👉 Test 1: Organizer Tournament Creation (Requires Payment)");
    
    const tournamentBody = {
      eventName: "Payment Test League",
      sportId: sport._id,
      venueId: venue._id,
      location: "Main Ground",
      startDate: new Date(Date.now() + 86400000),
      endDate: new Date(Date.now() + 172800000),
      maxParticipants: 8,
      description: "A tournament to test payment flows.",
      rules: "standard rules",
      organizerId: testOrgId,
      teamRegistrationFee: 5000
    };

    const orgCreateRes = await axios.post(`${baseUrl}/tournaments`, tournamentBody, orgHeaders);
    
    if (orgCreateRes.data.success && orgCreateRes.data.requiresPayment && orgCreateRes.data.order) {
      console.log("✅ Organizer creation intercepted. Requires payment as expected.");
    } else {
      throw new Error("Organizer tournament creation should require payment.");
    }

    const transactionId = orgCreateRes.data.transactionId;
    const orderId = orgCreateRes.data.order.id;

    // Verify Tournament is NOT created in DB yet
    const dbTourBefore = await Tournament.findOne({ eventName: "Payment Test League" });
    if (dbTourBefore) {
      throw new Error("Tournament should not be created in DB before payment verification.");
    }
    console.log("✅ Tournament not created in DB before payment (Clean Database check passed).");

    // Verify Transaction is created with status "created"
    const txBefore = await Transaction.findById(transactionId);
    if (!txBefore || txBefore.status !== "created" || txBefore.paymentType !== "tournament_creation") {
      throw new Error("Transaction record not created or incorrect.");
    }
    console.log("✅ Transaction record created with 'created' status.");


    // ==========================================================
    // TEST 2: ADMIN TOURNAMENT CREATION (FREE & INSTANT)
    // ==========================================================
    console.log("\n👉 Test 2: Admin Tournament Creation (Free & Instant)");
    
    const adminCreateRes = await axios.post(`${baseUrl}/tournaments`, {
      ...tournamentBody,
      eventName: "Admin Free Tournament",
    }, adminHeaders);

    if (adminCreateRes.status === 201 && adminCreateRes.data._id) {
      console.log("✅ Admin tournament created instantly and returned 201.");
    } else {
      throw new Error("Admin tournament creation failed or returned unexpected response.");
    }

    const adminTourId = adminCreateRes.data._id;
    const adminDbTour = await Tournament.findById(adminTourId);
    if (!adminDbTour || adminDbTour.paymentStatus !== "Paid") {
      throw new Error("Admin tournament payment status should be Paid in database.");
    }
    console.log("✅ Admin tournament created in DB with Paid status.");


    // ==========================================================
    // TEST 3: PAYMENT SECURITY RULES ENFORCEMENT
    // ==========================================================
    console.log("\n👉 Test 3: Payment Security Rules Enforcement");

    // Helper: generate valid razorpay signature
    const mockPaymentId = `pay_${crypto.randomBytes(8).toString("hex")}`;
    const mockSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "mBri5UmfPAsyZgOWPWK0ptVa")
      .update(`${orderId}|${mockPaymentId}`)
      .digest("hex");

    // 3.1 Ownership Mismatch
    console.log("- 3.1 Ownership Verification Check (mismatched user trying to verify)");
    try {
      await axios.post(`${baseUrl}/tournaments/verify-payment`, {
        razorpay_order_id: orderId,
        razorpay_payment_id: mockPaymentId,
        razorpay_signature: mockSignature,
        transactionId: transactionId
      }, coachHeaders);
      throw new Error("Should have rejected ownership mismatch");
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.message.includes("You do not own this transaction")) {
        console.log("  ✅ Correctly rejected ownership mismatch with 403.");
      } else {
        throw new Error(`Expected 403 ownership mismatch, got: ${err.response?.status} - ${err.response?.data?.message}`);
      }
    }

    // 3.2 Amount Tampering Check
    console.log("- 3.2 Amount Tampering Check (altered transaction amount in DB)");
    // Manually alter the amount in DB to simulate tampered payload/transaction
    await Transaction.findByIdAndUpdate(transactionId, { amount: 1000 });
    
    try {
      await axios.post(`${baseUrl}/tournaments/verify-payment`, {
        razorpay_order_id: orderId,
        razorpay_payment_id: mockPaymentId,
        razorpay_signature: mockSignature,
        transactionId: transactionId
      }, orgHeaders);
      throw new Error("Should have rejected amount tampering");
    } catch (err) {
      if (err.response?.status === 400 && err.response?.data?.message.includes("amount mismatch")) {
        console.log("  ✅ Correctly rejected tampered amount check.");
      } else {
        throw new Error(`Expected 400 amount mismatch, got: ${err.response?.status} - ${err.response?.data?.message}`);
      }
    }

    // Restore correct amount
    await Transaction.findByIdAndUpdate(transactionId, { amount: 50000 });

    // 3.3 Signature Check
    console.log("- 3.3 Incorrect Signature Check");
    try {
      await axios.post(`${baseUrl}/tournaments/verify-payment`, {
        razorpay_order_id: orderId,
        razorpay_payment_id: mockPaymentId,
        razorpay_signature: "invalid_sig",
        transactionId: transactionId
      }, orgHeaders);
      throw new Error("Should have rejected invalid signature");
    } catch (err) {
      if (err.response?.status === 400 && err.response?.data?.message.includes("verification failed")) {
        console.log("  ✅ Correctly rejected invalid signature.");
      } else {
        throw new Error(`Expected 400 verification failure, got: ${err.response?.status} - ${err.response?.data?.message}`);
      }
    }

    // 3.4 Valid Signature & Successful creation
    console.log("- 3.4 Valid Signature & Successful creation");
    const verifyRes = await axios.post(`${baseUrl}/tournaments/verify-payment`, {
      razorpay_order_id: orderId,
      razorpay_payment_id: mockPaymentId,
      razorpay_signature: mockSignature,
      transactionId: transactionId
    }, orgHeaders);

    if (verifyRes.data.success && verifyRes.data.tournament) {
      console.log("  ✅ Payment successfully verified and tournament created.");
    } else {
      throw new Error("Payment verification failed.");
    }

    const createdTourId = verifyRes.data.tournament._id;
    const dbTourAfter = await Tournament.findById(createdTourId);
    if (!dbTourAfter || dbTourAfter.paymentStatus !== "Paid") {
      throw new Error("Created tournament should be in DB with status Paid.");
    }
    console.log("  ✅ Tournament is now active in DB with status 'Paid'.");

    // 3.5 Double Verification Prevention
    console.log("- 3.5 Double Verification Prevention");
    try {
      await axios.post(`${baseUrl}/tournaments/verify-payment`, {
        razorpay_order_id: orderId,
        razorpay_payment_id: mockPaymentId,
        razorpay_signature: mockSignature,
        transactionId: transactionId
      }, orgHeaders);
      throw new Error("Should have blocked double verification");
    } catch (err) {
      if (err.response?.status === 400 && err.response?.data?.message.includes("already been paid")) {
        console.log("  ✅ Correctly blocked double verification.");
      } else {
        throw new Error(`Expected 400 double verification block, got: ${err.response?.status} - ${err.response?.data?.message}`);
      }
    }


    // ==========================================================
    // TEST 4: ORGANIZER VISIBILITY
    // ==========================================================
    console.log("\n👉 Test 4: Organizer Visibility");

    // 4.1 Organizer dashboard sees pending mock tournaments
    // Create a new pending tournament creation first
    const pendingCreateRes = await axios.post(`${baseUrl}/tournaments`, {
      ...tournamentBody,
      eventName: "Organizer Pending League",
    }, orgHeaders);
    
    const myTournamentsRes = await axios.get(`${baseUrl}/tournaments/my-tournaments`, orgHeaders);
    const myTourNames = myTournamentsRes.data.map(t => t.eventName);
    console.log("- Organizer My Tournaments list:", myTourNames);
    
    if (myTourNames.includes("Organizer Pending League") && myTourNames.includes("Payment Test League")) {
      console.log("✅ Organizer dashboard correctly displays both paid and pending tournaments.");
    } else {
      throw new Error("Organizer list missing paid or pending tournament.");
    }

    // 4.2 Guest / Players cannot see pending tournaments in public list
    const publicToursRes = await axios.get(`${baseUrl}/tournaments/public`);
    const publicTourNames = publicToursRes.data.map(t => t.eventName);
    console.log("- Public Tournaments list:", publicTourNames);

    if (publicTourNames.includes("Payment Test League") && !publicTourNames.includes("Organizer Pending League")) {
      console.log("✅ Guests/players can see paid tournaments but NOT pending creations.");
    } else {
      throw new Error("Guest public list displays pending tournaments or missing paid tournaments.");
    }


    // ==========================================================
    // TEST 5: COACH TEAM REGISTRATION
    // ==========================================================
    console.log("\n👉 Test 5: Coach Team Registration (Requires Payment)");

    // Create a team first
    const team = await Team.create({
      teamName: "Payment Test Team",
      collegeName: "Payment College",
      captainId: testCoachId,
      tournamentId: createdTourId,
      sportId: sport._id,
      players: [{ userId: testCoachId, status: "approved" }],
      playerJoiningFee: 0
    });

    // First register the team (creates pending registration)
    await axios.post(`${baseUrl}/registrations`, {
      tournamentId: createdTourId,
      teamId: team._id
    }, coachHeaders);

    // Find the registration
    const tempReg = await Registration.findOne({ tournamentId: createdTourId, teamId: team._id });
    if (!tempReg || tempReg.approvalStatus !== "pending") {
      throw new Error("Registration should be pending after creation.");
    }

    // Organizer approves registration (moves it to approved_pending_payment)
    await axios.put(`${baseUrl}/registrations/${tempReg._id}`, {
      approvalStatus: "approved"
    }, orgHeaders);

    // Initiate team registration payment
    const initiateRegRes = await axios.post(`${baseUrl}/registrations/pay`, {
      tournamentId: createdTourId,
      teamId: team._id
    }, coachHeaders);

    if (initiateRegRes.data.success && initiateRegRes.data.requiresPayment && initiateRegRes.data.order) {
      console.log("✅ Coach team registration payment initiated. Requires payment.");
    } else {
      throw new Error("Coach team registration initiation failed.");
    }

    const regTxId = initiateRegRes.data.transactionId;
    const regOrderId = initiateRegRes.data.order.id;

    // Verify Registration is in approved_pending_payment and unpaid in MongoDB
    const regBefore = await Registration.findOne({ tournamentId: createdTourId, teamId: team._id });
    if (!regBefore || regBefore.approvalStatus !== "approved_pending_payment" || regBefore.paymentStatus === "Paid") {
      throw new Error("Registration should be approved_pending_payment and unpaid before payment verification.");
    }
    console.log("✅ Registration document is approved_pending_payment and unpaid in DB before payment.");

    // Complete payment
    const regPaymentId = `pay_${crypto.randomBytes(8).toString("hex")}`;
    const regSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "mBri5UmfPAsyZgOWPWK0ptVa")
      .update(`${regOrderId}|${regPaymentId}`)
      .digest("hex");

    const regVerifyRes = await axios.post(`${baseUrl}/registrations/verify-payment`, {
      razorpay_order_id: regOrderId,
      razorpay_payment_id: regPaymentId,
      razorpay_signature: regSignature,
      transactionId: regTxId
    }, coachHeaders);

    if (regVerifyRes.data.success && regVerifyRes.data.registration) {
      console.log("✅ Registration payment verified.");
    } else {
      throw new Error("Registration payment verification failed.");
    }

    const regAfter = await Registration.findOne({ tournamentId: createdTourId, teamId: team._id });
    if (!regAfter || regAfter.approvalStatus !== "approved" || regAfter.paymentStatus !== "Paid") {
      throw new Error("Registration should be approved and Paid in database.");
    }
    console.log("✅ Registration status updated to approved and Paid in DB.");


    // ==========================================================
    // TEST 6: PLAYER TEAM JOINING
    // ==========================================================
    console.log("\n👉 Test 6: Player Team Joining (Requires Payment)");

    // Set player joining fee to 1000 on the team
    team.playerJoiningFee = 1000;
    // Add player to team with pending approval status
    team.players.push({ userId: testPlayerId, status: "pending" });
    await team.save();

    // Coach approves player
    await axios.put(`${baseUrl}/teams/${team._id}/approve`, {
      userId: testPlayerId,
      action: "approved"
    }, coachHeaders);

    // Verify status is approved_pending_payment in database
    const dbTeamApprove = await Team.findById(team._id);
    const dbPlayer = dbTeamApprove.players.find(p => p.userId.toString() === testPlayerId);
    if (!dbPlayer || dbPlayer.status !== "approved_pending_payment") {
      throw new Error("Player should be approved_pending_payment when joining fee is set.");
    }
    console.log("✅ Player status set to 'approved_pending_payment' upon Coach approval.");

    // Player initiates join payment
    const initiateJoinRes = await axios.post(`${baseUrl}/teams/pay-join`, {
      teamId: team._id
    }, playerHeaders);

    if (initiateJoinRes.data.success && initiateJoinRes.data.requiresPayment && initiateJoinRes.data.order) {
      console.log("✅ Player initiated joining payment successfully.");
    } else {
      throw new Error("Player joining payment initiation failed.");
    }

    const joinTxId = initiateJoinRes.data.transactionId;
    const joinOrderId = initiateJoinRes.data.order.id;

    // Verify signature to complete join payment
    const joinPaymentId = `pay_${crypto.randomBytes(8).toString("hex")}`;
    const joinSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "mBri5UmfPAsyZgOWPWK0ptVa")
      .update(`${joinOrderId}|${joinPaymentId}`)
      .digest("hex");

    const joinVerifyRes = await axios.post(`${baseUrl}/teams/verify-join`, {
      razorpay_order_id: joinOrderId,
      razorpay_payment_id: joinPaymentId,
      razorpay_signature: joinSignature,
      transactionId: joinTxId
    }, playerHeaders);

    if (joinVerifyRes.data.success && joinVerifyRes.data.team) {
      console.log("✅ Player join payment verified.");
    } else {
      throw new Error("Player join payment verification failed.");
    }

    const dbTeamJoin = await Team.findById(team._id);
    const joinedPlayer = dbTeamJoin.players.find(p => p.userId.toString() === testPlayerId);
    if (!joinedPlayer || joinedPlayer.status !== "approved") {
      throw new Error("Player membership status should transition to 'approved' after payment.");
    }
    console.log("✅ Player membership activated (status approved) after successful payment.");


    // ==========================================================
    // TEST 7: ADMIN OVERRIDE (NO CASCADE DELETE)
    // ==========================================================
    console.log("\n👉 Test 7: Admin Override (No Cascade Delete)");

    // Admin overrides registration transaction status to "refunded"
    const overrideRes = await axios.post(`${baseUrl}/payments/admin/override`, {
      transactionId: regTxId,
      status: "refunded"
    }, adminHeaders);

    if (overrideRes.data.success && overrideRes.data.transaction.status === "refunded") {
      console.log("✅ Admin overridden status to refunded.");
    } else {
      throw new Error("Admin override status request failed.");
    }

    // Verify Registration status is Refunded
    const finalReg = await Registration.findById(regAfter._id);
    if (!finalReg || finalReg.paymentStatus !== "Refunded") {
      throw new Error("Registration payment status should be Refunded.");
    }
    console.log("✅ Registration payment status updated to 'Refunded' correctly.");

    // Verify Registration document is NOT deleted
    if (!finalReg) {
      throw new Error("Registration document was deleted on override! (Cascade delete failure)");
    }
    console.log("✅ Registration document remains intact (No cascade delete validation passed).");


    // Clean up
    console.log("\nCleaning up created test records...");
    await User.deleteMany({ email: { $in: ["test_org@example.com", "test_coach@example.com", "test_player@example.com", "test_admin@example.com"] } });
    await Tournament.deleteMany({ eventName: { $in: ["Payment Test League", "Admin Free Tournament", "Paid Reg Tournament", "Organizer Pending League"] } });
    await Team.deleteMany({ teamName: { $in: ["Payment Test Team"] } });
    await Transaction.deleteMany({ userId: { $in: [testOrgId, testCoachId, testPlayerId, testAdminId] } });
    await Sport.deleteMany({ _id: sport._id });
    await Venue.deleteMany({ _id: venue._id });

    console.log("\n==================================================");
    console.log("🎉 ALL PAYMENT SYSTEM INTEGRATION TESTS PASSED!");
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
