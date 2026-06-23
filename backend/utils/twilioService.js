const twilio = require('twilio');

const sendOTP = async (phoneNumber, otpCode) => {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !twilioPhoneNumber) {
      console.warn("⚠️ Twilio credentials missing in .env. Skipping SMS send, but OTP will be logged in console.");
      return false; // Return false to indicate SMS wasn't actually sent
    }

    const client = twilio(accountSid, authToken);

    const message = await client.messages.create({
      body: `Your verification code is: ${otpCode}. This code will expire in 5 minutes.`,
      from: twilioPhoneNumber,
      to: phoneNumber
    });

    console.log(`✅ SMS sent successfully to ${phoneNumber}. Message SID: ${message.sid}`);
    return true;
  } catch (error) {
    if (error.code === 21608) {
      console.warn(`⚠️ Twilio Trial Info: The phone number ${phoneNumber} is unverified. Code logged above.`);
    } else {
      console.error("❌ Failed to send SMS via Twilio:", error.message || error);
    }
    return false;
  }
};

module.exports = {
  sendOTP
};
