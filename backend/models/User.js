const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      minlength: [3, "Name must be at least 3 characters"],
      trim: true,
    },

    age: {
      type: Number,
      min: [10, "Age must be at least 10"],
      max: [100, "Age cannot exceed 100"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\S+@\S+\.\S+$/,
        "Please enter a valid email address",
      ],
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
    },

    gender: {
      type: String,
      enum: ["male", "female", "other", "prefer-not-to-say"],
    },

    phoneNumber: {
      type: String,
      required: [true, "Phone number is required"],
      unique: true,
      match: [/^\+[1-9]\d{1,14}$/, "Phone number must include country code and be valid (e.g. +919876543210)"],
    },
    isPhoneVerified: {
      type: Boolean,
      default: false
    },
    otpCode: String,
    otpExpiry: Date,
    otpAttempts: {
      type: Number,
      default: 0
    },
    emailVerified: {
      type: Boolean,
      default: false
    },
    verificationCode: String,
    verificationCodeExpires: Date,

    resetPasswordCode: {
      type: String
    },
    resetPasswordExpires: {
      type: Date
    },

    location: {
      type: String,
      // trim: true,
    },

    description: {
      type: String,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },

    organizationName: {
      type: String,
      default: "",
    },

    brandName: {
      type: String,
      default: "",
    },

    profileImage: {
      type: String,
      default: "",
    },

    sports: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Sport",
      },
    ],

    role: {
      type: String,
      enum: ["player", "coach", "organizer", "admin", "sponsor"],
      default: "player",
    },

    status: {
      type: String,
      enum: ["active", "blocked", "Pending Approval", "rejected", "inactive"],
      default: "active",
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },


  },
  {
    timestamps: true, // automatically adds createdAt & updatedAt
  }
);

module.exports = mongoose.model("User", UserSchema);