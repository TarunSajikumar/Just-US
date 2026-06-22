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
      if (!token) {
        console.warn("Socket connection rejected: missing token");
        socket.disconnect(true);
        return;
      }
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);
      userId = decoded.userId;
    } catch (err) {
      console.warn("Socket connection rejected: invalid token");
      socket.disconnect(true);
      return;
    }

    console.log("Socket connected — userId:", userId);

    if (userId) {
      socket.join(userId);
      (socket as any).userId = userId;

      User.findByIdAndUpdate(userId, { isOnline: true }).then(async (userObj) => {
        if (userObj && userObj.partner_id) {
          const partnerId = userObj.partner_id.toString();
          
          // Emit online status change to partner room
          io.to(partnerId).emit("user_status_change", { userId, status: "online" });

          // Check if partner is currently online
          const partnerSockets = Array.from(io.of("/").sockets.values());
          const isPartnerOnline = partnerSockets.some((s: any) => s.userId === partnerId);
          const partnerUser = await User.findById(partnerId);
          
          // Send partner's current status to this connecting user socket
          socket.emit("user_status_change", {
            userId: partnerId,
            status: isPartnerOnline ? "online" : "offline",
            lastSeen: partnerUser?.lastSeen || null,
          });
        }
      }).catch((err) =>
        console.error("Error setting isOnline on connect:", err)
      );
    }

    socket.on("user-online", async (id: string) => {
      if (userId && id === userId) {
        await User.findByIdAndUpdate(id, { isOnline: true }).catch(console.error);
        socket.join(id);
        const userObj = await User.findById(id);
        if (userObj && userObj.partner_id) {
          io.to(userObj.partner_id.toString()).emit("user_status_change", { userId: id, status: "online" });
        }
      }
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

    // ── Profile update sync (for display name / gender changes) ─────────────────
    socket.on('profile_updated', async (data: { userId: string; name?: string; gender?: string; birthday?: string }) => {
      // broadcast to partner room if exists
      try {
        if (!userId) return;
        const userObj = await User.findById(userId);
        if (userObj && userObj.partner_id) {
          const room = roomId(userId, userObj.partner_id.toString());
          io.to(room).emit('profile_updated', data);
        }
      } catch (err) {
        console.error('profile_updated handler error:', err);
      }
    });

    // ── Client heartbeat to keep presence accurate ───────────────────────────
    socket.on('client_heartbeat', async (data: any) => {
      try {
        if (!userId) return;
        await User.findByIdAndUpdate(userId, { lastHeartbeat: new Date(), isOnline: true });
      } catch (err) {
        console.error('heartbeat handler error:', err);
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
      console.log("Socket disconnected — userId:", userId);
      if (userId) {
        const stillConnected = Array.from(io.of("/").sockets.values()).some(
          (s: any) => s.userId === userId && s.id !== socket.id
        );

        if (!stillConnected) {
          const lastSeen = new Date();
          User.findByIdAndUpdate(userId, {
            isOnline: false,
            lastSeen,
          }).then(async (userObj) => {
            if (userObj && userObj.partner_id) {
              io.to(userObj.partner_id.toString()).emit("user_status_change", {
                userId,
                status: "offline",
                lastSeen,
              });
            }
          }).catch((err) => console.error("Error setting offline on disconnect:", err));
        } else {
          console.log(`User ${userId} still has active connection(s).`);
        }
      }
    });
  });
};
