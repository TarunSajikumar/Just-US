import { Response } from "express";
import mongoose from "mongoose";
import User from "../models/User";
import Couple from "../models/Couple";
import QuickLoveMessage from "../models/QuickLoveMessage";
import CoupleQuestion from "../models/CoupleQuestion";
import WishlistItem from "../models/WishlistItem";
import CouplePosition from "../models/CouplePosition";
import CoupleIdea from "../models/CoupleIdea";
import CoupleChallenge from "../models/CoupleChallenge";
import { getIO, getCoupleRoomId } from "../sockets";

export const getCoupleProfile = async (req: any, res: Response) => {
  const userId = req.userId;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.relationship_status !== "couple" || !user.couple_id) {
      return res.status(400).json({
        message: "User is not in a couple",
        relationship_status: user.relationship_status
      });
    }

    const [partner, couple] = await Promise.all([
      User.findById(user.partner_id),
      Couple.findById(user.couple_id)
    ]);

    if (!partner) {
      return res.status(404).json({ message: "Partner not found" });
    }

    // Single source of truth: return only relationshipStartDate.
    // Anniversary is calculated dynamically on the client.
    res.json({
      partner: {
        name: partner.name,
        email: partner.email,
        birthday: partner.birthday,
        gender: partner.gender
      },
      relationship_status: user.relationship_status,
      couple_id: user.couple_id,
      relationshipStartDate: couple?.relationshipStartDate || couple?.createdAt,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch couple profile" });
  }
};

export const updateRelationshipDate = async (req: any, res: Response) => {
  // Only the relationship start date is stored. Anniversary is derived dynamically.
  const { relationshipStartDate } = req.body;
  const userId = req.userId;

  try {
    const user = await User.findById(userId);

    if (!user?.couple_id) {
      return res.status(400).json({
        message: "Not connected to a couple",
      });
    }

    const couple = await Couple.findByIdAndUpdate(
      user.couple_id,
      { relationshipStartDate },
      { new: true }
    );

    // Emit socket event to partner room — only the start date is broadcast.
    // Both users will independently compute anniversary from this.
    const io = getIO();
    if (io && user.partner_id) {
      const room = getCoupleRoomId(userId, user.partner_id);
      io.to(room).emit("relationship_dates_updated", {
        relationshipStartDate: couple?.relationshipStartDate,
      });
    }

    res.json(couple);
  } catch (error) {
    console.error("updateRelationshipDate error:", error);
    res.status(500).json({ message: "Failed to update relationship date" });
  }
};

