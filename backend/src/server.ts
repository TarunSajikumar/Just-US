import http from "http";
import { Server } from "socket.io";
import app from "./app";
import { setupSockets } from "./sockets/chatSocket";

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Setup socket handlers
setupSockets(io);

async function start() {
  server.listen(PORT, () => {
    console.log(`Server running on ${PORT}`);
    console.log("SUPABASE_URL =", process.env.SUPABASE_URL);
  });
}

void start();
