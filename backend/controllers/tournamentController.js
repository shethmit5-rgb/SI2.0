const Tournament = require("../models/Tournament");
const Team = require("../models/Team");
const Match = require("../models/Match");
const Registration = require("../models/Registration");
const cloudinary = require("../config/cloudinary");
const fs = require("fs");
const path = require("path");
const { checkAndUpdateTournamentStatuses, getTournamentRoundInfo, triggerDashboardUpdate } = require("../utils/tournamentHelper");
const Sponsor = require("../models/Sponsor");
const jwt = require("jsonwebtoken");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const Transaction = require("../models/Transaction");

let razorpay = null;
try {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
} catch (error) {
  console.error("Razorpay initialization error:", error);
}


async function populateSponsorDetails(tournament) {
  if (!tournament) return null;
  const tObj = tournament.toObject ? tournament.toObject() : tournament;

  // Find active title sponsor
  const titleSponsor = await Sponsor.findOne({
    tournamentId: tObj._id,
    type: "title",
    status: "active"
  });

  if (titleSponsor) {
    tObj.eventName = `${titleSponsor.name} ${tObj.eventName}`;
    tObj.prizePool = titleSponsor.winnerPrize + titleSponsor.runnerUpPrize;
    tObj.winnerPrize = titleSponsor.winnerPrize;
    tObj.runnerUpPrize = titleSponsor.runnerUpPrize;
    tObj.titleSponsorLogo = titleSponsor.logo;
  } else {
    // If no active Title Sponsor exists and start date has passed/reached
    const today = new Date();
    if (new Date(tObj.startDate) <= today) {
      tObj.prizePool = 150000;
      tObj.winnerPrize = 100000;
      tObj.runnerUpPrize = 50000;
    } else {
      tObj.winnerPrize = 0;
      tObj.runnerUpPrize = 0;
    }
  }

  // Find all active sponsors for this tournament (both Title, In-Kind, and Standard)
  const activeSponsors = await Sponsor.find({
    tournamentId: tObj._id,
    status: "active"
  });
  tObj.activeSponsorships = activeSponsors;

  return tObj;
}

async function populateSponsorDetailsForArray(tournaments) {
  return await Promise.all(tournaments.map(t => populateSponsorDetails(t)));
}

exports.createTournament = async (req, res, next) => {
  try {
    const {
      eventName,
      sportId,
      venueId,
      location,
      startDate,
      endDate,
      maxParticipants,
      description,
      rules,
      organizerId,
      teamRegistrationFee,
    } = req.body;

    // Validated in validator schema
    if (new Date(endDate) < new Date(startDate)) {
      return res.status(400).json({ message: "End date cannot be before start date" });
    }

    if (maxParticipants) {
      const val = Number(maxParticipants);
      if (isNaN(val) || val <= 1 || (val & (val - 1)) !== 0) {
        return res.status(400).json({ message: "Tournament team count (max participants) must be a power of 2 (2, 4, 8, 16, 32, etc.)" });
      }
    }

    let logoUrl = "";
    if (req.file) {
      const localPath = path.resolve(req.file.path);
      const result = await cloudinary.uploader.upload(localPath, {
        folder: "tournament_logos",
      });
      logoUrl = result.secure_url;
      fs.unlinkSync(localPath);
    }

    // If Admin: create immediately
    if (req.user.role === "admin") {
      const tournament = await Tournament.create({
        eventName,
        sportId,
        venueId,
        location,
        startDate,
        endDate,
        maxParticipants,
        description,
        rules,
        organizerId: organizerId || req.user.userId,
        createdBy: req.user.userId,
        logo: logoUrl,
        status: "upcoming",
        teams: [],
        prizePool: 0,
        teamRegistrationFee: Number(teamRegistrationFee) || 0,
        paymentStatus: "Paid",
        amountPaid: 0,
      });
      return res.status(201).json(tournament);
    }

    // For Organizer: require payment
    if (!razorpay) {
      return res.status(503).json({ message: "Payment service not configured" });
    }

    const creationFee = Number(process.env.ORGANIZER_TOURNAMENT_CREATION_FEE || 50000);

    // Check for existing pending transaction
    let existingTx = await Transaction.findOne({
      userId: req.user.userId,
      paymentType: "tournament_creation",
      status: "created"
    });

    const finalLogo = logoUrl || (existingTx && existingTx.tempData && existingTx.tempData.logo) || "";
    const tempData = {
      eventName,
      sportId,
      venueId,
      location,
      startDate,
      endDate,
      maxParticipants,
      description,
      rules,
      organizerId: organizerId || req.user.userId,
      createdBy: req.user.userId,
      logo: finalLogo,
      teamRegistrationFee: Number(teamRegistrationFee) || 0
    };

    if (existingTx) {
      existingTx.tempData = tempData;
      existingTx.updatedAt = Date.now();
      await existingTx.save();

      return res.status(200).json({
        success: true,
        requiresPayment: true,
        order: {
          id: existingTx.razorpayOrderId,
          amount: existingTx.amount * 100,
          currency: existingTx.currency || "INR",
        },
        transactionId: existingTx._id
      });
    }

    // Create a new Razorpay order
    const options = {
      amount: creationFee * 100, // in paise
      currency: "INR",
      receipt: `receipt_creation_${Date.now()}`,
      notes: {
        userId: req.user.userId,
        paymentType: "tournament_creation"
      }
    };

    const order = await razorpay.orders.create(options);

    const transaction = new Transaction({
      userId: req.user.userId,
      paymentType: "tournament_creation",
      amount: creationFee,
      status: "created",
      razorpayOrderId: order.id,
      tempData: tempData,
    });

    await transaction.save();

    res.status(200).json({
      success: true,
      requiresPayment: true,
      order,
      transactionId: transaction._id,
    });

  } catch (err) {
    console.error("CREATE TOURNAMENT ERROR:", err);
    res.status(500).json({ message: err.message || "Tournament creation failed" });
  }
};

