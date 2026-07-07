const User = require("../models/User");
const cloudinary = require("../config/cloudinary");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const path = require("path");

/* ================= GET CURRENT USER PROFILE ================= */
exports.getProfile = async (req, res) => {
  try {
    console.log("REQ USER:", req.user);

    const user = await User.findById(req.user.userId).select("-password");

    console.log("FOUND USER:", user);

    if (!user || user.isDeleted) {
      return res.status(404).json({ message: "User not found" });
    }

    const userObj = user.toObject();

    if (user.role === "player") {
      const PrizeDistribution = require("../models/PrizeDistribution");
      const distributions = await PrizeDistribution.find({
        "playerRewards.userId": req.user.userId
      });

      let totalPrizeMoneyEarned = 0;
      let tournamentsWon = 0;
      let runnerUpFinishes = 0;
      const tournamentRewards = [];

      for (const dist of distributions) {
        const reward = dist.playerRewards.find(r => r.userId.toString() === req.user.userId.toString());
        if (reward) {
          totalPrizeMoneyEarned += reward.individualPrize;
          if (reward.position === "Winner") {
            tournamentsWon++;
          } else if (reward.position === "Runner-up") {
            runnerUpFinishes++;
          }
          tournamentRewards.push({
            distributionId: dist.distributionId,
            tournamentName: dist.snapshots.tournamentName,
            teamName: reward.position === "Winner" ? dist.snapshots.winnerTeamName : dist.snapshots.runnerUpTeamName,
            position: reward.position,
            sponsorName: dist.snapshots.sponsorName,
            brandName: dist.snapshots.brandName,
            brandLogo: dist.snapshots.brandLogo,
            winnerPrizeTotal: dist.snapshots.winnerPrizeTotal,
            runnerUpPrizeTotal: dist.snapshots.runnerUpPrizeTotal,
            individualPrize: reward.individualPrize,
            distributedAt: dist.distributedAt
          });
        }
      }

      userObj.lifetimeEarnings = {
        totalPrizeMoneyEarned,
        tournamentsWon,
        runnerUpFinishes,
        sponsoredRewardsCount: tournamentRewards.length
      };
      userObj.tournamentRewards = tournamentRewards;
    }

    res.json(userObj);
  } catch (error) {
    console.error("PROFILE ME ERROR:", error);
    res.status(500).json({ message: "Failed to fetch profile" });
  }
};

/* ================= UPDATE OWN PROFILE ================= */
exports.updateProfile = async (req, res) => {
  try {
    console.log("File received:", req.file);
    console.log("Body received:", req.body);
  
    const user = await User.findById(req.user.userId);

    if (!user || user.isDeleted) {
      return res.status(404).json({ message: "User not found" });
    }

    const allowedFields = [
      "name",
      "phoneNumber",
      "gender",
      "location",
      "description",
      "organizationName",
      "brandName",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field];
      }
    });

    if (req.file) {
      try {
        const localPath = path.resolve(req.file.path);

        const result = await cloudinary.uploader.upload(localPath, {
          folder: "profile_images",
          resource_type: "image",
          timeout: 60000,
          transformation: [
            { width: 500, height: 500, crop: "limit" },
            { quality: "auto" },
          ],
        });

        user.profileImage = result.secure_url;

        fs.unlinkSync(localPath);
      } catch (uploadError) {
        console.error("IMAGE UPLOAD ERROR:", uploadError);
        return res.status(500).json({
          message: "Image upload failed",
          error: uploadError.message,
        });
      }
    }

    await user.save();

    res.json({
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    console.error("PROFILE UPDATE ERROR:", error);
    res.status(500).json({ message: "Profile update failed" });
  }
};

/* ================= CHANGE PASSWORD ================= */
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Hash new password
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    console.error("Password change error:", err);
    res.status(500).json({ message: "Failed to change password" });
  }
};

/* ================= SOFT DELETE ACCOUNT ================= */
exports.deactivateAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.isDeleted = true;
    await user.save();

    res.json({ message: "Account deactivated successfully" });
  } catch {
    res.status(500).json({ message: "Failed to deactivate account" });
  }
};
