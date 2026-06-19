import http from "http";
import os from "os";
import { Server } from "socket.io";
import app from "./app";
import { setupSockets } from "./sockets/chatSocket";
import { setIO } from "./sockets/index";
import { connectDB } from "./config/db";
import { seedDemoData } from "./utils/seeder";

const PORT = Number(process.env.PORT) || 5000;
const server = http.createServer(app);

const getLocalIp = () => {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]!) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "localhost";
};

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Store io instance for global access
setIO(io);

// Setup socket handlers
setupSockets(io);

const start = async () => {
  try {
    await connectDB();
    await seedDemoData();
    server.listen(PORT, "0.0.0.0", () => {
      const localIp = getLocalIp();
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📍 Local: http://localhost:${PORT}`);
      console.log(`🌐 Network: http://${localIp}:${PORT}`);
      console.log(`📱 Android Emulator: http://10.0.2.2:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
  }
};

start();
