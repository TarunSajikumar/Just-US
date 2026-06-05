import nodemailer from "nodemailer";
import env from "../../config/env";

// Create transporter with Gmail
const gmailTransporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // Use TLS
  auth: {
    user: env.emailUser,
    pass: env.emailPass.replace(/\s/g, ''), // Remove spaces from app password
  },
});

// Verify Gmail configuration at startup
(async () => {
  try {
    await gmailTransporter.verify();
    console.log("✅ Email service (Gmail) configured successfully");
  } catch (error) {
    console.error(
      "⚠️  EMAIL SERVICE WARNING - Gmail not available. Check your EMAIL_USER and EMAIL_PASS:",
      error
    );
  }
})();

export async function sendOtpEmail(email: string, otp: string | number): Promise<void> {
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
        <p style="font-size: 14px; text-align: center; color: #777;">This OTP will expire in 10 minutes.</p>
        <p style="font-size: 14px; text-align: center; color: #777;">⚠️ Never share your OTP with anyone.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="text-align: center; font-size: 14px; color: #999;">With love,<br/>Team JusT us ❤️</p>
      </div>
    `,
  };

  try {
    console.log(`📧 Attempting to send OTP email to ${email}`);
    const info = await gmailTransporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to ${email}:`, info.response);
    return;
  } catch (error: any) {
    console.error(`❌ Failed to send email to ${email}:`, error.message);
    
    // Provide helpful error messages
    if (error.message.includes('Invalid login')) {
      throw new Error(
        'Email service authentication failed. Please ensure EMAIL_PASS is a Gmail App Password (not your regular password).'
      );
    } else if (error.message.includes('ECONNREFUSED')) {
      throw new Error(
        'Could not connect to email service. Please check your internet connection.'
      );
    } else {
      throw new Error(
        `Email service failed: ${error.message}. Please try again later.`
      );
    }
  }
}
