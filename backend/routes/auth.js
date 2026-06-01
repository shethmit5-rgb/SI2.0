const express = require("express");
const router = express.Router();
const User = require("../models/User");
const PendingUser = require("../models/PendingUser");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { validateEmail, validatePassword, validateName } = require("../utils/validators");
const { sendVerificationEmail, sendResetPasswordEmail, sendWelcomeEmail } = require("../config/email");
const { sendOTP } = require("../utils/twilioService");

// ================= REGISTER WITH MOBILE OTP =================
router.post("/register", async (req, res) => {
  try {
    const { name, email, phoneNumber, password, role } = req.body;
    
    // Validations
    const nameError = validateName(name);
    if (nameError) return res.status(400).json({ message: nameError });
    
    const emailError = validateEmail(email);
    if (emailError) return res.status(400).json({ message: emailError });
    
    if (!phoneNumber || !/^\+[1-9]\d{1,14}$/.test(phoneNumber)) {
      return res.status(400).json({ message: "Valid phone number with country code is required (e.g. +919876543210)" });
    }

    const passwordError = validatePassword(password);
    if (passwordError) return res.status(400).json({ message: passwordError });

    // Check existing user by email or phone
    const existingEmailUser = await User.findOne({ email });
    if (existingEmailUser) {
      return res.status(400).json({ message: "Email already registered. Please use a different email or login." });
    }
    const existingPhoneUser = await User.findOne({ phoneNumber });
    if (existingPhoneUser) {
      return res.status(400).json({ message: "Phone number already registered. Please use a different number or login." });
    }

    // Check if there is an existing pending user for this email
    let pendingEmailUser = await PendingUser.findOne({ email });
    if (pendingEmailUser && pendingEmailUser.phoneNumber !== phoneNumber) {
      return res.status(400).json({ message: "A pending registration exists for this email. Please use a different email or wait 10 minutes." });
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = Date.now() + 5 * 60 * 1000; // 5 minutes

    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if there is an existing pending user for this phone
    let pendingUser = await PendingUser.findOne({ phoneNumber });
    if (pendingUser) {
      // Update existing pending user
      pendingUser.name = name;
      pendingUser.email = email;
      pendingUser.password = hashedPassword;
      pendingUser.role = role || "player";
      pendingUser.otpCode = otpCode;
      pendingUser.otpExpiry = otpExpiry;
      pendingUser.otpAttempts = 0;
      pendingUser.createdAt = Date.now(); // reset TTL
      await pendingUser.save();
    } else {
      // Create new pending user
      pendingUser = new PendingUser({
        name,
        email,
        phoneNumber,
        password: hashedPassword,
        role: role || "player",
        otpCode,
        otpExpiry,
        otpAttempts: 0
      });
      await pendingUser.save();
    }

    // 📱 Show OTP in console for testing
    console.log("\n" + "=".repeat(60));
    console.log(`📱 MOBILE VERIFICATION OTP`);
    console.log("=".repeat(60));
    console.log(`📱 To: ${phoneNumber}`);
    console.log(`👤 Name: ${name}`);
    console.log(`🔐 OTP Code: ${otpCode}`);
    console.log(`⏰ Expires in: 5 minutes`);
    console.log("=".repeat(60) + "\n");

    // Send SMS via Twilio
    const smsSent = await sendOTP(phoneNumber, otpCode);
    
    if (!smsSent) {
      console.log(`⚠️ SMS sending failed, but OTP is shown above for testing.`);
    } else {
      console.log(`✅ Verification SMS sent to ${phoneNumber}`);
    }

    res.json({ 
      success: true,
      message: "Registration successful! We've sent an OTP to your mobile number.",
      requiresPhoneVerification: true,
      phoneNumber: phoneNumber,
      email: email,
      testCode: process.env.NODE_ENV !== "production" ? otpCode : undefined
    });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ message: "Registration failed. Please try again." });
  }
});

// ================= CHECK EMAIL AVAILABILITY =================
router.post("/check-email", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    
    const user = await User.findOne({ email });
    res.json({ available: !user });
  } catch (err) {
    console.error("Email check error:", err);
    res.status(500).json({ message: "Error checking email availability" });
  }
});

// ================= VERIFY PHONE OTP =================
router.post("/verify-phone", async (req, res) => {
  try {
    const { phoneNumber, code } = req.body;
    
    if (!phoneNumber || !code) {
      return res.status(400).json({ message: "Phone number and OTP code are required" });
    }
    
    const pendingUser = await PendingUser.findOne({ phoneNumber });

    if (!pendingUser) {
      return res.status(404).json({ message: "Registration expired or not found. Please register again." });
    }

    if (pendingUser.otpCode !== code) {
      return res.status(400).json({ message: "Invalid OTP. Please try again." });
    }

    if (pendingUser.otpExpiry < Date.now()) {
      return res.status(400).json({ message: "OTP has expired. Please register again." });
    }

    // Move pending user to actual User collection
    const user = new User({
      name: pendingUser.name,
      email: pendingUser.email,
      phoneNumber: pendingUser.phoneNumber,
      password: pendingUser.password, // already hashed
      role: pendingUser.role,
      status: "active",
      isPhoneVerified: true,
      emailVerified: false
    });
    
    await user.save();
    await PendingUser.deleteOne({ _id: pendingUser._id });

    console.log(`\n✅ Phone verified and user created successfully for ${phoneNumber}\n`);

    // Optionally send welcome email here since we still have their email
    if (user.email) {
      await sendWelcomeEmail(user.email, user.name);
    }

    res.json({ 
      success: true,
      message: "Phone number verified successfully! You can now login." 
    });
  } catch (err) {
    console.error("Verification error:", err);
    res.status(500).json({ message: "Verification failed. Please try again." });
  }
});

