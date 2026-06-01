import mongoose from "mongoose";
import env from "./env";

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.mongodbUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error: any) {
    console.error("❌ MongoDB Error:", error.message);
    if (error.message.includes("selection")) {
      console.error("👉 TIP: This usually means your IP is not whitelisted in MongoDB Atlas Network Access.");
    }
    throw error;
  }
};

