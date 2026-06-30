const nodemailer = require("nodemailer");

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: "gmail", // or 'outlook', 'yahoo', etc.
  auth: {
    user: process.env.EMAIL_USER, // your email
    pass: process.env.EMAIL_PASS, // your app password
  },
});

// Verify connection
transporter.verify((error, success) => {
  if (error) {
    console.log("❌ Email configuration error:", error.message);
  } else {
    console.log("✅ Email service ready to send emails");
  }
});

// ================= SEND VERIFICATION EMAIL =================
const sendVerificationEmail = async (email, verificationCode, name) => {
  const mailOptions = {
    from: `"ArenaSync Support" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "🔐 Verify Your Email - ArenaSync",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Email Verification</title>
        <style>
          body { font-family: Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 0; }
          .container { max-width: 550px; margin: 50px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 30px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .content { padding: 35px; text-align: center; }
          .code-box { background: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0; }
          .code { font-size: 36px; letter-spacing: 8px; font-weight: bold; color: #4f46e5; font-family: monospace; }
          .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
          .warning { color: #ef4444; font-size: 12px; margin-top: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏆 ArenaSync</h1>
          </div>
          <div class="content">
            <h2>Hello ${name || "User"}! 👋</h2>
            <p>Thank you for registering with ArenaSync. Please verify your email address to continue.</p>
            
            <div class="code-box">
              <div style="font-size: 14px; color: #6b7280; margin-bottom: 10px;">Your Verification Code</div>
              <div class="code">${verificationCode}</div>
            </div>
            
            <p>This code will expire in <strong>1 hour</strong>.</p>
            <p>If you didn't create an account, please ignore this email.</p>
            
            <div class="warning">
              ⚠️ Never share this code with anyone.
            </div>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} ArenaSync. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Verification email sent to ${email}`);
    return true;
  } catch (error) {
    console.error("❌ Verification email error:", error.message);
    return false;
  }
};

// ================= SEND PASSWORD RESET EMAIL =================
const sendResetPasswordEmail = async (email, resetCode, name) => {
  const mailOptions = {
    from: `"ArenaSync Support" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "🔐 Password Reset Request - ArenaSync",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Password Reset</title>
        <style>
          body { font-family: Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 0; }
          .container { max-width: 550px; margin: 50px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 30px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .content { padding: 35px; text-align: center; }
          .code-box { background: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0; }
          .code { font-size: 36px; letter-spacing: 8px; font-weight: bold; color: #4f46e5; font-family: monospace; }
          .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
          .warning { color: #ef4444; font-size: 12px; margin-top: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏆 ArenaSync</h1>
          </div>
          <div class="content">
            <h2>Hello ${name || "User"}! 👋</h2>
            <p>We received a request to reset your password for your ArenaSync account.</p>
            
            <div class="code-box">
              <div style="font-size: 14px; color: #6b7280; margin-bottom: 10px;">Your Password Reset Code</div>
              <div class="code">${resetCode}</div>
            </div>
            
            <p>This code will expire in <strong>1 hour</strong>.</p>
            <p>If you didn't request this, please ignore this email and your password will remain unchanged.</p>
            
            <div class="warning">
              ⚠️ Never share this code with anyone.
            </div>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} ArenaSync. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Password reset email sent to ${email}`);
    return true;
  } catch (error) {
    console.error("❌ Password reset email error:", error.message);
    return false;
  }
};

// ================= SEND WELCOME EMAIL (Optional) =================
const sendWelcomeEmail = async (email, name) => {
  const mailOptions = {
    from: `"ArenaSync Support" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "🎉 Welcome to ArenaSync!",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Welcome to ArenaSync</title>
        <style>
          body { font-family: Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 0; }
          .container { max-width: 550px; margin: 50px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 30px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .content { padding: 35px; text-align: center; }
          .button { background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
          .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏆 ArenaSync</h1>
          </div>
          <div class="content">
            <h2>Welcome ${name || "User"}! 🎉</h2>
            <p>Your account has been successfully verified!</p>
            <p>You can now:</p>
            <ul style="text-align: left; display: inline-block;">
              <li>Create and manage teams</li>
              <li>Register for tournaments</li>
              <li>Connect with other players</li>
              <li>Track match schedules and results</li>
            </ul>
            <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/login" class="button">Login to Your Account</a>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} ArenaSync. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Welcome email sent to ${email}`);
    return true;
  } catch (error) {
    console.error("❌ Welcome email error:", error.message);
    return false;
  }
};

// ================= SEND REGISTRATION EMAIL OTP =================
const sendRegistrationEmailOtp = async (email, otpCode) => {
  const mailOptions = {
    from: `"ArenaSync Support" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "ArenaSync Email Verification",
    text: `Your ArenaSync verification code is:\n\n${otpCode}\n\nThis OTP expires in 5 minutes.\n\nIf you did not request this verification, ignore this email.`,
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 20px auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #4f46e5; margin-bottom: 20px;">ArenaSync Email Verification</h2>
        <p>Your ArenaSync verification code is:</p>
        <div style="background-color: #f1f5f9; padding: 15px; text-align: center; font-size: 28px; font-weight: bold; letter-spacing: 4px; border-radius: 6px; color: #4f46e5; margin: 20px 0;">
          ${otpCode}
        </div>
        <p>This OTP expires in 5 minutes.</p>
        <p style="color: #64748b; font-size: 14px; margin-top: 20px;">If you did not request this verification, ignore this email.</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Registration OTP email sent to ${email}`);
    return true;
  } catch (error) {
    console.error("❌ Registration OTP email error:", error.message);
    return false;
  }
};

module.exports = { 
  sendVerificationEmail, 
  sendResetPasswordEmail,  // ✅ Fixed: Changed from sendResetEmail to sendResetPasswordEmail
  sendWelcomeEmail,
  sendRegistrationEmailOtp
};