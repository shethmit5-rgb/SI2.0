const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const User = require("../models/User");
const Sport = require("../models/Sport");
const Venue = require("../models/Venue");
const Tournament = require("../models/Tournament");
const Team = require("../models/Team");
const Sponsor = require("../models/Sponsor");
const Registration = require("../models/Registration");
const Transaction = require("../models/Transaction");
const Notification = require("../models/notification");
const Match = require("../models/Match");

async function run() {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/ArenaSync";
    console.log("Connecting to MongoDB:", mongoUri);
    await mongoose.connect(mongoUri);

    // 1. Clean up old test data
    console.log("Cleaning up old test data...");
    const emailsToClean = [
      "admin_test@example.com",
      "organizer_test@example.com",
      "coach_test@example.com",
      "coach_test2@example.com",
      "player_test@example.com",
      "player_test2@example.com",
      "sponsor_test@example.com",
      "empty_test@example.com",
      "pending_player@example.com",
      "unpaid_player@example.com",
      "rejected_player@example.com"
    ];
    await User.deleteMany({ email: { $in: emailsToClean } });
    await Sport.deleteMany({ name: "Cricket" });
    await Venue.deleteMany({ name: "National Sports Center" });
    await Tournament.deleteMany({ eventName: { $in: ["Cricket World Cup 2026", "Football Tournament 2026"] } });
    await Team.deleteMany({ teamName: { $in: ["Team Gold", "Team Silver"] } });
    await Sponsor.deleteMany({ name: { $in: ["Adidas", "Nike"] } });
    await Registration.deleteMany({}); // Clear all registrations for clean testing
    await Transaction.deleteMany({}); // Clear all transactions for clean testing
    await Notification.deleteMany({}); // Clear all notifications

    console.log("Cleaned up database successfully.");

    // 2. Hash Password
    const hashedPassword = await bcrypt.hash("Password123!", 10);

    // 3. Create Users
    const admin = await User.create({
      name: "Test Admin",
      email: "admin_test@example.com",
      password: hashedPassword,
      role: "admin",
      phoneNumber: "+917777777777",
      isPhoneVerified: true,
      emailVerified: true,
      status: "active"
    });

    const organizer = await User.create({
      name: "Test Organizer",
      email: "organizer_test@example.com",
      password: hashedPassword,
      role: "organizer",
      phoneNumber: "+916666666666",
      isPhoneVerified: true,
      emailVerified: true,
      status: "active"
    });

    const coach1 = await User.create({
      name: "Test Coach 1",
      email: "coach_test@example.com",
      password: hashedPassword,
      role: "coach",
      phoneNumber: "+919999999999",
      isPhoneVerified: true,
      emailVerified: true,
      status: "active"
    });

    const coach2 = await User.create({
      name: "Test Coach 2",
      email: "coach_test2@example.com",
      password: hashedPassword,
      role: "coach",
      phoneNumber: "+919999999990",
      isPhoneVerified: true,
      emailVerified: true,
      status: "active"
    });

    const player1 = await User.create({
      name: "Test Player 1",
      email: "player_test@example.com",
      password: hashedPassword,
      role: "player",
      phoneNumber: "+918888888888",
      isPhoneVerified: true,
      emailVerified: true,
      status: "active"
    });

    const player2 = await User.create({
      name: "Test Player 2",
      email: "player_test2@example.com",
      password: hashedPassword,
      role: "player",
      phoneNumber: "+918888888880",
      isPhoneVerified: true,
      emailVerified: true,
      status: "active"
    });

    const sponsor = await User.create({
      name: "Test Sponsor",
      email: "sponsor_test@example.com",
      password: hashedPassword,
      role: "sponsor",
      phoneNumber: "+915555555555",
      isPhoneVerified: true,
      emailVerified: true,
      status: "active"
    });

    const emptyPlayer = await User.create({
      name: "Empty Player Test",
      email: "empty_test@example.com",
      password: hashedPassword,
      role: "player",
      phoneNumber: "+914444444444",
      isPhoneVerified: true,
      emailVerified: true,
      status: "active"
    });

    const pendingPlayer = await User.create({
      name: "Pending Player",
      email: "pending_player@example.com",
      password: hashedPassword,
      role: "player",
      phoneNumber: "+913333333333",
      isPhoneVerified: true,
      emailVerified: true,
      status: "active"
    });

    const unpaidPlayer = await User.create({
      name: "Unpaid Player",
      email: "unpaid_player@example.com",
      password: hashedPassword,
      role: "player",
      phoneNumber: "+912222222222",
      isPhoneVerified: true,
      emailVerified: true,
      status: "active"
    });

    const rejectedPlayer = await User.create({
      name: "Rejected Player",
      email: "rejected_player@example.com",
      password: hashedPassword,
      role: "player",
      phoneNumber: "+911111111111",
      isPhoneVerified: true,
      emailVerified: true,
      status: "active"
    });

    console.log("Users created successfully.");

    // 4. Create Sport and Venue
    const sport = await Sport.create({
      name: "Cricket",
      type: "Outdoor",
      playersPerTeam: 11
    });

    const venue = await Venue.create({
      name: "National Sports Center",
      address: "123 Stadium Road",
      capacity: 50000,
      type: "Outdoor"
    });

    console.log("Sport & Venue created.");

    // 5. Create Tournaments
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const fiveDaysFromNow = new Date();
    fiveDaysFromNow.setDate(fiveDaysFromNow.getDate() + 5);

    // Completed Tournament
    const tournament1 = await Tournament.create({
      eventName: "Cricket World Cup 2026",
      sportId: sport._id,
      venueId: venue._id,
      startDate: fiveDaysAgo,
      endDate: yesterday,
      status: "completed",
      prizePool: 150000,
      createdBy: organizer._id,
      organizerId: organizer._id,
      teamRegistrationFee: 500,
      paymentStatus: "Paid",
      amountPaid: 50000,
      paymentDate: fiveDaysAgo
    });

    // Upcoming Tournament
    const tournament2 = await Tournament.create({
      eventName: "Football Tournament 2026",
      sportId: sport._id,
      venueId: venue._id,
      startDate: tomorrow,
      endDate: fiveDaysFromNow,
      status: "upcoming",
      prizePool: 0,
      createdBy: organizer._id,
      organizerId: organizer._id,
      teamRegistrationFee: 1000,
      paymentStatus: "Paid",
      amountPaid: 50000,
      paymentDate: tomorrow
    });

    console.log("Tournaments created.");

    // 6. Create Sponsors
    const sponsor1 = await Sponsor.create({
      name: "Adidas",
      amount: 150000,
      tournamentId: tournament1._id,
      sponsorId: sponsor._id,
      type: "title",
      winnerPrize: 100000,
      runnerUpPrize: 50000,
      status: "active",
      razorpayOrderId: "ord_title_spon",
      razorpayPaymentId: "pay_title_spon",
      razorpaySignature: "sig_title_spon"
    });

    const sponsor2 = await Sponsor.create({
      name: "Nike",
      amount: 50000,
      tournamentId: tournament1._id,
      sponsorId: sponsor._id,
      type: "inkind",
      equipment: "Shoes",
      status: "active",
      razorpayOrderId: "ord_inkind_spon",
      razorpayPaymentId: "pay_inkind_spon",
      razorpaySignature: "sig_inkind_spon"
    });

    console.log("Sponsors created.");

    // 7. Create Teams
    const team1 = await Team.create({
      teamName: "Team Gold",
      tournamentId: tournament1._id,
      sportId: sport._id,
      captainId: coach1._id,
      playerJoiningFee: 150,
      players: [
        { userId: player1._id, status: "approved", paymentStatus: "Paid" },
        { userId: pendingPlayer._id, status: "pending", paymentStatus: "unpaid" },
        { userId: unpaidPlayer._id, status: "approved_pending_payment", paymentStatus: "unpaid", paymentDeadline: tomorrow },
        { userId: rejectedPlayer._id, status: "rejected", paymentStatus: "unpaid" }
      ]
    });

    const team2 = await Team.create({
      teamName: "Team Silver",
      tournamentId: tournament1._id,
      sportId: sport._id,
      captainId: coach2._id,
      playerJoiningFee: 100,
      players: [
        { userId: player2._id, status: "approved", paymentStatus: "Paid" }
      ]
    });

    console.log("Teams created.");

    // 8. Update Completed Tournament with teams & winner
    tournament1.teams = [team1._id, team2._id];
    tournament1.winner = team1._id;
    await tournament1.save();

    console.log("Completed tournament updated with winner/runner-up.");

    // 9. Create Match
    const match = await Match.create({
      tournamentId: tournament1._id,
      teams: [team1._id, team2._id],
      matchDate: yesterday,
      venueId: venue._id,
      status: "completed",
      round: 1,
      result: {
        winnerTeamId: team1._id,
        score: "120/5 - 110/8"
      },
      createdBy: organizer._id
    });

    console.log("Match created.");

    // 10. Create Transactions
    // Player 1 joining payment
    await Transaction.create({
      userId: player1._id,
      teamId: team1._id,
      paymentType: "player_joining",
      amount: 150,
      status: "paid",
      razorpayOrderId: "ord_player1_join",
      razorpayPaymentId: "pay_player1_join",
      razorpaySignature: "sig_player1_join",
      createdAt: fiveDaysAgo
    });

    // Player 2 joining payment
    await Transaction.create({
      userId: player2._id,
      teamId: team2._id,
      paymentType: "player_joining",
      amount: 100,
      status: "paid",
      razorpayOrderId: "ord_player2_join",
      razorpayPaymentId: "pay_player2_join",
      razorpaySignature: "sig_player2_join",
      createdAt: fiveDaysAgo
    });

    // Coach 1 team registration payment
    await Transaction.create({
      userId: coach1._id,
      tournamentId: tournament1._id,
      teamId: team1._id,
      paymentType: "team_registration",
      amount: 500,
      status: "paid",
      razorpayOrderId: "ord_coach1_reg",
      razorpayPaymentId: "pay_coach1_reg",
      razorpaySignature: "sig_coach1_reg",
      createdAt: fiveDaysAgo
    });

    // Coach 2 team registration payment
    await Transaction.create({
      userId: coach2._id,
      tournamentId: tournament1._id,
      teamId: team2._id,
      paymentType: "team_registration",
      amount: 500,
      status: "paid",
      razorpayOrderId: "ord_coach2_reg",
      razorpayPaymentId: "pay_coach2_reg",
      razorpaySignature: "sig_coach2_reg",
      createdAt: fiveDaysAgo
    });

    // Organizer creation fee payment
    await Transaction.create({
      userId: organizer._id,
      tournamentId: tournament1._id,
      paymentType: "tournament_creation",
      amount: 50000,
      status: "paid",
      razorpayOrderId: "ord_org_create",
      razorpayPaymentId: "pay_org_create",
      razorpaySignature: "sig_org_create",
      createdAt: fiveDaysAgo
    });

    // Sponsor payments
    await Transaction.create({
      userId: sponsor._id,
      tournamentId: tournament1._id,
      paymentType: "sponsorship",
      amount: 150000,
      status: "paid",
      razorpayOrderId: "ord_sponsor_title",
      razorpayPaymentId: "pay_sponsor_title",
      razorpaySignature: "sig_sponsor_title",
      createdAt: fiveDaysAgo
    });

    await Transaction.create({
      userId: sponsor._id,
      tournamentId: tournament1._id,
      paymentType: "sponsorship",
      amount: 50000,
      status: "paid",
      razorpayOrderId: "ord_sponsor_inkind",
      razorpayPaymentId: "pay_sponsor_inkind",
      razorpaySignature: "sig_sponsor_inkind",
      createdAt: fiveDaysAgo
    });

    console.log("Transactions created.");

    // 11. Create Registrations
    await Registration.create({
      userId: coach1._id,
      tournamentId: tournament1._id,
      teamId: team1._id,
      paymentStatus: "Paid",
      amount: 500,
      approvalStatus: "approved",
      registrationDate: fiveDaysAgo,
      paidAt: fiveDaysAgo,
      razorpayOrderId: "ord_coach1_reg",
      razorpayPaymentId: "pay_coach1_reg",
      razorpaySignature: "sig_coach1_reg"
    });

    await Registration.create({
      userId: coach2._id,
      tournamentId: tournament1._id,
      teamId: team2._id,
      paymentStatus: "Paid",
      amount: 500,
      approvalStatus: "approved",
      registrationDate: fiveDaysAgo,
      paidAt: fiveDaysAgo,
      razorpayOrderId: "ord_coach2_reg",
      razorpayPaymentId: "pay_coach2_reg",
      razorpaySignature: "sig_coach2_reg"
    });

    console.log("Registrations created.");

    // 12. Create Notifications for each dashboard
    await Notification.create([
      { userId: player1._id, message: "Welcome to Team Gold!", type: "info" },
      { userId: player1._id, message: "Tournament Cricket World Cup 2026 completed! Prize distributed.", type: "success" },
      { userId: coach1._id, message: "Your team registration is approved.", type: "success" },
      { userId: organizer._id, message: "Sponsorship received for Cricket World Cup 2026.", type: "info" },
      { userId: sponsor._id, message: "Sponsorship payment verified successfully.", type: "success" }
    ]);

    console.log("Notifications created.");
    console.log("Seeding finished successfully! All test accounts reset to Password123!");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Error seeding data:", error);
    process.exit(1);
  }
}

run();
