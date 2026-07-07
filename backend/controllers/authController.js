const User = require("../models/User");
const PendingUser = require("../models/PendingUser");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { validateEmail, validatePassword, validateName } = require("../utils/validators");
const { sendVerificationEmail, sendResetPasswordEmail, sendWelcomeEmail, sendRegistrationEmailOtp } = require("../config/email");
const EmailOtp = require("../models/EmailOtp");

exports.register = async (req, res, next) => {
  try {
    const { name, email, phoneNumber, password, role } = req.body;
    
    // Validations (handled by express-validator)


    // Check existing user by email or phone
    const existingEmailUser = await User.findOne({ email });
    if (existingEmailUser) {
      return res.status(400).json({ message: "Email already registered. Please use a different email or login." });
    }
    const existingPhoneUser = await User.findOne({ phoneNumber });
    if (existingPhoneUser) {
      return res.status(400).json({ message: "Phone number already registered. Please use a different number or login." });
    }

    // Check if email has been verified via OTP
    const otpDoc = await EmailOtp.findOne({ email: email.toLowerCase(), verified: true });
    if (!otpDoc) {
      return res.status(400).json({ message: "Email has not been verified. Please verify your email first." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new active user
    const user = new User({
      name,
      email,
      phoneNumber,
      password: hashedPassword,
      role: role || "player",
      status: role === "sponsor" ? "Pending Approval" : "active",
      emailVerified: true,
      isPhoneVerified: false // OTP was email-based
    });
    
    await user.save();

    // Clean up OTP document
    await EmailOtp.deleteOne({ email: email.toLowerCase() });

    console.log(`\n✅ Registration successful for ${email}\n`);

    // Send welcome email
    if (user.email) {
      await sendWelcomeEmail(user.email, user.name);
    }

    res.json({ 
      success: true,
      message: "Registration successful! You can now login."
    });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ message: "Registration failed. Please try again." });
  }
};

exports.checkEmail = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    const user = await User.findOne({ email });
    res.json({ available: !user });
  } catch (err) {
    console.error("Email check error:", err);
    res.status(500).json({ message: "Error checking email availability" });
  }
};

exports.sendEmailOtp = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered. Please use a different email or login." });
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(otpCode, 10);
    const otpExpiry = Date.now() + 5 * 60 * 1000; // 5 minutes

    // Store in collection
    await EmailOtp.findOneAndUpdate(
      { email: email.toLowerCase() },
      { 
        otpCode: hashedOtp, 
        otpExpiry, 
        verified: false, 
        otpAttempts: 0, 
        createdAt: Date.now() // resets TTL index
      },
      { upsert: true, new: true }
    );

    // ✉️ Show OTP in console for testing
    console.log("\n" + "=".repeat(60));
    console.log(`✉️ EMAIL VERIFICATION OTP`);
    console.log("=".repeat(60));
    console.log(`✉️ To: ${email}`);
    console.log(`🔐 OTP Code: ${otpCode}`);
    console.log(`⏰ Expires in: 5 minutes`);
    console.log("=".repeat(60) + "\n");

    // Send email
    const emailSent = await sendRegistrationEmailOtp(email, otpCode);
    if (!emailSent) {
      console.log(`⚠️ Email sending failed, but OTP is shown above for testing.`);
    }

    res.json({
      success: true,
      message: "OTP sent successfully",
      testCode: process.env.NODE_ENV !== "production" ? otpCode : undefined
    });
  } catch (err) {
    console.error("SEND EMAIL OTP ERROR:", err);
    res.status(500).json({ message: "Failed to send OTP. Please try again." });
  }
};

exports.verifyEmailOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    const otpDoc = await EmailOtp.findOne({ email: email.toLowerCase() });
    if (!otpDoc) {
      return res.status(400).json({ message: "OTP expired or not found. Please request a new one." });
    }

    if (otpDoc.otpExpiry < Date.now()) {
      return res.status(400).json({ message: "OTP has expired. Please request a new one." });
    }

    if (otpDoc.verified) {
      return res.status(400).json({ message: "Email already verified." });
    }

    if (otpDoc.otpAttempts >= 5) {
      return res.status(429).json({ message: "Too many verification attempts. Please request a new OTP." });
    }

    // Increment attempts
    otpDoc.otpAttempts += 1;
    await otpDoc.save();

    // Verify OTP code
    const isMatch = await bcrypt.compare(otp, otpDoc.otpCode);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid OTP. Please try again." });
    }

    // OTP matches: mark verified and delete code to prevent reuse
    otpDoc.verified = true;
    otpDoc.otpCode = "verified"; // invalidate code
    await otpDoc.save();

    res.json({
      success: true,
      message: "Email verified successfully"
    });
  } catch (err) {
    console.error("VERIFY EMAIL OTP ERROR:", err);
    res.status(500).json({ message: "Verification failed. Please try again." });
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if sponsor is approved
    if (user.role === "sponsor" && user.status !== "active") {
      return res.status(403).json({ message: "Your Sponsor account is awaiting Admin approval." });
    }

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
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

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
};

exports.resendResetOtp = async (req, res, next) => {
  try {
    const { email } = req.body;

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
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { email, code, newPassword } = req.body;

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
};
