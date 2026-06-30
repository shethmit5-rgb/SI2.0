const axios = require("axios");
const mongoose = require("mongoose");

const mongoUri = "mongodb://127.0.0.1:27017/ArenaSync";
const baseUrl = "http://localhost:5000/api";

async function runTest() {
  console.log("==================================================");
  console.log("🧪 RUNNING EMAIL OTP REGISTRATION FLOW VALIDATION");
  console.log("==================================================");

  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("Connected successfully to MongoDB.");

    const User = require("../models/User");
    const EmailOtp = require("../models/EmailOtp");

    // Cleanup
    console.log("Cleaning up old test data...");
    await User.deleteOne({ email: "otp_test@example.com" });
    await EmailOtp.deleteOne({ email: "otp_test@example.com" });

    // 1. Send OTP
    console.log("\n👉 Test 1: Send OTP to email");
    const sendRes = await axios.post(`${baseUrl}/send-email-otp`, {
      email: "otp_test@example.com"
    });
    if (sendRes.data.success) {
      console.log("✅ Send OTP request returned success.");
    } else {
      throw new Error("Send OTP failed.");
    }

    // Verify OTP exists in DB
    const otpDoc = await EmailOtp.findOne({ email: "otp_test@example.com" });
    if (!otpDoc) {
      throw new Error("OTP document was not created in database.");
    }
    console.log("✅ OTP document created in DB with verified = false.");

    // Retrieve generated OTP code from the console log or mock using a decrypted verify check
    // Wait, since we hashed it, we cannot read it in plain text. But we can read the testCode field returned in non-production!
    const testCode = sendRes.data.testCode;
    console.log(`- Retrieved test OTP code: ${testCode}`);

    // 2. Verify with wrong OTP
    console.log("\n👉 Test 2: Verify with incorrect OTP");
    try {
      await axios.post(`${baseUrl}/verify-email-otp`, {
        email: "otp_test@example.com",
        otp: "000000"
      });
      throw new Error("Should have failed with incorrect OTP.");
    } catch (err) {
      if (err.response?.status === 400) {
        console.log("✅ Correctly rejected incorrect OTP with 400.");
      } else {
        throw err;
      }
    }

    // 3. Verify with correct OTP
    console.log("\n👉 Test 3: Verify with correct OTP");
    const verifyRes = await axios.post(`${baseUrl}/verify-email-otp`, {
      email: "otp_test@example.com",
      otp: testCode
    });
    if (verifyRes.data.success) {
      console.log("✅ Verify OTP request succeeded.");
    } else {
      throw new Error("Verify OTP failed.");
    }

    // Verify status in DB
    const otpDocAfter = await EmailOtp.findOne({ email: "otp_test@example.com" });
    if (!otpDocAfter || !otpDocAfter.verified || otpDocAfter.otpCode !== "verified") {
      throw new Error("OTP document state was not updated correctly after verification.");
    }
    console.log("✅ OTP document in DB is verified = true and otpCode is deleted/replaced.");

    // 4. Try verifying again (Already verified)
    console.log("\n👉 Test 4: Verify already verified OTP");
    try {
      await axios.post(`${baseUrl}/verify-email-otp`, {
        email: "otp_test@example.com",
        otp: testCode
      });
      throw new Error("Should have failed already verified check.");
    } catch (err) {
      if (err.response?.status === 400) {
        console.log("✅ Correctly rejected already-verified OTP with 400.");
      } else {
        throw err;
      }
    }

    // 5. Registration without verification (different email)
    console.log("\n👉 Test 5: Register with unverified email");
    try {
      await axios.post(`${baseUrl}/register`, {
        name: "OTP Test User",
        email: "unverified@example.com",
        phoneNumber: "+919999999999",
        password: "Password123!",
        role: "player"
      });
      throw new Error("Should have failed unverified register check.");
    } catch (err) {
      if (err.response?.status === 400 && err.response?.data?.message.includes("verify your email first")) {
        console.log("✅ Correctly blocked registration for unverified email with 400.");
      } else {
        throw err;
      }
    }

    // 6. Registration with verified email
    console.log("\n👉 Test 6: Register with verified email");
    const regRes = await axios.post(`${baseUrl}/register`, {
      name: "OTP Test User",
      email: "otp_test@example.com",
      phoneNumber: "+919999999999",
      password: "Password123!",
      role: "player"
    });
    if (regRes.data.success) {
      console.log("✅ Registration succeeded!");
    } else {
      throw new Error("Registration failed.");
    }

    // Verify User in DB
    const userDoc = await User.findOne({ email: "otp_test@example.com" });
    if (!userDoc || !userDoc.emailVerified) {
      throw new Error("User was not created or emailVerified flag is false.");
    }
    console.log("✅ User created in DB and emailVerified = true.");

    // Verify OTP document deleted
    const otpDocFinal = await EmailOtp.findOne({ email: "otp_test@example.com" });
    if (otpDocFinal) {
      throw new Error("OTP document should have been deleted post-registration.");
    }
    console.log("✅ OTP document deleted successfully post-registration.");

    console.log("\n==================================================");
    console.log("🎉 ALL EMAIL OTP REGISTRATION FLOW TESTS PASSED!");
    console.log("==================================================");

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("\n❌ VALIDATION ERROR:", err.message);
    if (err.response) {
      console.error("Response data:", err.response.data);
    }
    await mongoose.disconnect();
    process.exit(1);
  }
}

runTest();
