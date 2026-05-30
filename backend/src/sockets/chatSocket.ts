import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import Message from "../models/Message";

/** Deterministic room ID — always the same for two users regardless of who connects first */
const roomId = (a: string, b: string) => [a, b].sort().join("-");

export const setupSockets = (io: Server) => {
  io.on("connection", (socket: Socket) => {
    // ── Auth ──────────────────────────────────────────────
    let userId: string | null = null;
    try {
      const token = socket.handshake.auth.token as string;
      if (token) {
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);
        userId = decoded.userId;
      }
    } catch {
      console.warn("Socket connected with invalid/missing token");
    }

    console.log("Socket connected — userId:", userId ?? "(guest)");

    if (userId) {
      socket.broadcast.emit("user_status_change", { userId, status: "online" });
    }

    // ── Join room ─────────────────────────────────────────
    // Client sends: { partnerId: string }
    socket.on("join_room", (partnerId: string) => {
      if (!userId) return;
      const room = roomId(userId, partnerId);
      socket.join(room);
      console.log(`User ${userId} joined room: ${room}`);
    });

    // ── Send message ──────────────────────────────────────
    // Client sends: { receiverId: string, message: string }
    socket.on("send_message", async (data: { receiverId: string; message: string }) => {
      if (!userId) {
        socket.emit("error", { message: "Not authenticated" });
        return;
      }

      const { receiverId, message } = data;

      if (!receiverId || !message?.trim()) {
        socket.emit("error", { message: "receiverId and message are required" });
        return;
      }

      try {
        // Persist to MongoDB
        const saved = await Message.create({
          sender_id: userId,
          receiver_id: receiverId,
          message: message.trim(),
          read: false,
        });

        // Broadcast the real DB row to both users in the room
        const room = roomId(userId, receiverId);
        io.to(room).emit("message", {
          id: saved._id,
          senderId: saved.sender_id,
          receiverId: saved.receiver_id,
          message: saved.message,
          read: saved.read,
          createdAt: saved.createdAt,
        });
      } catch (error) {
        console.error("Failed to save message:", error);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // ── Typing indicator ──────────────────────────────────
    socket.on("typing", (data: { partnerId: string }) => {
      if (!userId) return;
      const room = roomId(userId, data.partnerId);
      socket.to(room).emit("user_typing", { userId });
    });

    // ── Disconnect ────────────────────────────────────────
    socket.on("disconnect", () => {
      console.log("Socket disconnected — userId:", userId ?? "(guest)");
      if (userId) {
        socket.broadcast.emit("user_status_change", {
          userId,
          status: "offline",
          lastSeen: new Date(),
        });
      }
    });
  });
};
