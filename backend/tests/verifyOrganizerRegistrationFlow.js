require("dotenv").config();
const axios = require("axios");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const mongoUri = "mongodb://127.0.0.1:27017/ArenaSync";
const jwtSecret = "my_super_secret";
const baseUrl = "http://127.0.0.1:5000/api";

const testOrgAId = "6a0986903e64d4411066cbaa";
const testOrgBId = "6a0986903e64d4411066cbbb";
const testCoachId = "6a0985eb3e64d4411066cbcc";
const testAdminId = "6a0988cc3e64d4411066cbdd";

const orgAToken = jwt.sign({ userId: testOrgAId, role: "organizer" }, jwtSecret, { expiresIn: "1h" });
const orgBToken = jwt.sign({ userId: testOrgBId, role: "organizer" }, jwtSecret, { expiresIn: "1h" });
const coachToken = jwt.sign({ userId: testCoachId, role: "coach" }, jwtSecret, { expiresIn: "1h" });
const adminToken = jwt.sign({ userId: testAdminId, role: "admin" }, jwtSecret, { expiresIn: "1h" });

const orgAHeaders = { headers: { Authorization: `Bearer ${orgAToken}` } };
const orgBHeaders = { headers: { Authorization: `Bearer ${orgBToken}` } };
const coachHeaders = { headers: { Authorization: `Bearer ${coachToken}` } };
const adminHeaders = { headers: { Authorization: `Bearer ${adminToken}` } };

