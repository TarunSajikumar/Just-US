import { Server } from "socket.io";

let io: Server | null = null;

export const setIO = (instance: Server) => {
  io = instance;
};

export const getIO = (): Server | null => {
  return io;
};

/** Deterministic couple room ID */
export const getCoupleRoomId = (userId1: any, userId2: any) =>
  [userId1.toString(), userId2.toString()].sort().join("-");
