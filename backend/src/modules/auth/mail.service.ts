import nodemailer from "nodemailer";
import env from "../../config/env";

// Create transporter with Gmail
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: env.emailUser,
    pass: env.emailPass,
  },
});

// Verify Gmail configuration at startup
(async () => {
  try {
    await transporter.verify();
    console.log("✅ Email service (Gmail) configured successfully");
  } catch (error) {
    console.error(
      "⚠️  EMAIL SERVICE ERROR - Check your EMAIL_USER and EMAIL_PASS in .env:",
      error
    );
  }
})();

export async function sendOtpEmail(email: string, otp: string | number): Promise<void> {
  try {
    const mailOptions = {
      from: env.emailUser,
      to: email,
      subject: "JusT us Verification Code 💌",
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 20px;">
          <h2 style="color: #ff4d8d; text-align: center;">💌 Welcome to JusT us</h2>
          <p style="font-size: 16px; text-align: center;">Your secure verification code:</p>
          <div style="background: #fff0f5; padding: 20px; border-radius: 15px; text-align: center; font-size: 32px; letter-spacing: 8px; font-weight: bold; margin: 20px 0; color: #ff4d8d; border: 2px dashed #ff4d8d;">
            ${otp}
          </div>
          <p style="font-size: 14px; text-align: center; color: #777;">This OTP will expire in 5 minutes.</p>
          <p style="font-size: 14px; text-align: center; color: #777;">⚠️ Never share your OTP with anyone.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="text-align: center; font-size: 14px; color: #999;">With love,<br/>Team JusT us ❤️</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${email}`, info.response);
  } catch (error: any) {
    console.error(`❌ Failed to send email to ${email}:`, error.message);
    throw new Error(
      `Email service failed: ${error.message}. Ensure EMAIL_USER (Gmail) and EMAIL_PASS (Gmail App Password) are correct in .env`
    );
  }
}
