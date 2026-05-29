import express from "express";
import cors from "cors";
import "./config/env";
import authRoutes from "./routes/auth.routes";
import chatRoutes from "./routes/chatRoutes";
import inviteRoutes from "./routes/inviteRoutes";
import dashboardRoutes from "./routes/dashboard.routes";
import messagesRoutes from "./routes/messages.routes";
import memoriesRoutes from "./routes/memories.routes";
import { authMiddleware } from "./middleware/auth.middleware";

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' })); // larger limit for base64 image uploads

app.get("/", (_, res) => {
  res.send("JustUs Backend Running ❤️");
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/invite", inviteRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/messages", messagesRoutes);
app.use("/api/memories", memoriesRoutes);

app.get("/api/me", authMiddleware, (req: any, res) => {
  res.json({ userId: req.userId });
});

export default app;
