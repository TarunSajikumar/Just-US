import { Response } from "express";
import User from "../models/User";
import Memory from "../models/Memory";
import Activity from "../models/Activity";
import { unlockAchievement } from "../services/achievement.service";
import { cloudinary } from "../middleware/uploadMiddleware";
import { getIO, getCoupleRoomId } from "../sockets";

/**
 * GET /api/memories/:coupleId
 * Returns all memories for a couple, newest first.
 */
export const getMemories = async (req: any, res: Response) => {
  const userId = req.userId;
  const { coupleId } = req.params;

  if (!coupleId) {
    return res.status(400).json({ message: "coupleId is required" });
  }

  try {
    // Verify user belongs to this couple
    const user = await User.findOne({ _id: userId, couple_id: coupleId });

    if (!user) {
      return res.status(403).json({ message: "Not authorized for this couple" });
    }

    const memories = await Memory.find({ couple_id: coupleId }).sort({ createdAt: -1 });

    return res.json({ memories: memories ?? [] });
  } catch (error) {
    console.error("getMemories error:", error);
    return res.status(500).json({ message: "Failed to fetch memories" });
  }
};

/**
 * POST /api/memories
 * Body: { coupleId, imageBase64, mimeType, caption }
 * Uploads image to Cloudinary and inserts a DB row.
 */
export const createMemory = async (req: any, res: Response) => {
  const userId = req.userId;
  const { coupleId, imageBase64, mimeType, caption } = req.body;

  if (!coupleId || !imageBase64 || !mimeType) {
    return res.status(400).json({ message: "coupleId, imageBase64 and mimeType are required" });
  }

  try {
    // Verify user belongs to this couple
    const user = await User.findOne({ _id: userId, couple_id: coupleId });

    if (!user) {
      return res.status(403).json({ message: "Not authorized for this couple" });
    }

    // Upload image to Cloudinary
    let imageUrl = "";
    try {
      const dataUri = `data:${mimeType};base64,${imageBase64}`;
      const uploadResponse = await cloudinary.uploader.upload(dataUri, {
        folder: "just-us-memories",
      });
      imageUrl = uploadResponse.secure_url;
      console.log("✅ Image uploaded to Cloudinary:", imageUrl);
    } catch (uploadError: any) {
      console.error("❌ Cloudinary Upload Error:", uploadError.message);

      // Fallback to placeholder ONLY if no credentials are provided
      if (uploadError.message.includes("Must supply cloud_name")) {
        console.warn("⚠️ Cloudinary credentials missing, using placeholder URL");
        imageUrl = "https://via.placeholder.com/600?text=Cloudinary+Missing";
      } else {
        throw uploadError;
      }
    }

    // Insert memory row into DB
    const memory = await Memory.create({
      couple_id: coupleId,
      image_url: imageUrl,
      caption: caption?.trim() || null,
    });

    // Unlock FIRST_MEMORY achievement
    await unlockAchievement(coupleId, "FIRST_MEMORY");

    // Log Activity
    try {
      await Activity.create({
        coupleId: coupleId,
        actorId: userId,
        actionType: "memory_added",
        details: { caption: caption?.trim() },
      });
    } catch (_) {}

    // Real-time emit to partner
    try {
      const io = getIO();
      if (io && user.partner_id) {
        const room = getCoupleRoomId(user._id, user.partner_id);
        io.to(room).emit("memory_added", {
          memory,
          actorName: user.name,
        });
      }
    } catch (_) {}

    return res.status(201).json({ memory });
  } catch (error: any) {
    console.error("createMemory error:", error);
    return res.status(500).json({
      message: "Failed to save memory record",
      error: error.message
    });
  }
};
