import Goal from "../models/Goal";
import Event from "../models/Event";
import Couple from "../models/Couple";
import User from "../models/User";

export const seedDemoData = async () => {
  try {
    const coupleCount = await Couple.countDocuments();
    if (coupleCount > 0) {
      const couples = await Couple.find();
      for (const couple of couples) {
        // Find users in this couple
        const users = await User.find({ couple_id: couple._id.toString() });
        if (users.length > 0) {
          const user1 = users[0];
          const user2 = users[1] || users[0];

          // Seed goals if empty
          const goalCount = await Goal.countDocuments({ coupleId: couple._id });
          if (goalCount === 0) {
            await Goal.create([
              {
                coupleId: couple._id,
                createdBy: user1._id,
                title: "Watch 50 Movies Together",
                target: 50,
                current: 34,
                emoji: "🎬",
              },
              {
                coupleId: couple._id,
                createdBy: user1._id,
                title: "Save ₹50,000 For Goa Trip",
                target: 50000,
                current: 18000,
                emoji: "🏖️",
              },
              {
                coupleId: couple._id,
                createdBy: user2._id,
                title: "Visit 10 Cafes",
                target: 10,
                current: 6,
                emoji: "☕",
              },
            ]);
            console.log(`🌱 Seeded demo goals for couple ${couple._id}`);
          }

          // Seed events if empty
          const eventCount = await Event.countDocuments({ coupleId: couple._id });
          if (eventCount === 0) {
            const in22Days = new Date();
            in22Days.setDate(in22Days.getDate() + 22);

            const in145Days = new Date();
            in145Days.setDate(in145Days.getDate() + 145);

            const in12Days = new Date();
            in12Days.setDate(in12Days.getDate() + 12);

            await Event.create([
              {
                coupleId: couple._id,
                createdBy: user1._id,
                title: "💕 Relationship Anniversary",
                eventDate: in22Days,
                eventType: "anniversary",
                emoji: "💕",
              },
              {
                coupleId: couple._id,
                createdBy: user1._id,
                title: "💍 Engagement Anniversary",
                eventDate: in145Days,
                eventType: "anniversary",
                emoji: "💍",
              },
              {
                coupleId: couple._id,
                createdBy: user2._id,
                title: "🎂 Partner Birthday",
                eventDate: in12Days,
                eventType: "custom",
                emoji: "🎂",
              },
            ]);
            console.log(`🌱 Seeded demo events for couple ${couple._id}`);
          }
        }
      }
    }
  } catch (error) {
    console.error("Error seeding demo data:", error);
  }
};
