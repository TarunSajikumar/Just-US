import http from "http";
import { Server } from "socket.io";
import app from "./app";
import { setupSockets } from "./sockets/chatSocket";
import { connectDB } from "./config/db";

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Setup socket handlers
setupSockets(io);

const start = async () => {
  try {
    await connectDB();
    server.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📍 Listening on http://0.0.0.0:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
  }
};

start();
