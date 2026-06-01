import Achievement from "../models/Achievement";

export const unlockAchievement = async (coupleId: string, code: string) => {
  try {
    const existing = await Achievement.findOne({ coupleId, code });
    if (!existing) {
      await Achievement.create({
        coupleId,
        code,
        unlockedAt: new Date(),
      });
      console.log(`🏆 Achievement unlocked: ${code} for couple ${coupleId}`);
    }
  } catch (error) {
    console.error(`Failed to unlock achievement ${code}:`, error);
  }
};