export const getQuickLoveMessages = async (req: any, res: Response) => {
  const userId = req.userId;

  try {
    const user = await User.findById(userId);

    if (!user?.couple_id) {
      return res.status(400).json({
        message: "Not connected to a couple",
      });
    }

    const messages = await QuickLoveMessage.find({ couple_id: user.couple_id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      data: messages,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch quick love messages" });
  }
};

export const addQuickLoveMessage = async (req: any, res: Response) => {
  const { text, emoji } = req.body;
  const userId = req.userId;

  try {
    const user = await User.findById(userId);

    if (!user?.couple_id) {
      return res.status(400).json({
        message: "Not connected to a couple",
      });
    }

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        message: "Message text is required",
      });
    }

    const newMessage = new QuickLoveMessage({
      couple_id: user.couple_id,
      sender_id: userId,
      text: text.trim(),
      emoji: emoji || "💕",
    });

    await newMessage.save();

    res.status(201).json({
      success: true,
      data: newMessage,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to add quick love message" });
  }
};

export const deleteQuickLoveMessage = async (req: any, res: Response) => {
  const { id } = req.params;
  try {
    await QuickLoveMessage.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete message" });
  }
};

// =============== PREDEFINED DATA SEEDS ===============

const PREDEFINED_POSITIONS = [
  { id: "spoon", name: "The Spoon", difficulty: "Easy", energyLevel: "Low", category: "Romantic" },
  { id: "lotus", name: "The Lotus", difficulty: "Medium", energyLevel: "Low", category: "Romantic" },
  { id: "standing", name: "Standing Embrace", difficulty: "Hard", energyLevel: "High", category: "Passionate" },
  { id: "bridge", name: "The Bridge", difficulty: "Advanced", energyLevel: "High", category: "Passionate" },
  { id: "face_to_face", name: "Face to Face", difficulty: "Easy", energyLevel: "Medium", category: "Intimate" },
  { id: "fusion", name: "The Fusion", difficulty: "Medium", energyLevel: "Medium", category: "Intimate" },
  { id: "missionary", name: "Missionary", difficulty: "Easy", energyLevel: "Medium", category: "Beginner Friendly" },
  { id: "cowgirl", name: "Cowgirl / Cowboy", difficulty: "Easy", energyLevel: "Medium", category: "Beginner Friendly" },
  { id: "acrobat", name: "The Acrobat", difficulty: "Advanced", energyLevel: "High", category: "Advanced" },
  { id: "crouching_tiger", name: "Crouching Tiger", difficulty: "Advanced", energyLevel: "High", category: "Advanced" },
];

const PREDEFINED_IDEAS = [
  { id: "cook_dinner", title: "Cook a new recipe together 🍳", desc: "Pick a cuisine you've never tried and make it from scratch." },
  { id: "star_gazing", title: "Midnight Stargazing Picnic 🌌", desc: "Pack blankets and hot cocoa, and find a quiet place to look at the stars." },
  { id: "museum_date", title: "Museum / Gallery Walk 🖼️", desc: "Spend an afternoon exploring art or history, talking about your favorite exhibits." },
  { id: "movie_marathon", title: "Cozy Pillow-Fort Movie Night 🍿", desc: "Build a massive fort and watch your favorite childhood movies." },
  { id: "diy_spa", title: "At-Home Spa Night 🕯️", desc: "Light candles, put on relaxing music, and give each other massages." },
];

const PREDEFINED_CHALLENGES = [
  { id: "no_phones", title: "No Phones Dinner 📵", desc: "Have a dinner date where both phones are completely powered off." },
  { id: "love_letters", title: "Exchange Hand-written Letters ✉️", desc: "Write down your feelings on paper and read them aloud to each other." },
  { id: "compliment_day", title: "24-Hour Compliment Challenge 🌟", desc: "Make a conscious effort to praise/compliment your partner throughout the day." },
  { id: "try_something_new", title: "Try a New Hobby Together 🎨", desc: "Take a pottery, painting, or dance class together." },
  { id: "stare_deeply", title: "4-Minute Eye Contact Challenge 👀", desc: "Sit face-to-face and look into each other's eyes for 4 minutes straight without talking." },
];

// =============== COUPLE+ CONTROLLERS ===============

export const getCoupleSettings = async (req: any, res: Response) => {
  const userId = req.userId;
  try {
    const user = await User.findById(userId);
    if (!user?.couple_id) {
      return res.status(400).json({ message: "Not connected to a couple" });
    }
    const couple: any = await Couple.findById(user.couple_id);
    if (!couple) {
      return res.status(404).json({ message: "Couple settings not found" });
    }

    const isPending = couple.coupleFeatureStatus === "pending";
    const isRequesterMe = couple.coupleFeatureRequester?.toString() === userId.toString();

    res.json({
      coupleModeSetting: couple.coupleFeatureStatus === "active" ? "couple+" : "normal",
      coupleStatusFromPartner: (isPending && !isRequesterMe) ? "pending" : (couple.coupleFeatureStatus || null),
      coupleStatusFromMe: (isPending && isRequesterMe) ? "pending" : (couple.coupleFeatureStatus || null),
      coupleFeatureStatus: couple.coupleFeatureStatus || null,
      coupleFeatureRequester: couple.coupleFeatureRequester || null,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch couple settings" });
  }
};

export const requestFeature = async (req: any, res: Response) => {
  const userId = req.userId;
  try {
    const user = await User.findById(userId);
    if (!user?.couple_id) {
      return res.status(400).json({ message: "Not connected to a couple" });
    }
    const couple = await Couple.findByIdAndUpdate(
      user.couple_id,
      {
        coupleFeatureStatus: "pending",
        coupleFeatureRequester: userId,
      },
      { new: true }
    );

    // Socket emit
    const io = getIO();
    if (io && user.partner_id) {
      const room = getCoupleRoomId(userId, user.partner_id);
      io.to(room).emit("couple_feature_request", { status: "pending" });
    }

    res.json({ success: true, status: "pending" });
  } catch (error) {
    res.status(500).json({ message: "Failed to request Couple+" });
  }
};

export const acceptFeature = async (req: any, res: Response) => {
  const userId = req.userId;
  try {
    const user = await User.findById(userId);
    if (!user?.couple_id) {
      return res.status(400).json({ message: "Not connected to a couple" });
    }
    const couple = await Couple.findByIdAndUpdate(
      user.couple_id,
      {
        coupleFeatureStatus: "active",
      },
      { new: true }
    );

    // Socket emit
    const io = getIO();
    if (io && user.partner_id) {
      const room = getCoupleRoomId(userId, user.partner_id);
      io.to(room).emit("couple_feature_accepted", { status: "active" });
    }

    res.json({ success: true, status: "active" });
  } catch (error) {
    res.status(500).json({ message: "Failed to accept Couple+" });
  }
};

export const declineFeature = async (req: any, res: Response) => {
  const userId = req.userId;
  try {
    const user = await User.findById(userId);
    if (!user?.couple_id) {
      return res.status(400).json({ message: "Not connected to a couple" });
    }
    const couple = await Couple.findByIdAndUpdate(
      user.couple_id,
      {
        coupleFeatureStatus: "declined",
        coupleFeatureRequester: null,
      },
      { new: true }
    );

    // Socket emit
    const io = getIO();
    if (io && user.partner_id) {
      const room = getCoupleRoomId(userId, user.partner_id);
      io.to(room).emit("couple_feature_declined", { status: "declined" });
    }

    res.json({ success: true, status: "declined" });
  } catch (error) {
    res.status(500).json({ message: "Failed to decline Couple+" });
  }
};

export const disableFeature = async (req: any, res: Response) => {
  const userId = req.userId;
  try {
    const user = await User.findById(userId);
    if (!user?.couple_id) {
      return res.status(400).json({ message: "Not connected to a couple" });
    }
    const couple = await Couple.findByIdAndUpdate(
      user.couple_id,
      {
        coupleFeatureStatus: null,
        coupleFeatureRequester: null,
      },
      { new: true }
    );

    // Socket emit
    const io = getIO();
    if (io && user.partner_id) {
      const room = getCoupleRoomId(userId, user.partner_id);
      io.to(room).emit("couple_feature_disabled", { status: null });
    }

    res.json({ success: true, status: null });
  } catch (error) {
    res.status(500).json({ message: "Failed to disable Couple+" });
  }
};

export const getConnectionLevel = async (req: any, res: Response) => {
  const userId = req.userId;
  try {
    const user = await User.findById(userId);
    if (!user?.couple_id) {
      return res.status(400).json({ message: "Not connected to a couple" });
    }
    const couple: any = await Couple.findById(user.couple_id);
    res.json({ level: couple?.connectionLevel ?? 75 });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch connection level" });
  }
};

export const updateConnectionLevel = async (req: any, res: Response) => {
  const userId = req.userId;
  const { level } = req.body;
  try {
    const user = await User.findById(userId);
    if (!user?.couple_id) {
      return res.status(400).json({ message: "Not connected to a couple" });
    }
    const couple = await Couple.findByIdAndUpdate(
      user.couple_id,
      { connectionLevel: level },
      { new: true }
    );

    // Socket emit
    const io = getIO();
    if (io && user.partner_id) {
      const room = getCoupleRoomId(userId, user.partner_id);
      io.to(room).emit("connection_level_updated", { level });
    }

    res.json({ success: true, level });
  } catch (error) {
    res.status(500).json({ message: "Failed to update connection level" });
  }
};

// =============== QUESTIONS CONTROLLERS ===============

export const getQuestions = async (req: any, res: Response) => {
  const userId = req.userId;
  try {
    const user = await User.findById(userId);
    if (!user?.couple_id) {
      return res.status(400).json({ message: "Not connected to a couple" });
    }
    const questions = await CoupleQuestion.find({ coupleId: user.couple_id })
      .sort({ createdAt: -1 })
      .limit(30);
    res.json(questions);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch questions" });
  }
};

export const sendQuestion = async (req: any, res: Response) => {
  const userId = req.userId;
  const { question } = req.body;
  try {
    const user = await User.findById(userId);
    if (!user?.couple_id) {
      return res.status(400).json({ message: "Not connected to a couple" });
    }
    const newQuestion = new CoupleQuestion({
      coupleId: user.couple_id,
      senderId: userId,
      question,
    });
    await newQuestion.save();

    // Socket emit
    const io = getIO();
    if (io && user.partner_id) {
      const room = getCoupleRoomId(userId, user.partner_id);
      io.to(room).emit("couple_question_received", newQuestion);
    }

    res.status(201).json({ success: true, question: newQuestion });
  } catch (error) {
    res.status(500).json({ message: "Failed to send question" });
  }
};

export const answerQuestion = async (req: any, res: Response) => {
  const userId = req.userId;
  const { questionId, answer } = req.body;
  try {
    const user = await User.findById(userId);
    if (!user?.couple_id) {
      return res.status(400).json({ message: "Not connected to a couple" });
    }
    const updated = await CoupleQuestion.findByIdAndUpdate(
      questionId,
      {
        answer,
        answeredAt: new Date(),
      },
      { new: true }
    );

    // Socket emit
    const io = getIO();
    if (io && user.partner_id) {
      const room = getCoupleRoomId(userId, user.partner_id);
      io.to(room).emit("couple_question_answered", updated);
    }

    res.json({ success: true, question: updated });
  } catch (error) {
    res.status(500).json({ message: "Failed to answer question" });
  }
};

// =============== WISHLIST CONTROLLERS ===============

export const getWishlist = async (req: any, res: Response) => {
  const userId = req.userId;
  try {
    const user = await User.findById(userId);
    if (!user?.couple_id) {
      return res.status(400).json({ message: "Not connected to a couple" });
    }
    const items = await WishlistItem.find({ coupleId: user.couple_id })
      .sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch wishlist" });
  }
};

export const addWishlistItem = async (req: any, res: Response) => {
  const userId = req.userId;
  const { title, notes } = req.body;
  try {
    const user = await User.findById(userId);
    if (!user?.couple_id) {
      return res.status(400).json({ message: "Not connected to a couple" });
    }
    const newItem = new WishlistItem({
      coupleId: user.couple_id,
      userId,
      title,
      notes: notes || "",
    });
    await newItem.save();

    // Socket emit
    const io = getIO();
    if (io && user.partner_id) {
      const room = getCoupleRoomId(userId, user.partner_id);
      io.to(room).emit("wishlist_updated");
    }

    res.status(201).json(newItem);
  } catch (error) {
    res.status(500).json({ message: "Failed to add wishlist item" });
  }
};

export const updateWishlistItem = async (req: any, res: Response) => {
  const userId = req.userId;
  const { id } = req.params;
  const { isCompleted } = req.body;
  try {
    const user = await User.findById(userId);
    if (!user?.couple_id) {
      return res.status(400).json({ message: "Not connected to a couple" });
    }
    const updated = await WishlistItem.findByIdAndUpdate(
      id,
      { isCompleted },
      { new: true }
    );

    // Socket emit
    const io = getIO();
    if (io && user.partner_id) {
      const room = getCoupleRoomId(userId, user.partner_id);
      io.to(room).emit("wishlist_updated");
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Failed to update wishlist item" });
  }
};

export const deleteWishlistItem = async (req: any, res: Response) => {
  const userId = req.userId;
  const { id } = req.params;
  try {
    const user = await User.findById(userId);
    if (!user?.couple_id) {
      return res.status(400).json({ message: "Not connected to a couple" });
    }
    await WishlistItem.findByIdAndDelete(id);

    // Socket emit
    const io = getIO();
    if (io && user.partner_id) {
      const room = getCoupleRoomId(userId, user.partner_id);
      io.to(room).emit("wishlist_updated");
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete wishlist item" });
  }
};

// =============== POSITIONS CONTROLLERS ===============

export const getPositions = async (req: any, res: Response) => {
  const userId = req.userId;
  try {
    const user = await User.findById(userId);
    if (!user?.couple_id) {
      return res.status(400).json({ message: "Not connected to a couple" });
    }
    const saved = await CouplePosition.find({ coupleId: user.couple_id });
    
    // Merge predefined with saved status
    const positions = PREDEFINED_POSITIONS.map((p) => {
      const doc = saved.find((s) => s.positionId === p.id);
      return {
        ...p,
        favorites: doc?.favorites || [],
        wantToTry: doc?.wantToTry || [],
        tried: doc?.tried || [],
        notes: doc?.notes || "",
      };
    });

    res.json(positions);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch positions" });
  }
};

export const updatePositionStatus = async (req: any, res: Response) => {
  const userId = req.userId;
  const { positionId } = req.params;
  const { action, value, notes } = req.body; // action: 'favorite' | 'wantToTry' | 'tried' | 'notes'
  try {
    const user = await User.findById(userId);
    if (!user?.couple_id) {
      return res.status(400).json({ message: "Not connected to a couple" });
    }

    let doc: any = await CouplePosition.findOne({ coupleId: user.couple_id, positionId });
    if (!doc) {
      doc = new CouplePosition({
        coupleId: user.couple_id,
        positionId,
        favorites: [],
        wantToTry: [],
        tried: [],
        notes: "",
      });
    }

    if (action === "notes") {
      doc.notes = notes;
    } else {
      const listName = action === "favorite" ? "favorites" : action === "wantToTry" ? "wantToTry" : "tried";
      const userList = doc[listName] as mongoose.Types.ObjectId[];
      const isSet = userList.some((id) => id.toString() === userId.toString());

      if (value && !isSet) {
        userList.push(userId);
      } else if (!value && isSet) {
        doc[listName] = userList.filter((id) => id.toString() !== userId.toString());
      }
    }

    await doc.save();

    // Socket emit
    const io = getIO();
    if (io && user.partner_id) {
      const room = getCoupleRoomId(userId, user.partner_id);
      io.to(room).emit("position_status_updated", { positionId, doc });
    }

    res.json({ success: true, doc });
  } catch (error) {
    res.status(500).json({ message: "Failed to update position status" });
  }
};

// =============== IDEAS & CHALLENGES CONTROLLERS ===============

export const getIdeas = async (req: any, res: Response) => {
  const userId = req.userId;
  try {
    const user = await User.findById(userId);
    if (!user?.couple_id) {
      return res.status(400).json({ message: "Not connected to a couple" });
    }
    const saved = await CoupleIdea.find({ coupleId: user.couple_id });
    const ideas = PREDEFINED_IDEAS.map((i) => {
      const doc = saved.find((s) => s.ideaId === i.id);
      return {
        ...i,
        likes: doc?.likes || [],
        isCompleted: doc?.isCompleted || false,
      };
    });
    res.json(ideas);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch date ideas" });
  }
};

export const toggleIdeaLike = async (req: any, res: Response) => {
  const userId = req.userId;
  const { ideaId } = req.params;
  try {
    const user = await User.findById(userId);
    if (!user?.couple_id) {
      return res.status(400).json({ message: "Not connected to a couple" });
    }

    let doc: any = await CoupleIdea.findOne({ coupleId: user.couple_id, ideaId });
    if (!doc) {
      doc = new CoupleIdea({
        coupleId: user.couple_id,
        ideaId,
        likes: [],
        isCompleted: false,
      });
    }

    const hasLiked = doc.likes.some((id: any) => id.toString() === userId.toString());
    if (hasLiked) {
      doc.likes = doc.likes.filter((id: any) => id.toString() !== userId.toString());
    } else {
      doc.likes.push(userId);
    }
    await doc.save();

    // Socket emit
    const io = getIO();
    if (io && user.partner_id) {
      const room = getCoupleRoomId(userId, user.partner_id);
      io.to(room).emit("idea_status_updated");
    }

    res.json(doc);
  } catch (error) {
    res.status(500).json({ message: "Failed to like date idea" });
  }
};

export const toggleIdeaComplete = async (req: any, res: Response) => {
  const userId = req.userId;
  const { ideaId } = req.params;
  const { isCompleted } = req.body;
  try {
    const user = await User.findById(userId);
    if (!user?.couple_id) {
      return res.status(400).json({ message: "Not connected to a couple" });
    }

    let doc: any = await CoupleIdea.findOne({ coupleId: user.couple_id, ideaId });
    if (!doc) {
      doc = new CoupleIdea({
        coupleId: user.couple_id,
        ideaId,
        likes: [],
        isCompleted,
      });
    } else {
      doc.isCompleted = isCompleted;
    }
    await doc.save();

    // Socket emit
    const io = getIO();
    if (io && user.partner_id) {
      const room = getCoupleRoomId(userId, user.partner_id);
      io.to(room).emit("idea_status_updated");
    }

    res.json(doc);
  } catch (error) {
    res.status(500).json({ message: "Failed to complete date idea" });
  }
};

export const getChallenges = async (req: any, res: Response) => {
  const userId = req.userId;
  try {
    const user = await User.findById(userId);
    if (!user?.couple_id) {
      return res.status(400).json({ message: "Not connected to a couple" });
    }
    const saved = await CoupleChallenge.find({ coupleId: user.couple_id });
    const challenges = PREDEFINED_CHALLENGES.map((c) => {
      const doc = saved.find((s) => s.challengeId === c.id);
      return {
        ...c,
        isCompleted: doc?.isCompleted || false,
        completedAt: doc?.completedAt || null,
      };
    });
    res.json(challenges);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch challenges" });
  }
};

export const toggleChallengeComplete = async (req: any, res: Response) => {
  const userId = req.userId;
  const { challengeId } = req.params;
  const { isCompleted } = req.body;
  try {
    const user = await User.findById(userId);
    if (!user?.couple_id) {
      return res.status(400).json({ message: "Not connected to a couple" });
    }

    let doc: any = await CoupleChallenge.findOne({ coupleId: user.couple_id, challengeId });
    if (!doc) {
      doc = new CoupleChallenge({
        coupleId: user.couple_id,
        challengeId,
        isCompleted,
        completedAt: isCompleted ? new Date() : null,
      });
    } else {
      doc.isCompleted = isCompleted;
      doc.completedAt = isCompleted ? new Date() : null;
    }
    await doc.save();

    // Socket emit
    const io = getIO();
    if (io && user.partner_id) {
      const room = getCoupleRoomId(userId, user.partner_id);
      io.to(room).emit("challenge_status_updated");
    }

    res.json(doc);
  } catch (error) {
    res.status(500).json({ message: "Failed to toggle challenge completion" });
  }
};
