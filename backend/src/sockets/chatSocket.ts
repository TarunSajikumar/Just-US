import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import Message from "../models/Message";
import User from "../models/User";

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
      socket.join(userId);
      User.findByIdAndUpdate(userId, { isOnline: true }).catch((err) =>
        console.error("Error setting isOnline on connect:", err)
      );
      // Wait a tiny bit to ensure the connection is stable
      setTimeout(() => {
        socket.broadcast.emit("user_status_change", { userId, status: "online" });
      }, 500);
    }

    socket.on("user-online", async (id: string) => {
      userId = id;
      await User.findByIdAndUpdate(id, { isOnline: true }).catch(console.error);
      socket.join(id);
      socket.broadcast.emit("user_status_change", { userId: id, status: "online" });
    });

    // ── Join room ─────────────────────────────────────────
    socket.on("join_room", (partnerId: string) => {
      if (!userId) return;
      const room = roomId(userId, partnerId);
      socket.join(room);
      console.log(`User ${userId} joined room: ${room}`);
    });

    // ── Send text message ─────────────────────────────────
    socket.on("send_message", (data: { receiverId: string; message: any }) => {
      if (!userId) {
        socket.emit("error", { message: "Not authenticated" });
        return;
      }

      const { receiverId, message } = data;

      if (!receiverId || !message) {
        socket.emit("error", { message: "receiverId and message are required" });
        return;
      }

      const room = roomId(userId, receiverId);
      const sanitizedMessage = {
        ...message,
        sender_id: userId, // enforce authenticated user ID for safety
      };
      
      socket.to(room).emit("message", sanitizedMessage);
      console.log(`Socket message from ${userId} to ${receiverId} broadcasted in room ${room}`);
    });

    // ── Send media (already persisted by REST) ────────────
    socket.on("send_media", (data: { receiverId: string; mediaMessage: any }) => {
      if (!userId) return;
      const { receiverId, mediaMessage } = data;
      const room = roomId(userId, receiverId);
      const sanitizedMediaMessage = {
        ...mediaMessage,
        sender_id: userId, // enforce authenticated user ID for safety
      };
      socket.to(room).emit("message", sanitizedMediaMessage);
    });

    // ── Delete message ────────────────────────────────────
    socket.on("delete_message", async (data: { messageId: string }) => {
      if (!userId) return;
      const { messageId } = data;

      try {
        const message = await Message.findOneAndDelete({
          _id: messageId,
          sender_id: userId,
        });

        if (message) {
          // Notify partner
          const receiverId = message.receiver_id?.toString();
          if (receiverId) {
            const room = roomId(userId, receiverId);
            io.to(room).emit("message_deleted", { messageId });
          }
        }
      } catch (error) {
        console.error("Failed to delete message via socket:", error);
      }
    });

    // ── Message reaction ──────────────────────────────────
    socket.on("message_reaction", async (data: { messageId: string; reaction: string }) => {
      if (!userId) return;
      const { messageId, reaction } = data;

      try {
        const message = await Message.findById(messageId);
        if (!message) return;

        const newReaction = (message as any).reaction === reaction ? null : reaction;
        (message as any).reaction = newReaction;
        await message.save();

        const receiverId = message.sender_id.toString() === userId
          ? message.receiver_id?.toString()
          : message.sender_id.toString();

        if (receiverId) {
          const room = roomId(userId, receiverId);
          io.to(room).emit("message_reaction", { messageId, reaction: newReaction });
        }
      } catch (error) {
        console.error("Failed to process reaction:", error);
      }
    });

    // ── Typing indicator ──────────────────────────────────
    // Supports both old format { partnerId } and new { partnerId, isTyping }
    socket.on("typing", (data: { partnerId: string; isTyping?: boolean }) => {
      if (!userId) return;
      const room = roomId(userId, data.partnerId);
      socket.to(room).emit("user_typing", {
        userId,
        isTyping: data.isTyping !== false, // default true for backward compat
      });
    });

    // ── Quick love sent ───────────────────────────────────
    socket.on("quick_love_sent", async (data: { message: string }) => {
      if (!userId) return;
      try {
        const currentUser = await User.findById(userId);
        if (currentUser && currentUser.partner_id) {
          const room = roomId(userId, currentUser.partner_id.toString());
          socket.to(room).emit("quick_love_received", {
            message: data.message,
          });
        }
      } catch (error) {
        console.error("Error handling quick_love_sent socket event:", error);
      }
    });

    // ── Disconnect ────────────────────────────────────────
    socket.on("disconnect", () => {
      console.log("Socket disconnected — userId:", userId ?? "(guest)");
      if (userId) {
        const userRoom = io.sockets.adapter.rooms.get(userId);
        const stillConnected = userRoom ? userRoom.size > 0 : false;

        if (!stillConnected) {
          const lastSeen = new Date();
          User.findByIdAndUpdate(userId, {
            isOnline: false,
            lastSeen,
          }).catch((err) => console.error("Error setting offline on disconnect:", err));

          socket.broadcast.emit("user_status_change", {
            userId,
            status: "offline",
            lastSeen,
          });
        } else {
          console.log(`User ${userId} still has active connection(s) (remaining sockets: ${userRoom?.size}).`);
        }
      }
    });
  });
};
