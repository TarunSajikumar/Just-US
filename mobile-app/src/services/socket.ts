import { io, Socket } from 'socket.io-client';
import { storageService } from './storageService';
import { BASE_URL } from './api';
import { AppState, AppStateStatus, Platform } from 'react-native';

// Derive socket URL from the API base (strip /api suffix)
const SOCKET_URL = BASE_URL.replace('/api', '');

class SocketService {
  private socket: Socket | null = null;
  private connectPromise: Promise<Socket | null> | null = null;
  private isConnecting = false;
  private heartbeatInterval: any = null;

  constructor() {
    this.setupAppStateListener();
  }

  /** Heartbeat ping to keep server informed and detect stale connections */
  startHeartbeat(intervalMs = 10000) {
    if (!this.socket) return;
    // clear existing interval
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    this.heartbeatInterval = setInterval(() => {
      if (this.socket && this.socket.connected) {
        this.socket.emit('client_heartbeat', { ts: new Date().toISOString() });
      }
    }, intervalMs);
  }

  private setupAppStateListener() {
    if (Platform.OS === 'web') {
      // Don't disconnect on Web when focus changes to keep receiving messages
      return;
    }
    AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      console.log(`📱 AppState changed to: ${nextAppState}`);
      if (nextAppState === 'active') {
        if (this.socket && !this.socket.connected) {
          console.log('🔌 App active: Reconnecting socket...');
          this.socket.connect();
        }
      } else if (nextAppState === 'background' || nextAppState === 'inactive') {
        if (this.socket && this.socket.connected) {
          console.log('🔌 App background/inactive: Disconnecting socket...');
          this.socket.disconnect();
        }
      }
    });
  }

  async connect() {
    // If already connected, return existing socket
    if (this.socket?.connected) {
      return this.socket;
    }

    // If already connecting, wait for that promise
    if (this.isConnecting && this.connectPromise) {
      return this.connectPromise;
    }

    // If socket exists but disconnected, try to reconnect it
    if (this.socket && !this.socket.connected) {
      this.socket.connect();
      return this.socket;
    }

    this.isConnecting = true;
    this.connectPromise = (async () => {
      try {
        const token = await storageService.getItem('userToken');
        if (!token) {
          console.warn('⚠️ Cannot connect socket: No token found');
          return null;
        }

        this.socket = io(SOCKET_URL, {
          auth: { token },
          transports: ['websocket'],
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: Infinity,
        });

        // start heartbeat once socket connects
        this.socket.on('connect', () => {
          this.startHeartbeat();
        });

        // clear heartbeat on disconnect
        this.socket.on('disconnect', () => {
          if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
          }
        });

        return this.socket;
      } finally {
        this.isConnecting = false;
        this.connectPromise = null;
      }
    })();

    return this.connectPromise;
  }

  getSocket() {
    return this.socket;
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
    this.connectPromise = null;
  }

  /** Emit user-online event */
  emitUserOnline(userId: string) {
    this.socket?.emit('user-online', userId);
  }

  /** Join the shared room with your partner */
  joinRoom(partnerId: string) {
    this.socket?.emit('join_room', partnerId);
  }

  /** Send a text message to your partner */
  sendMessage(receiverId: string, message: any) {
    this.socket?.emit('send_message', { receiverId, message });
  }

  /** Send a media message object (already persisted) to partner in real-time */
  sendMedia(receiverId: string, mediaMessage: any) {
    this.socket?.emit('send_media', { receiverId, mediaMessage });
  }

  /** Notify partner that a message was deleted */
  deleteMessage(messageId: string) {
    this.socket?.emit('delete_message', { messageId });
  }

  /** Send an emoji reaction to a message */
  sendReaction(messageId: string, reaction: string) {
    this.socket?.emit('message_reaction', { messageId, reaction });
  }

  /** Emit typing indicator (true = started typing, false = stopped) */
  emitTyping(partnerId: string, isTyping: boolean) {
    this.socket?.emit('typing', { partnerId, isTyping });
  }

  /** @deprecated Use emitTyping instead */
  sendTyping(partnerId: string) {
    this.socket?.emit('typing', { partnerId, isTyping: true });
  }

  /** Listen for incoming messages */
  onMessage(callback: (message: any) => void) {
    this.socket?.off('message');
    this.socket?.on('message', callback);
  }

  /** Listen for message status updates (delivered, read) */
  onMessageStatus(callback: (data: { messageId: string; status: string }) => void) {
    this.socket?.off('message_status');
    this.socket?.on('message_status', callback);
  }

  /** Listen for messages being read */
  onMessagesRead(callback: (data: { readerId: string }) => void) {
    this.socket?.off('messages_read');
    this.socket?.on('messages_read', callback);
  }

  /** Listen for message deletion events */
  onMessageDeleted(callback: (data: { messageId: string }) => void) {
    this.socket?.off('message_deleted');
    this.socket?.on('message_deleted', callback);
  }

  /** Listen for reaction events */
  onReaction(callback: (data: { messageId: string; reaction: string }) => void) {
    this.socket?.off('message_reaction');
    this.socket?.on('message_reaction', callback);
  }

  /** Listen for typing events */
  onTyping(callback: (data: { userId: string; isTyping: boolean }) => void) {
    this.socket?.off('user_typing');
    this.socket?.on('user_typing', callback);
  }

  /** Remove a specific listener */
  off(event: string) {
    this.socket?.off(event);
  }
}

export const socketService = new SocketService();