exports.getMyTournaments = async (req, res, next) => {
  try {
    await checkAndUpdateTournamentStatuses();
    const tournaments = await Tournament.find({
      $or: [
        { organizerId: req.user.userId },
        { createdBy: req.user.userId }
      ]
    })
      .populate("sportId", "name")
      .populate("teams", "teamName")
      .populate("venueId", "name");
    const formatted = await populateSponsorDetailsForArray(tournaments);

    const pendingTxs = await Transaction.find({
      userId: req.user.userId,
      paymentType: "tournament_creation",
      status: "created"
    });

    const Sport = require("../models/Sport");
    const Venue = require("../models/Venue");

    const pendingTournaments = await Promise.all(pendingTxs.map(async (tx) => {
      const sport = await Sport.findById(tx.tempData.sportId).select("name");
      const venue = await Venue.findById(tx.tempData.venueId).select("name");

      return {
        _id: tx._id,
        eventName: tx.tempData.eventName,
        sportId: sport ? { _id: sport._id, name: sport.name } : null,
        venueId: venue ? { _id: venue._id, name: venue.name } : null,
        location: tx.tempData.location,
        startDate: tx.tempData.startDate,
        endDate: tx.tempData.endDate,
        maxParticipants: tx.tempData.maxParticipants,
        description: tx.tempData.description,
        rules: tx.tempData.rules,
        logo: tx.tempData.logo,
        paymentStatus: "Pending",
        status: "upcoming",
        teams: [],
        prizePool: 0,
        razorpayOrderId: tx.razorpayOrderId,
        isPendingTx: true
      };
    }));

    res.json([...formatted, ...pendingTournaments]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getPublicTournaments = async (req, res, next) => {
  try {
    await checkAndUpdateTournamentStatuses();
    const tournaments = await Tournament.find({ paymentStatus: "Paid" })
      .populate("sportId", "name")
      .populate("teams", "teamName")
      .populate("venueId", "name")
      .sort({ createdAt: -1 });

    const formatted = await populateSponsorDetailsForArray(tournaments);
    res.json(formatted);
  } catch (err) {
    console.error("FETCH TOURNAMENTS ERROR:", err);
    res.status(500).json({ message: "Failed to load tournaments" });
  }
};

exports.getPublicTournamentById = async (req, res, next) => {
  try {
    await checkAndUpdateTournamentStatuses();
    const tournament = await Tournament.findOne({ _id: req.params.id, paymentStatus: "Paid" })
      .populate("sportId", "name")
      .populate("teams", "teamName")
      .populate("venueId", "name");

    if (!tournament) {
      return res.status(404).json({ message: "Tournament not found" });
    }

    const formatted = await populateSponsorDetails(tournament);
    res.json(formatted);
  } catch (err) {
    console.error("FETCH TOURNAMENT ERROR:", err);
    res.status(500).json({ message: "Failed to fetch tournament" });
  }
};

exports.getTournaments = async (req, res, next) => {
  try {
    await checkAndUpdateTournamentStatuses();
    let query = {};
    if (req.user.role !== "admin") {
      query = {
        $or: [
          { paymentStatus: "Paid" },
          { createdBy: req.user.userId },
          { organizerId: req.user.userId }
        ]
      };
    }
    const tournaments = await Tournament.find(query)
      .populate("sportId", "name")
      .populate("teams", "teamName")
      .populate("venueId", "name")
      .sort({ createdAt: -1 });

    const formatted = await populateSponsorDetailsForArray(tournaments);
    
    // Admins and organizers should also see pending creation transactions
    let txQuery = { paymentType: "tournament_creation", status: "created" };
    if (req.user.role !== "admin") {
      txQuery.userId = req.user.userId;
    }
    const pendingTxs = await Transaction.find(txQuery);
    
    const Sport = require("../models/Sport");
    const Venue = require("../models/Venue");

    const pendingTournaments = await Promise.all(pendingTxs.map(async (tx) => {
      const sport = await Sport.findById(tx.tempData.sportId).select("name");
      const venue = await Venue.findById(tx.tempData.venueId).select("name");

      return {
        _id: tx._id,
        eventName: tx.tempData.eventName,
        sportId: sport ? { _id: sport._id, name: sport.name } : null,
        venueId: venue ? { _id: venue._id, name: venue.name } : null,
        location: tx.tempData.location,
        startDate: tx.tempData.startDate,
        endDate: tx.tempData.endDate,
        maxParticipants: tx.tempData.maxParticipants,
        description: tx.tempData.description,
        rules: tx.tempData.rules,
        logo: tx.tempData.logo,
        paymentStatus: "Pending",
        status: "upcoming",
        teams: [],
        prizePool: 0,
        razorpayOrderId: tx.razorpayOrderId,
        isPendingTx: true
      };
    }));

    res.json([...formatted, ...pendingTournaments]);
  } catch (err) {
    console.error("FETCH TOURNAMENTS ERROR:", err);
    res.status(500).json({ message: "Failed to load tournaments" });
  }
};

exports.getTournamentById = async (req, res, next) => {
  try {
    await checkAndUpdateTournamentStatuses();
    let tournament = await Tournament.findById(req.params.id)
      .populate("sportId", "name")
      .populate("teams", "teamName")
      .populate("venueId", "name");

    if (!tournament) {
      const mongoose = require("mongoose");
      if (mongoose.Types.ObjectId.isValid(req.params.id)) {
        const tx = await Transaction.findOne({
          _id: req.params.id,
          paymentType: "tournament_creation"
        });
        if (tx) {
          const Sport = require("../models/Sport");
          const Venue = require("../models/Venue");
          const sport = await Sport.findById(tx.tempData.sportId).select("name");
          const venue = await Venue.findById(tx.tempData.venueId).select("name");

          const mockTournament = {
            _id: tx._id,
            eventName: tx.tempData.eventName,
            sportId: sport ? { _id: sport._id, name: sport.name } : null,
            venueId: venue ? { _id: venue._id, name: venue.name } : null,
            location: tx.tempData.location,
            startDate: tx.tempData.startDate,
            endDate: tx.tempData.endDate,
            maxParticipants: tx.tempData.maxParticipants,
            description: tx.tempData.description,
            rules: tx.tempData.rules,
            logo: tx.tempData.logo,
            paymentStatus: "Pending",
            status: "upcoming",
            teams: [],
            prizePool: 0,
            razorpayOrderId: tx.razorpayOrderId,
            isPendingTx: true
          };
          return res.json(mockTournament);
        }
      }
      return res.status(404).json({ message: "Tournament not found" });
    }

    if (tournament.paymentStatus !== "Paid") {
      let currentUser = null;
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        try {
          const token = authHeader.split(" ")[1];
          currentUser = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
          // ignore
        }
      }
      const isAdmin = currentUser && currentUser.role === "admin";
      const isCreator = currentUser && tournament.createdBy && tournament.createdBy.toString() === currentUser.userId;
      const isOrganizer = currentUser && tournament.organizerId && tournament.organizerId.toString() === currentUser.userId;

      if (!isAdmin && !isCreator && !isOrganizer) {
        return res.status(404).json({ message: "Tournament not found" });
      }
    }

    const formatted = await populateSponsorDetails(tournament);
    res.json(formatted);
  } catch (err) {
    console.error("FETCH TOURNAMENT ERROR:", err);
    res.status(500).json({ message: "Failed to fetch tournament" });
  }
};

exports.verifyTournamentPayment = async (req, res) => {
  try {
    if (!razorpay) {
      return res.status(503).json({ 
        success: false, 
        message: "Payment service not configured" 
      });
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      transactionId,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !transactionId) {
      return res.status(400).json({ success: false, message: "Missing verification payload" });
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;
    if (!isAuthentic) {
      return res.status(400).json({ success: false, message: "Payment signature verification failed" });
    }

    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({ success: false, message: "Transaction not found" });
    }

    if (transaction.status === "paid") {
      return res.status(400).json({ success: false, message: "Transaction has already been paid and verified" });
    }

    if (transaction.userId.toString() !== req.user.userId) {
      return res.status(403).json({ success: false, message: "Unauthorized: You do not own this transaction" });
    }

    const expectedAmount = Number(process.env.ORGANIZER_TOURNAMENT_CREATION_FEE || 50000);
    if (transaction.amount !== expectedAmount) {
      return res.status(400).json({ success: false, message: "Transaction amount mismatch" });
    }

    const tempData = transaction.tempData;
    if (!tempData) {
      return res.status(400).json({ success: false, message: "Missing tournament data in transaction" });
    }

    const newTournament = await Tournament.create({
      eventName: tempData.eventName,
      sportId: tempData.sportId,
      venueId: tempData.venueId,
      location: tempData.location,
      startDate: tempData.startDate,
      endDate: tempData.endDate,
      maxParticipants: tempData.maxParticipants,
      description: tempData.description,
      rules: tempData.rules,
      organizerId: tempData.organizerId,
      createdBy: tempData.createdBy,
      logo: tempData.logo,
      status: "upcoming",
      teams: [],
      prizePool: 0,
      teamRegistrationFee: tempData.teamRegistrationFee || 0,
      paymentStatus: "Paid",
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      amountPaid: expectedAmount,
      paymentDate: new Date(),
    });

    transaction.status = "paid";
    transaction.tournamentId = newTournament._id;
    transaction.razorpayPaymentId = razorpay_payment_id;
    transaction.razorpaySignature = razorpay_signature;
    transaction.updatedAt = Date.now();
    await transaction.save();

    triggerDashboardUpdate(req, "tournament_created");
    res.status(201).json({
      success: true,
      message: "Tournament payment verified and created successfully",
      tournament: newTournament
    });
  } catch (error) {
    console.error("verifyTournamentPayment error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateTournament = async (req, res, next) => {
  try {
    const mongoose = require("mongoose");
    let isPending = false;
    let tx = null;
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      tx = await Transaction.findOne({
        _id: req.params.id,
        paymentType: "tournament_creation",
        status: "created"
      });
      if (tx) {
        isPending = true;
      }
    }

    if (isPending) {
      const { eventName, sportId, venueId, location, startDate, endDate, maxParticipants, description, rules, organizerId } = req.body;
      
      let logoUrl = tx.tempData.logo || "";
      if (req.file) {
        const localPath = path.resolve(req.file.path);
        const result = await cloudinary.uploader.upload(localPath, {
          folder: "tournament_logos",
        });
        logoUrl = result.secure_url;
        fs.unlinkSync(localPath);
      }

      const updatedTempData = {
        ...tx.tempData,
        eventName: eventName !== undefined ? eventName : tx.tempData.eventName,
        sportId: sportId !== undefined ? sportId : tx.tempData.sportId,
        venueId: venueId !== undefined ? venueId : tx.tempData.venueId,
        location: location !== undefined ? location : tx.tempData.location,
        startDate: startDate !== undefined ? startDate : tx.tempData.startDate,
        endDate: endDate !== undefined ? endDate : tx.tempData.endDate,
        maxParticipants: maxParticipants !== undefined ? maxParticipants : tx.tempData.maxParticipants,
        description: description !== undefined ? description : tx.tempData.description,
        rules: rules !== undefined ? rules : tx.tempData.rules,
        organizerId: organizerId !== undefined ? organizerId : tx.tempData.organizerId,
        teamRegistrationFee: req.body.teamRegistrationFee !== undefined ? (Number(req.body.teamRegistrationFee) || 0) : tx.tempData.teamRegistrationFee,
        logo: logoUrl
      };

      tx.tempData = updatedTempData;
      tx.updatedAt = Date.now();
      await tx.save();

      return res.json({
        _id: tx._id,
        ...updatedTempData,
        paymentStatus: "Pending",
        status: "upcoming"
      });
    }

    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) {
      return res.status(404).json({ message: "Tournament not found" });
    }

    if (req.user.role === "organizer") {
      const isCreator = tournament.createdBy && tournament.createdBy.toString() === req.user.userId;
      const isAssigned = tournament.organizerId && tournament.organizerId.toString() === req.user.userId;
      if (!isCreator && !isAssigned) {
        return res.status(403).json({ message: "Access denied. You are not the creator or assigned organizer of this tournament." });
      }
    }

    if (req.body.maxParticipants) {
      const val = Number(req.body.maxParticipants);
      if (isNaN(val) || val <= 1 || (val & (val - 1)) !== 0) {
        return res.status(400).json({ message: "Tournament team count (max participants) must be a power of 2 (2, 4, 8, 16, 32, etc.)" });
      }
    }

    const updateData = {
      eventName: req.body.eventName,
      sportId: req.body.sportId,
      venueId: req.body.venueId,
      location: req.body.location,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      maxParticipants: req.body.maxParticipants,
      description: req.body.description,
      rules: req.body.rules,
      status: req.body.status,
      organizerId: req.body.organizerId,
      teamRegistrationFee: req.body.teamRegistrationFee !== undefined ? (Number(req.body.teamRegistrationFee) || 0) : undefined,
    };

    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key]
    );

    if (req.file) {
      try {
        const localPath = path.resolve(req.file.path);
        const result = await cloudinary.uploader.upload(localPath, {
          folder: "tournament_logos",
          resource_type: "image",
        });
        updateData.logo = result.secure_url;
        fs.unlinkSync(localPath);
      } catch (uploadError) {
        console.error("Cloudinary upload error:", uploadError);
      }
    }

    const updatedTournament = await Tournament.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!updatedTournament) {
      return res.status(404).json({ message: "Tournament not found" });
    }

    triggerDashboardUpdate(req, "tournament_updated");
    res.json(updatedTournament);
  } catch (err) {
    console.error("UPDATE TOURNAMENT ERROR:", err);
    res.status(500).json({ message: "Tournament update failed" });
  }
};

