import express from "express";
import cors from "cors";
import "./config/env";
import authRoutes from "./routes/auth.routes";
import chatRoutes from "./routes/chatRoutes";
import inviteRoutes from "./routes/inviteRoutes";
import { authMiddleware } from "./middleware/auth.middleware";
import testRoutes from "./routes/test.routes";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_, res) => {
  res.send("JustUs Backend Running ❤️");
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/invite", inviteRoutes);
app.use("/api/test", testRoutes);

app.get("/api/me", authMiddleware, (req: any, res) => {
  res.json({ userId: req.userId });
});

export default app;
