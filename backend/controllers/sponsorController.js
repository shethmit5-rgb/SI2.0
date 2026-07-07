const Sponsor = require("../models/Sponsor");
const Tournament = require("../models/Tournament");
const cloudinary = require("../config/cloudinary");
const fs = require("fs");
const path = require("path");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const { triggerDashboardUpdate } = require("../utils/tournamentHelper");


let razorpay = null;
try {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
} catch (error) {
  console.log("⚠️ Razorpay not configured in sponsorController.js");
}

exports.createSponsor = async (req, res, next) => {
  try {
    const { name, amount, tournamentId } = req.body;

    // Validated in validator schema

    // ✅ Check if user is admin OR tournament organizer
    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({ message: "Tournament not found" });
    }

    if (req.user.role !== "admin" && tournament.organizerId.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Only admin or tournament organizer can add sponsors" });
    }

    let logoUrl = "";

    // Upload to Cloudinary if file exists
    if (req.file) {
      try {
        const localPath = path.resolve(req.file.path);
        const result = await cloudinary.uploader.upload(localPath, {
          folder: "sponsor_logos",
          resource_type: "image",
        });
        logoUrl = result.secure_url;
        fs.unlinkSync(localPath);
      } catch (uploadError) {
        console.error("Cloudinary upload error:", uploadError);
      }
    }

    const sponsor = new Sponsor({
      name,
      amount: Number(amount),
      tournamentId,
      logo: logoUrl,
    });

    await sponsor.save();

    // 🔥 UPDATE PRIZE POOL
    await Tournament.findByIdAndUpdate(tournamentId, {
      $inc: { prizePool: Number(amount) },
    });

    triggerDashboardUpdate(req, "sponsor_created");
    res.status(201).json({ message: "Sponsor added successfully", sponsor });

  } catch (err) {
    console.error("CREATE SPONSOR ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.getSponsors = async (req, res, next) => {
  try {
    let sponsors;
    
    if (req.user.role === "admin") {
      // Admin sees all sponsors
      sponsors = await Sponsor.find().populate("tournamentId", "eventName sportId startDate");
    } else {
      // Organizer only sees sponsors for their tournaments
      const tournaments = await Tournament.find({ organizerId: req.user.userId });
      const tournamentIds = tournaments.map(t => t._id);
      sponsors = await Sponsor.find({ tournamentId: { $in: tournamentIds } }).populate("tournamentId", "eventName sportId startDate");
    }
    
    res.json(sponsors);
  } catch (err) {
    console.error("GET SPONSORS ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.getSponsorshipStats = async (req, res, next) => {
  try {
    let sponsors;
    
    if (req.user.role === "admin") {
      // Admin sees all sponsors
      sponsors = await Sponsor.find().populate("tournamentId", "eventName");
    } else {
      // Organizer only sees sponsors for their tournaments
      const tournaments = await Tournament.find({ organizerId: req.user.userId });
      const tournamentIds = tournaments.map(t => t._id);
      sponsors = await Sponsor.find({ tournamentId: { $in: tournamentIds } }).populate("tournamentId", "eventName");
    }
    
    // Group sponsors by tournament for chart data
    const tournamentStats = {};
    
    sponsors.forEach(sponsor => {
      const tournamentName = sponsor.tournamentId?.eventName || "Unknown Tournament";
      const amount = sponsor.amount || 0;
      
      if (tournamentStats[tournamentName]) {
        tournamentStats[tournamentName] += amount;
      } else {
        tournamentStats[tournamentName] = amount;
      }
    });
    
    // Convert to array format for chart
    const chartData = Object.entries(tournamentStats).map(([eventName, totalAmount]) => ({
      eventName,
      amount: totalAmount,
    }));
    
    // Calculate total and additional stats
    const totalSponsorship = sponsors.reduce((sum, s) => sum + (s.amount || 0), 0);
    const averageSponsorship = sponsors.length > 0 ? totalSponsorship / sponsors.length : 0;
    
    res.json({
      chartData,
      summary: {
        totalSponsors: sponsors.length,
        totalSponsorship,
        averageSponsorship,
      }
    });
  } catch (err) {
    console.error("GET SPONSORSHIP STATS ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.getPublicSponsors = async (req, res, next) => {
  try {
    const sponsors = await Sponsor.find().populate("tournamentId", "eventName");
    res.json(sponsors);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateSponsor = async (req, res, next) => {
  try {
    const sponsor = await Sponsor.findById(req.params.id).populate("tournamentId");
    if (!sponsor) return res.status(404).json({ message: "Sponsor not found" });

    // ✅ Check permission
    if (req.user.role !== "admin" && sponsor.tournamentId.organizerId.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Only admin or tournament organizer can update sponsors" });
    }

    const oldAmount = sponsor.amount;
    const newAmount = Number(req.body.amount) || oldAmount;
    const diff = newAmount - oldAmount;

    sponsor.name = req.body.name || sponsor.name;
    sponsor.amount = newAmount;

    // Upload new logo to Cloudinary if provided
    if (req.file) {
      try {
        const localPath = path.resolve(req.file.path);
        const result = await cloudinary.uploader.upload(localPath, {
          folder: "sponsor_logos",
          resource_type: "image",
        });
        sponsor.logo = result.secure_url;
        fs.unlinkSync(localPath);
      } catch (uploadError) {
        console.error("Cloudinary upload error:", uploadError);
      }
    }

    await sponsor.save();

    // 🔥 UPDATE PRIZE POOL DIFFERENCE
    if (diff !== 0) {
      await Tournament.findByIdAndUpdate(sponsor.tournamentId, {
        $inc: { prizePool: diff },
      });
    }

    triggerDashboardUpdate(req, "sponsor_updated");
    res.json({ message: "Sponsor updated successfully", sponsor });

  } catch (err) {
    console.error("UPDATE SPONSOR ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.deleteSponsor = async (req, res, next) => {
  try {
    const sponsor = await Sponsor.findById(req.params.id).populate("tournamentId");
    if (!sponsor) return res.status(404).json({ message: "Sponsor not found" });

    // ✅ Check permission
    if (req.user.role !== "admin" && sponsor.tournamentId.organizerId.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Only admin or tournament organizer can delete sponsors" });
    }

    // Update prize pool by subtracting sponsor amount
    await Tournament.findByIdAndUpdate(sponsor.tournamentId, {
      $inc: { prizePool: -sponsor.amount },
    });

    await sponsor.deleteOne();
    triggerDashboardUpdate(req, "sponsor_deleted");
    res.json({ message: "Sponsor removed successfully" });

  } catch (err) {
    console.error("DELETE SPONSOR ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.getSponsorsByTournament = async (req, res, next) => {
  try {
    const sponsors = await Sponsor.find({ tournamentId: req.params.tournamentId, status: "active" });
    res.json(sponsors);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getPublicSponsorsByTournament = async (req, res, next) => {
  try {
    const sponsors = await Sponsor.find({ tournamentId: req.params.tournamentId, status: "active" });
    res.json(sponsors);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.selfSponsor = async (req, res, next) => {
  try {
    const { brandName, tournamentId, type, winnerPrize, runnerUpPrize, equipment, amount } = req.body;

    // Validated in validator schema

    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({ message: "Tournament not found" });
    }

    // 1. Check Date restriction: currentDate >= tournament.startDate
    if (new Date() >= new Date(tournament.startDate)) {
      return res.status(400).json({ message: "Sponsorship is closed because the tournament has already started." });
    }

    // 2. Validate sponsor-specific rules
    if (type === "title") {
      // Only one active Title Sponsor per tournament
      const activeTitle = await Sponsor.findOne({ tournamentId, type: "title", status: "active" });
      if (activeTitle) {
        return res.status(400).json({ message: "This tournament already has a Title Sponsor." });
      }

      // Only one pending Title Sponsor request by the same sponsor
      const pendingTitle = await Sponsor.findOne({
        tournamentId,
        sponsorId: req.user.userId,
        type: "title",
        status: "pending"
      });
      if (pendingTitle) {
        return res.status(400).json({ message: "You already have a pending Title Sponsor request for this tournament." });
      }
    } else if (type === "inkind") {
      if (!equipment) {
        return res.status(400).json({ message: "Equipment description is required for In-Kind sponsorship." });
      }

      // Multiple In-Kind allowed only if they are sponsoring different equipment categories
      const existingInKind = await Sponsor.findOne({
        tournamentId,
        sponsorId: req.user.userId,
        type: "inkind",
        equipment: equipment.trim(),
        status: { $in: ["active", "pending"] }
      });
      if (existingInKind) {
        return res.status(400).json({ message: "You are already sponsoring this equipment category for this tournament." });
      }
    } else {
      return res.status(400).json({ message: "Invalid sponsorship type." });
    }

    // Calculate total amount
    let totalAmount = 0;
    if (type === "title") {
      totalAmount = Number(winnerPrize) + Number(runnerUpPrize);
    } else {
      totalAmount = Number(amount);
    }

    if (isNaN(totalAmount) || totalAmount <= 0) {
      return res.status(400).json({ message: "Sponsorship amount must be a positive number." });
    }

    // Upload logo
    let logoUrl = "";
    if (req.file) {
      try {
        const localPath = path.resolve(req.file.path);
        const result = await cloudinary.uploader.upload(localPath, {
          folder: "sponsor_logos",
          resource_type: "image",
        });
        logoUrl = result.secure_url;
        fs.unlinkSync(localPath);
      } catch (uploadError) {
        console.error("Cloudinary upload error:", uploadError);
      }
    }

    // Create Razorpay order
    if (!razorpay) {
      return res.status(503).json({ message: "Razorpay service not configured." });
    }

    let order;
    const isDummyKey = !process.env.RAZORPAY_KEY_ID || 
                       process.env.RAZORPAY_KEY_ID.includes("xxxx") || 
                       process.env.RAZORPAY_KEY_ID === "rzp_test_xxxxxxxxxxxxx";

    if (isDummyKey) {
      console.warn("⚠️ Dummy Razorpay keys detected in .env. Mocking order creation for local testing.");
      order = {
        id: `order_mock_${Date.now()}`,
        amount: totalAmount * 100,
        currency: "INR",
      };
    } else {
      const orderOptions = {
        amount: totalAmount * 100, // paise
        currency: "INR",
        receipt: `receipt_self_sponsor_${Date.now()}`,
      };
      order = await razorpay.orders.create(orderOptions);
    }

    // Save pending Sponsor
    const sponsor = new Sponsor({
      name: brandName,
      amount: totalAmount,
      logo: logoUrl,
      tournamentId,
      sponsorId: req.user.userId,
      type,
      winnerPrize: type === "title" ? Number(winnerPrize) : 0,
      runnerUpPrize: type === "title" ? Number(runnerUpPrize) : 0,
      equipment: type === "inkind" ? equipment.trim() : undefined,
      razorpayOrderId: order.id,
      status: "pending",
    });

    await sponsor.save();

    res.status(201).json({
      success: true,
      order,
      sponsorId: sponsor._id,
    });

  } catch (err) {
    console.error("SELF SPONSOR ERROR:", err);
    res.status(500).json({ message: err.message || "Failed to initiate sponsorship." });
  }
};

exports.verifySelfPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, sponsorId } = req.body;

    // Validated in validator schema

    const sponsor = await Sponsor.findById(sponsorId);
    if (!sponsor) {
      return res.status(404).json({ message: "Sponsor record not found." });
    }

    // Verify signature
    let isAuthentic = false;
    const isMockOrder = razorpay_order_id.startsWith("order_mock_");

    if (isMockOrder) {
      console.warn("⚠️ Verifying mock Razorpay payment signature for local testing.");
      isAuthentic = true;
    } else {
      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest("hex");

      isAuthentic = expectedSignature === razorpay_signature;
    }

    if (isAuthentic) {
      sponsor.status = "active";
      sponsor.razorpayPaymentId = razorpay_payment_id;
      sponsor.razorpaySignature = razorpay_signature;
      await sponsor.save();

      triggerDashboardUpdate(req, "sponsorship_payment_completed");
      res.json({
        success: true,
        message: "Payment verified successfully. Sponsorship is now active.",
      });

    } else {
      sponsor.status = "failed";
      await sponsor.save();

      res.status(400).json({
        success: false,
        message: "Payment signature verification failed.",
      });
    }
  } catch (err) {
    console.error("VERIFY SELF PAYMENT ERROR:", err);
    res.status(500).json({ message: err.message || "Verification failed." });
  }
};

exports.getMySponsorships = async (req, res, next) => {
  try {
    const sponsorships = await Sponsor.find({ sponsorId: req.user.userId })
      .populate("tournamentId", "eventName status startDate")
      .sort({ createdAt: -1 });

    res.json(sponsorships);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getSponsorById = async (req, res, next) => {
  try {
    const sponsor = await Sponsor.findById(req.params.id).populate("tournamentId", "eventName organizerId");
    
    if (!sponsor) {
      return res.status(404).json({ message: "Sponsor not found" });
    }
    
    if (req.user.role !== "admin") {
      const tournament = await Tournament.findById(sponsor.tournamentId);
      if (tournament && tournament.organizerId.toString() !== req.user.userId) {
        return res.status(403).json({ message: "Access denied" });
      }
    }
    
    res.json(sponsor);
  } catch (err) {
    console.error("GET SPONSOR ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};
