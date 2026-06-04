import dotenv from "dotenv";

dotenv.config();

const requiredEnv = [
  "MONGODB_URI",
  "JWT_SECRET",
  "EMAIL_USER",
  "EMAIL_PASS",
];

requiredEnv.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`${key} missing in .env`);
  }
});

export default {
  mongodbUri: process.env.MONGODB_URI!,
  jwtSecret: process.env.JWT_SECRET!,
  emailUser: process.env.EMAIL_USER!,
  emailPass: process.env.EMAIL_PASS!,
  port: process.env.PORT || 5000,

  // Optional Twilio Config
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
  twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER,

  // Optional Cloudinary Config
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME,
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY,
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET,
};