async function runTest() {
  console.log("==========================================================");
  console.log("🧪 RUNNING COMPREHENSIVE ORGANIZER REGISTRATION FLOW TEST");
  console.log("==========================================================");

  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("Connected successfully to MongoDB.");

    const User = require("../models/User");
    const Tournament = require("../models/Tournament");
    const Team = require("../models/Team");
    const Registration = require("../models/Registration");
    const Match = require("../models/Match");
    const Transaction = require("../models/Transaction");
    const Notification = require("../models/notification");
    const Sport = require("../models/Sport");
    const Venue = require("../models/Venue");

    // Clean up old test data
    console.log("Cleaning up old test data...");
    await User.deleteMany({ _id: { $in: [testOrgAId, testOrgBId, testCoachId, testAdminId] } });
    await Tournament.deleteMany({ eventName: { $in: ["Org A Tourney", "Org B Tourney", "Ongoing Tourney", "Capacity Tourney"] } });
    await Team.deleteMany({ teamName: { $in: ["Coach Team A", "Coach Team B", "Coach Team C", "Coach Team D", "Coach Team E", "Coach Team F", "Coach Team G"] } });
    await Registration.deleteMany({ userId: testCoachId });
    await Transaction.deleteMany({ userId: testCoachId });
    await Notification.deleteMany({ userId: { $in: [testOrgAId, testOrgBId, testCoachId, testAdminId] } });
    await Sport.deleteMany({ name: "Test Sport A" });
    await Venue.deleteMany({ name: "Test Venue A" });

    // Seed test users
    console.log("Seeding test users...");
    const hashedPassword = await bcrypt.hash("Password123!", 10);
    
    await User.create({
      _id: testOrgAId,
      name: "Org A",
      email: "org_a@example.com",
      password: hashedPassword,
      role: "organizer",
      status: "active",
      phoneNumber: "+919876543231",
      isPhoneVerified: true
    });

    await User.create({
      _id: testOrgBId,
      name: "Org B",
      email: "org_b@example.com",
      password: hashedPassword,
      role: "organizer",
      status: "active",
      phoneNumber: "+919876543232",
      isPhoneVerified: true
    });

    await User.create({
      _id: testCoachId,
      name: "Coach Tester",
      email: "coach_test@example.com",
      password: hashedPassword,
      role: "coach",
      status: "active",
      phoneNumber: "+919876543233",
      isPhoneVerified: true
    });

    await User.create({
      _id: testAdminId,
      name: "Admin Tester",
      email: "admin_test@example.com",
      password: hashedPassword,
      role: "admin",
      status: "active",
      phoneNumber: "+919876543234",
      isPhoneVerified: true
    });

    // Seed sport and venue
    console.log("Seeding sport and venue...");
    const sport = await Sport.create({ name: "Test Sport A" });
    const venue = await Venue.create({ name: "Test Venue A", location: "Loc A", capacity: 100 });

    // Seed tournaments
    console.log("Seeding tournaments...");
    const tourA = await Tournament.create({
      eventName: "Org A Tourney",
      createdBy: testOrgAId,
      maxParticipants: 2,
      teamRegistrationFee: 0, // Free registration
      status: "upcoming",
      startDate: new Date(Date.now() + 86400000),
      endDate: new Date(Date.now() + 172800000),
      sportId: sport._id,
      venueId: venue._id
    });

    const tourB = await Tournament.create({
      eventName: "Org B Tourney",
      createdBy: testOrgBId,
      maxParticipants: 2,
      teamRegistrationFee: 500, // Fee required
      status: "upcoming",
      startDate: new Date(Date.now() + 86400000),
      endDate: new Date(Date.now() + 172800000),
      sportId: sport._id,
      venueId: venue._id
    });

    const tourC = await Tournament.create({
      eventName: "Ongoing Tourney",
      createdBy: testOrgAId,
      maxParticipants: 2,
      teamRegistrationFee: 0,
      status: "ongoing", // starts ongoing
      startDate: new Date(Date.now() - 86400000),
      endDate: new Date(Date.now() + 86400000),
      sportId: sport._id,
      venueId: venue._id
    });

    const tourD = await Tournament.create({
      eventName: "Capacity Tourney",
      createdBy: testOrgAId,
      maxParticipants: 1, // capacity of 1
      teamRegistrationFee: 0,
      status: "upcoming",
      startDate: new Date(Date.now() + 86400000),
      endDate: new Date(Date.now() + 172800000),
      sportId: sport._id,
      venueId: venue._id
    });

    // Seed teams
    console.log("Seeding teams...");
    const teamA = await Team.create({
      teamName: "Coach Team A",
      captainId: testCoachId,
      tournamentId: tourA._id,
      sportId: tourA.sportId
    });

    const teamB = await Team.create({
      teamName: "Coach Team B",
      captainId: testCoachId,
      tournamentId: tourB._id,
      sportId: tourA.sportId
    });

    const teamC = await Team.create({
      teamName: "Coach Team C",
      captainId: testCoachId,
      tournamentId: tourB._id,
      sportId: tourA.sportId
    });

    const teamD = await Team.create({
      teamName: "Coach Team D",
      captainId: testCoachId,
      tournamentId: tourB._id,
      sportId: tourA.sportId
    });

    const teamE = await Team.create({
      teamName: "Coach Team E",
      captainId: testCoachId,
      tournamentId: tourC._id,
      sportId: tourA.sportId
    });

    const teamF = await Team.create({
      teamName: "Coach Team F",
      captainId: testCoachId,
      tournamentId: tourD._id,
      sportId: tourA.sportId
    });

    const teamG = await Team.create({
      teamName: "Coach Team G",
      captainId: testCoachId,
      tournamentId: tourD._id,
      sportId: tourA.sportId
    });

    // ==========================================
    // 🧪 1. Coach registers Team A for Tour A (Zero Fee) -> pending
    // ==========================================
    console.log("\n👉 Assertion 1 & 2: Coach submits pending team registration");
    const regRes = await axios.post(`${baseUrl}/registrations`, {
      tournamentId: tourA._id,
      teamId: teamA._id
    }, coachHeaders);

    const regId = regRes.data._id;
    console.log("Created pending registration ID:", regId);
    if (regRes.data.approvalStatus !== "pending" || regRes.data.paymentStatus !== "unpaid") {
      throw new Error(`Expected pending & unpaid, got ${regRes.data.approvalStatus} & ${regRes.data.paymentStatus}`);
    }
    console.log("✅ Registration created as pending and unpaid.");

    // Verify team not added to tournament
    const freshTourA = await Tournament.findById(tourA._id);
    if (freshTourA.teams.includes(teamA._id)) {
      throw new Error("Team was prematurely added to tournament teams list!");
    }
    console.log("✅ Checked: team is NOT added to the tournament yet.");

    // Verify submission notification
    const submissionNotifs = await Notification.find({ relatedId: regId });
    const hasOrgANotified = submissionNotifs.some(n => n.userId.toString() === testOrgAId);
    const hasAdminNotified = submissionNotifs.some(n => n.userId.toString() === testAdminId);
    const hasOrgBNotified = submissionNotifs.some(n => n.userId.toString() === testOrgBId);
    if (hasOrgANotified && hasAdminNotified && !hasOrgBNotified) {
      console.log("✅ Notification correctly sent to Org A and Admin (no leakage to Org B).");
    } else {
      throw new Error("Notifications routing issue.");
    }

    // ==========================================
    // 🧪 2. Duplicate registration submit blocked
    // ==========================================
    console.log("\n👉 Assertion 8: Duplicate Registration Protection");
    try {
      await axios.post(`${baseUrl}/registrations`, {
        tournamentId: tourA._id,
        teamId: teamA._id
      }, coachHeaders);
      throw new Error("Duplicate registration should have been blocked!");
    } catch (err) {
      if (err.response?.status === 400 && err.response?.data?.message === "Team is already registered for this tournament.") {
        console.log("✅ Duplicate registration blocked successfully.");
      } else {
        throw new Error("Unexpected duplicate registration failure response: " + JSON.stringify(err.response?.data));
      }
    }

    // ==========================================
    // 🧪 3. Pending registration cannot pay
    // ==========================================
    console.log("\n👉 Assertion 4: Pending registration cannot pay");
    try {
      await axios.post(`${baseUrl}/registrations/pay`, {
        tournamentId: tourA._id,
        teamId: teamA._id
      }, coachHeaders);
      throw new Error("Should block payment on pending registrations!");
    } catch (err) {
      if (err.response?.status === 400 && err.response?.data?.message === "Your registration is pending approval.") {
        console.log("✅ Payment block on pending registration works.");
      } else {
        throw new Error("Unexpected response for pending pay check: " + JSON.stringify(err.response?.data));
      }
    }

    // ==========================================
    // 🧪 4. Write Access Checks (Org B cannot approve Org A registration)
    // ==========================================
    console.log("\n👉 Assertion 4: Write Access Control");
    try {
      await axios.put(`${baseUrl}/registrations/${regId}`, {
        approvalStatus: "approved"
      }, orgBHeaders);
      throw new Error("Org B should not be allowed to approve Org A's tournament registration!");
    } catch (err) {
      if (err.response?.status === 403) {
        console.log("✅ Org B write request blocked with 403 Forbidden.");
      } else {
        throw new Error("Unexpected response status: " + err.response?.status);
      }
    }

    // ==========================================
    // 🧪 5. Organizer A approves Team A's registration
    // ==========================================
    console.log("\n👉 Assertion 5 & 17: Organizer A approves registration (leading to approved_pending_payment)");
    const approveRes = await axios.put(`${baseUrl}/registrations/${regId}`, {
      approvalStatus: "approved"
    }, orgAHeaders);

    if (approveRes.data.approvalStatus !== "approved_pending_payment") {
      throw new Error(`Expected approved_pending_payment, got ${approveRes.data.approvalStatus}`);
    }
    if (!approveRes.data.paymentDeadline) {
      throw new Error("paymentDeadline was not populated!");
    }
    console.log("✅ Organizer approval puts registration in approved_pending_payment state with deadline.");

    // Verify coach notification
    const coachApproveNotif = await Notification.findOne({ userId: testCoachId, type: "registration_approved" });
    if (coachApproveNotif && coachApproveNotif.message.includes("approved")) {
      console.log("✅ Coach correctly notified that payment is required.");
    } else {
      throw new Error("Coach approval notification missing or wrong.");
    }

    // Double check: team is STILL not added to tournament
    const tourAPending = await Tournament.findById(tourA._id);
    if (tourAPending.teams.includes(teamA._id)) {
      throw new Error("Team added to tournament before payment!");
    }
    console.log("✅ Checked: team is STILL NOT added to tournament.");

    // ==========================================
    // 🧪 6. Double processing block (cannot reject if already approved)
    // ==========================================
    console.log("\n👉 Assertion 6: Double Processing Block");
    try {
      await axios.put(`${baseUrl}/registrations/${regId}`, {
        approvalStatus: "rejected"
      }, orgAHeaders);
      throw new Error("Should block re-processing!");
    } catch (err) {
      console.log("DEBUG ERROR IN ASSERTION 6:", err.message, err.response?.status, err.response?.data);
      if (err.response?.status === 400 && err.response?.data?.message === "Registration has already been processed.") {
        console.log("✅ Re-processing blocked correctly.");
      } else {
        throw new Error("Unexpected re-processing block response: " + JSON.stringify(err.response?.data));
      }
    }

    // ==========================================
    // 🧪 7. Coach completes checkout for Zero Fee registration
    // ==========================================
    console.log("\n👉 Assertion 7: Zero Fee checkout verification");
    const payResZero = await axios.post(`${baseUrl}/registrations/pay`, {
      tournamentId: tourA._id,
      teamId: teamA._id
    }, coachHeaders);

    if (payResZero.data.requiresPayment !== false) {
      throw new Error("Zero-fee registration should not require payment!");
    }
    const freshRegA = await Registration.findById(regId);
    if (freshRegA.approvalStatus !== "approved" || freshRegA.paymentStatus !== "Paid") {
      throw new Error(`Expected approved & Paid, got ${freshRegA.approvalStatus} & ${freshRegA.paymentStatus}`);
    }
    const tourAFinal = await Tournament.findById(tourA._id);
    if (!tourAFinal.teams.includes(teamA._id)) {
      throw new Error("Team was not added to tournament after successful zero-fee registration!");
    }
    console.log("✅ Zero-fee registration finalized and team added to tournament.");

    // ==========================================
    // 🧪 8. Reversal Lock Check
    // ==========================================
    console.log("\n👉 Assertion 16: Reversal Lock Protection");
    try {
      await axios.put(`${baseUrl}/registrations/${regId}`, {
        approvalStatus: "rejected"
      }, orgAHeaders);
      throw new Error("Should block editing finalized registration!");
    } catch (err) {
      if (err.response?.status === 400 && err.response?.data?.message === "Paid registration has already been finalized.") {
        console.log("✅ Finalized registration reversal lock working (returned 400 Paid registration has already been finalized.).");
      } else {
        throw new Error("Unexpected reversal lock response: " + JSON.stringify(err.response?.data));
      }
    }

    // ==========================================
    // 🧪 9. Coach registers Team B for Tour B (Fee > 0)
    // ==========================================
    console.log("\n👉 Assertion 9: Fee registration flow and capacity validations");
    const regResB = await axios.post(`${baseUrl}/registrations`, {
      tournamentId: tourB._id,
      teamId: teamB._id
    }, coachHeaders);
    const regBId = regResB.data._id;

    // Org B approves Team B
    await axios.put(`${baseUrl}/registrations/${regBId}`, {
      approvalStatus: "approved"
    }, orgBHeaders);
    
    const freshRegB = await Registration.findById(regBId);
    if (freshRegB.approvalStatus !== "approved_pending_payment") {
      throw new Error("Expected approved_pending_payment for Team B.");
    }
    console.log("✅ Team B registered and approved (waiting for payment).");

    // ==========================================
    // 🧪 10. Capacity Limit respected counting pending payments
    // ==========================================
    console.log("\n👉 Assertion 11: Capacity Limit counting approved_pending_payment");
    // Register Team C to Tour B
    const regResC = await axios.post(`${baseUrl}/registrations`, {
      tournamentId: tourB._id,
      teamId: teamC._id
    }, coachHeaders);
    const regCId = regResC.data._id;

    // Set maxParticipants of Tour B to 1
    await Tournament.findByIdAndUpdate(tourB._id, { maxParticipants: 1 });

    // Org B tries to approve Team C
    try {
      await axios.put(`${baseUrl}/registrations/${regCId}`, {
        approvalStatus: "approved"
      }, orgBHeaders);
      throw new Error("Should have blocked Team C approval because Team B is reserving the only slot!");
    } catch (err) {
      if (err.response?.status === 400 && err.response?.data?.message === "Tournament has reached its maximum participant capacity.") {
        console.log("✅ Blocked Team C approval: capacity checked correctly.");
      } else {
        throw new Error("Unexpected capacity block response: " + JSON.stringify(err.response?.data));
      }
    }

    // Restore maxParticipants of Tour B to 2
    await Tournament.findByIdAndUpdate(tourB._id, { maxParticipants: 2 });

    // ==========================================
    // 🧪 11. Rejection releases capacity
    // ==========================================
    console.log("\n👉 Assertion 14: Rejection releases capacity");
    // Set maxParticipants to 1 again
    await Tournament.findByIdAndUpdate(tourB._id, { maxParticipants: 1 });

    // Make Team B pending again
    await Registration.findByIdAndUpdate(regBId, { approvalStatus: "pending" });

    // Reject Team B
    await axios.put(`${baseUrl}/registrations/${regBId}`, {
      approvalStatus: "rejected"
    }, orgBHeaders);

    // Now approve Team C -> should succeed because Team B slot was released
    const approveResC = await axios.put(`${baseUrl}/registrations/${regCId}`, {
      approvalStatus: "approved"
    }, orgBHeaders);
    if (approveResC.data.approvalStatus !== "approved_pending_payment") {
      throw new Error("Team C approval failed after Team B rejection released slot.");
    }
    console.log("✅ Team C approval succeeded: slot released on rejection.");

    // Restore maxParticipants to 2
    await Tournament.findByIdAndUpdate(tourB._id, { maxParticipants: 2 });

    // ==========================================
    // 🧪 12. Initiate payment & duplicate Razorpay payment protection
    // ==========================================
    console.log("\n👉 Assertion 9: Initiate payment and Transaction reuse");
    const payResC = await axios.post(`${baseUrl}/registrations/pay`, {
      tournamentId: tourB._id,
      teamId: teamC._id
    }, coachHeaders);

    if (payResC.data.requiresPayment !== true || !payResC.data.order?.id) {
      throw new Error("Expected Razorpay order for Fee > 0 registration.");
    }
    const txId = payResC.data.transactionId;
    console.log("✅ Razorpay order initiated with Transaction ID:", txId);

    // Call payment initiation again
    const payResC2 = await axios.post(`${baseUrl}/registrations/pay`, {
      tournamentId: tourB._id,
      teamId: teamC._id
    }, coachHeaders);
    if (payResC2.data.transactionId !== txId || payResC2.data.order.id !== payResC.data.order.id) {
      throw new Error("Transaction/Order was not reused on subsequent request!");
    }
    console.log("✅ Subsequent initiate call successfully reused transaction.");

    // Test double payment check: set transaction status to paid
    await Transaction.findByIdAndUpdate(txId, { status: "paid" });
    try {
      await axios.post(`${baseUrl}/registrations/pay`, {
        tournamentId: tourB._id,
        teamId: teamC._id
      }, coachHeaders);
      throw new Error("Should have blocked duplicate payment initiation!");
    } catch (err) {
      if (err.response?.status === 400 && err.response?.data?.message === "Transaction already paid and verified") {
        console.log("✅ Duplicate payment initiation blocked successfully.");
      } else {
        throw new Error("Unexpected duplicate payment response: " + JSON.stringify(err.response?.data));
      }
    }
    // Revert transaction status
    await Transaction.findByIdAndUpdate(txId, { status: "created" });

    // ==========================================
    // 🧪 13. Expiry / Deadline Verification during Payment Verification
    // ==========================================
    console.log("\n👉 Assertion 10 & 15: Expiry checks during payment verification");
    // Manually set Team C deadline to past
    await Registration.findByIdAndUpdate(regCId, { paymentDeadline: new Date(Date.now() - 3600000) });

    // Attempt verify-payment
    const secret = process.env.RAZORPAY_KEY_SECRET || "";
    const mockPaymentId = "pay_mock123";
    const body = payResC.data.order.id + "|" + mockPaymentId;
    const mockSignature = crypto.createHmac("sha256", secret).update(body).digest("hex");

    try {
      await axios.post(`${baseUrl}/registrations/verify-payment`, {
        razorpay_order_id: payResC.data.order.id,
        razorpay_payment_id: mockPaymentId,
        razorpay_signature: mockSignature,
        transactionId: txId
      }, coachHeaders);
      throw new Error("Verify payment should have failed due to expired deadline!");
    } catch (err) {
      if (err.response?.status === 400 && err.response?.data?.message === "Payment approval window has expired. Please wait for organizer approval again.") {
        console.log("✅ Payment verification with expired deadline blocked correctly.");
      } else {
        throw new Error("Unexpected verify failure: " + JSON.stringify(err.response?.data));
      }
    }

    // Verify registration reverted to pending and unpaid
    const expiredRegC = await Registration.findById(regCId);
    if (expiredRegC.approvalStatus !== "pending" || expiredRegC.paymentStatus !== "unpaid" || expiredRegC.paymentDeadline) {
      throw new Error("Registration did not revert properly on expiry!");
    }
    console.log("✅ Checked: Registration successfully reverted to pending/unpaid.");

    // Check expiry notification sent
    const expiredNotif = await Notification.findOne({ userId: testCoachId, type: "approval_expired" });
    if (expiredNotif && expiredNotif.message.includes("expired")) {
      console.log("✅ Coach correctly notified of expired approval.");
    } else {
      throw new Error("Expiry notification missing or incorrect.");
    }

    // ==========================================
    // 🧪 14. Verify payment with valid deadline
    // ==========================================
    console.log("\n👉 Assertion 12: Verify payment with valid deadline succeeds");
    // Re-approve Team C
    await axios.put(`${baseUrl}/registrations/${regCId}`, {
      approvalStatus: "approved"
    }, orgBHeaders);

    // Get a new Razorpay order
    const payResC3 = await axios.post(`${baseUrl}/registrations/pay`, {
      tournamentId: tourB._id,
      teamId: teamC._id
    }, coachHeaders);
    const txId3 = payResC3.data.transactionId;
    const orderId3 = payResC3.data.order.id;

    // Verify payment
    const verifyBody3 = orderId3 + "|" + mockPaymentId;
    const verifySig3 = crypto.createHmac("sha256", secret).update(verifyBody3).digest("hex");

    const verifyRes3 = await axios.post(`${baseUrl}/registrations/verify-payment`, {
      razorpay_order_id: orderId3,
      razorpay_payment_id: mockPaymentId,
      razorpay_signature: verifySig3,
      transactionId: txId3
    }, coachHeaders);

    if (!verifyRes3.data.success) {
      throw new Error("Payment verification failed under valid deadline.");
    }
    const verifiedRegC = await Registration.findById(regCId);
    if (verifiedRegC.approvalStatus !== "approved" || verifiedRegC.paymentStatus !== "Paid") {
      throw new Error("Registration not marked approved and Paid!");
    }
    const freshTourB = await Tournament.findById(tourB._id);
    if (!freshTourB.teams.includes(teamC._id)) {
      throw new Error("Team C not added to tournament after successful payment!");
    }
    console.log("✅ Paid registration verified successfully, team added to tournament.");

    // ==========================================
    // 🧪 15. Slot release on Expiry (via automated trigger on fetch)
    // ==========================================
    console.log("\n👉 Assertion 10 & 14: Slot release on Expiry trigger");
    // Setup Tour D (capacity 1). Register Team F
    const regResF = await axios.post(`${baseUrl}/registrations`, {
      tournamentId: tourD._id,
      teamId: teamF._id
    }, coachHeaders);
    const regFId = regResF.data._id;

    // Approve Team F
    await axios.put(`${baseUrl}/registrations/${regFId}`, {
      approvalStatus: "approved"
    }, orgAHeaders);

    // Verify slot is taken (register Team G and try to approve)
    const regResG = await axios.post(`${baseUrl}/registrations`, {
      tournamentId: tourD._id,
      teamId: teamG._id
    }, coachHeaders);
    const regGId = regResG.data._id;

    try {
      await axios.put(`${baseUrl}/registrations/${regGId}`, {
        approvalStatus: "approved"
      }, orgAHeaders);
      throw new Error("Should block Team G approval because Team F occupies slot.");
    } catch (err) {
      if (err.response?.status === 400 && err.response?.data?.message === "Tournament has reached its maximum participant capacity.") {
        console.log("✅ Slot occupied block works.");
      } else {
        throw new Error("Unexpected slot block: " + JSON.stringify(err.response?.data));
      }
    }

    // Now mock expiry of Team F by setting deadline to past
    await Registration.findByIdAndUpdate(regFId, { paymentDeadline: new Date(Date.now() - 3600000) });

    // Trigger cleanup via GET registrations call
    await axios.get(`${baseUrl}/registrations/my-registrations`, coachHeaders);

    // Verify Team F reverted to pending
    const freshRegF = await Registration.findById(regFId);
    if (freshRegF.approvalStatus !== "pending") {
      throw new Error("Team F registration did not auto-expire and release slot!");
    }
    console.log("✅ Team F auto-expired successfully on fetch trigger.");

    // Approve Team G -> should succeed now
    const approveResG = await axios.put(`${baseUrl}/registrations/${regGId}`, {
      approvalStatus: "approved"
    }, orgAHeaders);
    if (approveResG.data.approvalStatus !== "approved_pending_payment") {
      throw new Error("Team G approval failed after Team F expired!");
    }
    console.log("✅ Team G approved successfully after slot release.");

    // ==========================================
    // 🧪 16. Slot release on Cancellation
    // ==========================================
    console.log("\n👉 Assertion 14: Slot release on Cancellation");
    // Cancel Team G registration
    await axios.delete(`${baseUrl}/registrations/${regGId}/cancel`, coachHeaders);
    const deletedG = await Registration.findById(regGId);
    if (deletedG) {
      throw new Error("Registration was not deleted!");
    }
    console.log("✅ Registration cancelled/deleted successfully.");

    // Approve Team F now -> should succeed since G cancelled
    const approveResF = await axios.put(`${baseUrl}/registrations/${regFId}`, {
      approvalStatus: "approved"
    }, orgAHeaders);
    if (approveResF.data.approvalStatus !== "approved_pending_payment") {
      throw new Error("Team F approval failed after Team G cancellation.");
    }
    console.log("✅ Team F approved successfully after G cancelled.");

    // ==========================================
    // 🧪 17. Bracket Lock Protection (Match check)
    // ==========================================
    console.log("\n👉 Assertion 12: Bracket Lock Protection");
    // Create a dummy match for Tour D
    const dummyMatch = await Match.create({
      tournamentId: tourD._id,
      teams: [teamF._id, new mongoose.Types.ObjectId()],
      matchDate: new Date(),
      venueId: new mongoose.Types.ObjectId(),
      status: "scheduled",
      round: 1
    });

    // Make Team F pending again so we can try to approve
    await Registration.findByIdAndUpdate(regFId, { approvalStatus: "pending" });

    try {
      await axios.put(`${baseUrl}/registrations/${regFId}`, {
        approvalStatus: "approved"
      }, orgAHeaders);
      throw new Error("Should block approval when matches exist!");
    } catch (err) {
      if (err.response?.status === 400 && err.response?.data?.message === "Registration is closed because tournament matches have already been created.") {
        console.log("✅ Bracket lock verified successfully.");
      } else {
        throw new Error("Unexpected response: " + JSON.stringify(err.response?.data));
      }
    }

    // Clean up match
    await Match.findByIdAndDelete(dummyMatch._id);

    // ==========================================
    // 🧪 18. Tournament Started Protection
    // ==========================================
    console.log("\n👉 Assertion 13: Tournament Started Protection");
    // Register to tourC (already ongoing)
    const regResE = await axios.post(`${baseUrl}/registrations`, {
      tournamentId: tourC._id,
      teamId: teamE._id
    }, coachHeaders);
    const regEId = regResE.data._id;

    try {
      await axios.put(`${baseUrl}/registrations/${regEId}`, {
        approvalStatus: "approved"
      }, orgAHeaders);
      throw new Error("Should block approval when tournament status is ongoing!");
    } catch (err) {
      if (err.response?.status === 400 && err.response?.data?.message === "Registration is closed because the tournament has already started.") {
        console.log("✅ Tournament started block verified successfully.");
      } else {
        throw new Error("Unexpected response: " + JSON.stringify(err.response?.data));
      }
    }

    console.log("\nCleaning up test documents...");
    await User.deleteMany({ _id: { $in: [testOrgAId, testOrgBId, testCoachId, testAdminId] } });
    await Tournament.deleteMany({ _id: { $in: [tourA._id, tourB._id, tourC._id, tourD._id] } });
    await Team.deleteMany({ _id: { $in: [teamA._id, teamB._id, teamC._id, teamD._id, teamE._id, teamF._id, teamG._id] } });
    await Registration.deleteMany({ _id: { $in: [regId, regBId, regCId, regFId, regGId, regEId] } });
    await Transaction.deleteMany({ userId: testCoachId });
    await Notification.deleteMany({ userId: { $in: [testOrgAId, testOrgBId, testCoachId, testAdminId] } });
    await Sport.deleteMany({ _id: sport._id });
    await Venue.deleteMany({ _id: venue._id });

    await mongoose.disconnect();
    console.log("\n==========================================================");
    console.log("🎉 ALL ORGANIZER REGISTRATION TESTS PASSED SUCCESSFULLY!");
    console.log("==========================================================");

  } catch (error) {
    console.error("\n❌ TEST FAILURE:", error.message);
    if (error.response?.data) {
      console.error("Response data:", error.response.data);
    }
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
}

runTest();