// ================= RESEND PHONE OTP =================
router.post("/resend-otp", async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({ message: "Phone number is required" });
    }
    
    const pendingUser = await PendingUser.findOne({ phoneNumber });

    if (!pendingUser) {
      return res.status(404).json({ message: "Registration expired or not found. Please register again." });
    }

    if (pendingUser.otpAttempts >= 3) {
      // Allow 3 attempts, could reset after some time, but let's keep it simple
      // Check if last attempt was within 10 minutes
      if (pendingUser.otpExpiry && Date.now() < pendingUser.otpExpiry.getTime() + 10 * 60 * 1000) {
        return res.status(429).json({ message: "Maximum resend attempts reached. Please register again later." });
      } else {
        // Reset attempts if it's been a while
        pendingUser.otpAttempts = 0;
      }
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    pendingUser.otpCode = otpCode;
    pendingUser.otpExpiry = Date.now() + 5 * 60 * 1000;
    pendingUser.otpAttempts += 1;
    pendingUser.createdAt = Date.now(); // Reset TTL timer
    await pendingUser.save();

    // 📱 Show OTP in console for testing
    console.log("\n" + "=".repeat(60));
    console.log(`📱 RESEND MOBILE VERIFICATION OTP`);
    console.log("=".repeat(60));
    console.log(`📱 To: ${phoneNumber}`);
    console.log(`🔐 New OTP Code: ${otpCode}`);
    console.log(`⏰ Expires in: 5 minutes`);
    console.log("=".repeat(60) + "\n");

    // Send new SMS
    const smsSent = await sendOTP(phoneNumber, otpCode);
    
    if (!smsSent) {
      console.log(`⚠️ SMS sending failed, but OTP is shown above for testing.`);
    }

    res.json({ message: "New OTP sent successfully." });
  } catch (err) {
    console.error("Resend error:", err);
    res.status(500).json({ message: "Failed to resend code" });
  }
});

// ================= LOGIN =================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email) return res.status(400).json({ message: "Email is required" });
    if (!password) return res.status(400).json({ message: "Password is required" });

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // All users in DB are now verified. No need to check isPhoneVerified.
    
    // Check if user is blocked
    if (user.status === "blocked") {
      return res.status(403).json({ message: "Your account has been blocked by admin" });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    console.log(`\n✅ User logged in: ${email} (${user.role})\n`);

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        profileImage: user.profileImage || "",
        phoneNumber: user.phoneNumber || "",
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ message: "Login failed. Please try again." });
  }
});

// ================= FORGOT PASSWORD =================
// ================= FORGOT PASSWORD =================
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate reset code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetExpires = Date.now() + 3600000;

    user.resetPasswordCode = resetCode;
    user.resetPasswordExpires = resetExpires;
    await user.save();

    // Show OTP in console
    console.log("\n" + "=".repeat(60));
    console.log(`🔐 PASSWORD RESET OTP`);
    console.log("=".repeat(60));
    console.log(`📧 To: ${email}`);
    console.log(`📧 Name: ${user.name}`);
    console.log(`🔐 Reset Code: ${resetCode}`);
    console.log(`⏰ Expires in: 1 hour`);
    console.log("=".repeat(60) + "\n");

    // ✅ FIXED: Use correct function name
    const emailSent = await sendResetPasswordEmail(email, resetCode, user.name);
    
    if (!emailSent) {
      console.log(`⚠️ Email sending failed, but OTP is shown above for testing.`);
    }

    res.json({ 
      success: true,
      message: "Password reset code sent to your email. Check console for OTP." 
    });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ message: "Failed to process request" });
  }
});

// ================= RESEND PASSWORD RESET OTP =================
router.post("/resend-reset-otp", async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate new reset code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetExpires = Date.now() + 3600000;

    user.resetPasswordCode = resetCode;
    user.resetPasswordExpires = resetExpires;
    await user.save();

    // 📧 Show reset OTP in console for testing
    console.log("\n" + "=".repeat(60));
    console.log(`🔐 RESEND PASSWORD RESET OTP`);
    console.log("=".repeat(60));
    console.log(`📧 To: ${email}`);
    console.log(`🔐 New Reset Code: ${resetCode}`);
    console.log(`⏰ Expires in: 1 hour`);
    console.log("=".repeat(60) + "\n");

    // Send new reset email
    const emailSent = await sendResetPasswordEmail(email, resetCode, user.name);
    
    if (!emailSent) {
      console.log(`⚠️ Email sending failed, but OTP is shown above for testing.`);
    }

    res.json({ message: "New password reset code sent to your email" });
  } catch (err) {
    console.error("Resend reset OTP error:", err);
    res.status(500).json({ message: "Failed to resend code" });
  }
});

// ================= RESET PASSWORD WITH OTP =================
router.post("/reset-password", async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Validate password strength
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      return res.status(400).json({ message: passwordError });
    }

    // Find user with valid reset code
    const user = await User.findOne({
      email,
      resetPasswordCode: code,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset code" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetPasswordCode = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    console.log(`\n✅ Password reset successful for ${email}\n`);

    res.json({ 
      success: true,
      message: "Password reset successful! You can now login with your new password." 
    });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ message: "Failed to reset password" });
  }
});

module.exports = router;