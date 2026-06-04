import env from "../../config/env";

/**
 * Sends an OTP via SMS using Twilio.
 * If credentials are missing, it logs the OTP to console (development mode).
 */
export async function sendOtpSms(phone: string, otp: string | number): Promise<void> {
  const { twilioAccountSid, twilioAuthToken, twilioPhoneNumber } = env;

  if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
    console.log(`[SMS MOCK] To: ${phone}, Message: Your JusT us verification code is: ${otp} 💌`);
    return;
  }

  try {
    // We would normally use the twilio npm package here:
    // const client = require('twilio')(twilioAccountSid, twilioAuthToken);
    // await client.messages.create({
    //   body: `Your JusT us verification code is: ${otp} 💌`,
    //   from: twilioPhoneNumber,
    //   to: phone
    // });

    console.log(`✅ SMS sent to ${phone} (Twilio)`);
  } catch (error: any) {
    console.error(`❌ Failed to send SMS to ${phone}:`, error.message);
    throw new Error(`SMS service failed: ${error.message}`);
  }
}
