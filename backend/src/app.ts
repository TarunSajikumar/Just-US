import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import "./config/env";
import authRoutes from "./routes/auth.routes";
import chatRoutes from "./routes/chatRoutes";
import inviteRoutes from "./routes/inviteRoutes";
import dashboardRoutes from "./routes/dashboard.routes";
import messagesRoutes from "./routes/messages.routes";
import memoriesRoutes from "./routes/memories.routes";
import coupleRoutes from "./routes/couple.routes";
import userRoutes from "./routes/user.routes";
import notificationRoutes from "./routes/notification.routes";
import moodRoutes from "./routes/mood.routes";
import achievementRoutes from "./routes/achievement.routes";
import noteRoutes from "./routes/note.routes";
import timelineRoutes from "./routes/timeline.routes";
import goalRoutes from "./routes/goal.routes";
import pollRoutes from "./routes/poll.routes";
import activityRoutes from "./routes/activity.routes";
import eventRoutes from "./routes/event.routes";
import { authMiddleware } from "./middleware/auth.middleware";

const app = express();

// Middleware
app.use(cors({
  origin: true, // Allow all origins during development, or specify your app's origin
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  optionsSuccessStatus: 200,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Health check endpoint
app.get("/", (_, res) => {
  const dbStatus = (mongoose.connection && mongoose.connection.readyState === 1) ? 'connected' : 'disconnected';
  res.json({
    status: "ok",
    message: "JustUs Backend Running ❤️",
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
    db: dbStatus
  });
});

app.get("/health", (_, res) => {
  const dbStatus = (mongoose.connection && mongoose.connection.readyState === 1) ? 'healthy' : 'unhealthy';
  res.json({
    status: dbStatus,
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/invite", inviteRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/messages", messagesRoutes);
app.use("/api/memories", memoriesRoutes);
app.use("/api/couple", coupleRoutes);
app.use("/api/users", userRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/moods", moodRoutes);
app.use("/api/achievements", achievementRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/timeline", timelineRoutes);
app.use("/api/goals", goalRoutes);
app.use("/api/polls", pollRoutes);
app.use("/api/activities", activityRoutes);
app.use("/api/events", eventRoutes);

app.get("/api/me", authMiddleware, (req: any, res) => {
  res.json({ userId: req.userId });
});

// 404 handler for undefined routes
app.use((req, res) => {
  console.log(`❌ 404 Not Found: ${req.method} ${req.path}`);
  res.status(404).json({ 
    message: "Endpoint not found",
    path: req.path,
    method: req.method 
  });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("❌ Unhandled Error:", err);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

export default app;
