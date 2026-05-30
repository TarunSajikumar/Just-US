import { Response } from "express";
import User from "../models/User";
import Memory from "../models/Memory";

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
 * Uploads image and inserts a DB row.
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

    // TODO: Implement image upload to Cloudinary or S3
    // For now, using a placeholder URL since Cloudinary credentials are not in .env
    const imageUrl = "https://via.placeholder.com/600";

    // Insert memory row into DB
    const memory = await Memory.create({
      couple_id: coupleId,
      image_url: imageUrl,
      caption: caption?.trim() || null,
    });

    return res.status(201).json({ memory });
  } catch (error) {
    console.error("createMemory error:", error);
    return res.status(500).json({ message: "Failed to save memory record" });
  }
};
