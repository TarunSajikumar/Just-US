import { io, Socket } from 'socket.io-client';
import { storageService } from './storageService';
import { BASE_URL } from './api';

// Derive socket URL from the API base (strip /api suffix)
const SOCKET_URL = BASE_URL.replace('/api', '');

class SocketService {
  private socket: Socket | null = null;

  async connect() {
    const token = await storageService.getItem('userToken');

    this.socket = io(SOCKET_URL, {
      auth: { token },         // JWT — backend verifies this on connect
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket connected');
    });

    this.socket.on('connect_error', (err) => {
      console.error('❌ Socket connect error:', err.message);
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    return this.socket;
  }

  getSocket() {
    return this.socket;
  }

  disconnect() {
    this.socket?.disconnect();
  }

  /** Emit user-online event */
  emitUserOnline(userId: string) {
    this.socket?.emit('user-online', userId);
  }

  /** Join the shared room with your partner */
  joinRoom(partnerId: string) {
    this.socket?.emit('join_room', partnerId);
  }

  /** Send a message to your partner */
  sendMessage(receiverId: string, message: string) {
    this.socket?.emit('send_message', { receiverId, message });
  }

  /** Typing indicator */
  sendTyping(partnerId: string) {
    this.socket?.emit('typing', { partnerId });
  }

  /** Listen for incoming messages */
  onMessage(callback: (message: any) => void) {
    this.socket?.on('message', callback);
  }

  /** Listen for typing events */
  onTyping(callback: (data: { userId: string }) => void) {
    this.socket?.on('user_typing', callback);
  }

  /** Remove a specific listener */
  off(event: string) {
    this.socket?.off(event);
  }
}

export const socketService = new SocketService();