exports.deleteTournament = async (req, res, next) => {
  try {
    const mongoose = require("mongoose");
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      const tx = await Transaction.findOneAndDelete({
        _id: req.params.id,
        paymentType: "tournament_creation",
        status: "created"
      });
      if (tx) {
        return res.json({ message: "Pending tournament transaction deleted successfully" });
      }
    }

    const deleted = await Tournament.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: "Tournament not found" });
    }

    triggerDashboardUpdate(req, "tournament_deleted");
    res.json({ message: "Tournament deleted successfully" });
  } catch (err) {
    console.error("DELETE TOURNAMENT ERROR:", err);
    res.status(500).json({ message: "Tournament deletion failed" });
  }
};

exports.getMatchesByTournament = async (req, res, next) => {
  try {
    const matches = await Match.find({ tournamentId: req.params.id })
      .populate("teams", "teamName")
      .populate("venueId", "name");

    res.json(matches);
  } catch (err) {
    console.error("FETCH MATCHES ERROR:", err);
    res.status(500).json({ message: "Failed to load matches" });
  }
};

exports.getRoundInfo = async (req, res, next) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) {
      return res.status(404).json({ message: "Tournament not found" });
    }

    if (req.user.role === "organizer") {
      const isCreator = tournament.createdBy && tournament.createdBy.toString() === req.user.userId;
      const isAssigned = tournament.organizerId && tournament.organizerId.toString() === req.user.userId;
      if (!isCreator && !isAssigned) {
        return res.status(403).json({ message: "Access denied. You are not the creator or assigned organizer of this tournament." });
      }
    }

    const roundInfo = await getTournamentRoundInfo(req.params.id);
    res.json(roundInfo);
  } catch (err) {
    console.error("GET ROUND INFO ERROR:", err);
    res.status(500).json({ message: err.message || "Failed to load round info" });
  }
};
