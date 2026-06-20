import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Share,
  Clipboard,
  Dimensions,
  StatusBar,
  Vibration,
  Linking,
} from 'react-native';
import { COLORS } from '../../theme/colors';
import { ChatHeader } from '../../components/chat/ChatHeader';
import { MessageBubble } from '../../components/chat/MessageBubble';
import { ChatInput } from '../../components/chat/ChatInput';
import { socketService } from '../../services/socket';
import { useAuthStore } from '../../store/authStore';
import { messageService, ChatMessage } from '../../services/messageService';
import { api } from '../../services/api';
import { FontAwesome, Ionicons, Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import Toast from 'react-native-toast-message';
import Animated, {
  FadeIn,
  ZoomIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
} from 'react-native-reanimated';
import { Audio } from 'expo-av';

const PAGE_SIZE = 50;
const MAX_SELECTION = 5;

// ─── Components ──────────────────────────────────────────────────────────────

const TypingDots = () => {
  const [activeDot, setActiveDot] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveDot((prev) => (prev + 1) % 3);
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.typingDotsContainer}>
      {[0, 1, 2].map((idx) => (
        <Animated.View
          key={idx}
          entering={FadeIn.duration(300)}
          style={[
            styles.typingDot,
            {
              opacity: activeDot === idx ? 1 : 0.3,
              transform: [{ scale: activeDot === idx ? 1.25 : 1 }],
            },
          ]}
        />
      ))}
    </View>
  );
};

const VoiceRecorder = ({ onSendVoice }: { onSendVoice: (uri: string, duration: number) => void }) => {
  const [recording, setRecording] = useState<any>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const intervalRef = useRef<any>(null);

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Toast.show({ type: 'error', text1: 'Microphone permission required' });
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
      setRecordingDuration(0);

      intervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      Vibration.vibrate(50);
    } catch (err) {
      console.error('Failed to start recording:', err);
      Toast.show({ type: 'error', text1: 'Failed to start recording' });
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    setIsRecording(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setIsProcessing(true);
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      const duration = recordingDuration;

      if (uri && duration >= 1) {
        // Save to local cache
        const fileName = `voice_${Date.now()}.m4a`;
        const destination = `${(FileSystem as any).cacheDirectory}${fileName}`;
        await FileSystem.copyAsync({ from: uri, to: destination });

        onSendVoice(destination, duration);
      } else {
        Toast.show({ type: 'error', text1: 'Recording too short (min 1s)' });
      }
    } catch (err) {
      console.error('Failed to stop recording:', err);
      Toast.show({ type: 'error', text1: 'Failed to save recording' });
    } finally {
      setIsProcessing(false);
      setRecording(null);
      setRecordingDuration(0);
    }
  };

  const cancelRecording = async () => {
    if (!recording) return;
    setIsRecording(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    try {
      await recording.stopAndUnloadAsync();
    } catch (err) {
      console.error('Failed to cancel recording:', err);
    } finally {
      setRecording(null);
      setRecordingDuration(0);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (isRecording) {
    return (
      <Animated.View entering={SlideInDown} exiting={SlideOutDown} style={styles.recordingContainer}>
        <TouchableOpacity onPress={cancelRecording} style={styles.recordingCancel}>
          <FontAwesome name="times-circle" size={24} color="#ff4444" />
        </TouchableOpacity>
        <View style={styles.recordingIndicator}>
          <View style={styles.recordingPulse} />
          <Text style={styles.recordingTime}>{formatTime(recordingDuration)}</Text>
        </View>
        <TouchableOpacity onPress={stopRecording} style={styles.recordingStop}>
          <FontAwesome name="stop-circle" size={32} color="#ff4444" />
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <TouchableOpacity
      onPressIn={startRecording}
      onLongPress={startRecording}
      delayLongPress={200}
      style={styles.voiceButton}
      disabled={isProcessing}
    >
      {isProcessing ? (
        <ActivityIndicator size="small" color={COLORS.primary} />
      ) : (
        <Ionicons name="mic" size={24} color={COLORS.primary} />
      )}
    </TouchableOpacity>
  );
};

// ─── Main Component ─────────────────────────────────────────────────────────

export default function ChatScreen({ navigation }: any) {
  const { user, partner } = useAuthStore();
  const partnerId = partner?.id || partner?._id;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isPartnerOnline, setIsPartnerOnline] = useState(false);
  const [partnerLastSeen, setPartnerLastSeen] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSendingMedia, setIsSendingMedia] = useState(false);
  const [replyToMessage, setReplyToMessage] = useState<ChatMessage | null>(null);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ChatMessage[]>([]);
  const [showLoveBlast, setShowLoveBlast] = useState(false);
  const [hasError, setHasError] = useState(false);

  // ─── Enhanced Features State ─────────────────────────────────────────────
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
  const [isPlayingVoice, setIsPlayingVoice] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isPinModalVisible, setIsPinModalVisible] = useState(false);
  const [pinnedMessages, setPinnedMessages] = useState<ChatMessage[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isTypingIndicatorVisible, setIsTypingIndicatorVisible] = useState(false);
  const [messageToEdit, setMessageToEdit] = useState<ChatMessage | null>(null);
  const [editText, setEditText] = useState('');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [savedMessages, setSavedMessages] = useState<ChatMessage[]>([]);
  const [isSavedMessagesVisible, setIsSavedMessagesVisible] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const shouldScrollToEnd = useRef(true);
  const typingTimeoutRef = useRef<any>(null);
  const audioRef = useRef<any>(null);
  const isMounted = useRef(true);

  // ─── Cleanup ──────────────────────────────────────────────────────────────
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (audioRef.current) {
        audioRef.current.unloadAsync().catch(() => { });
      }
    };
  }, []);

  // ─── Load Pinned & Saved Messages ──────────────────────────────────────────
  const loadPinnedMessages = useCallback(async () => {
    if (!partnerId) return;
    try {
      const response = await api.get(`/messages/pinned/${partnerId}`);
      if (response.data) {
        setPinnedMessages(response.data);
      }
    } catch (err) {
      console.error('Failed to load pinned messages:', err);
    }
  }, [partnerId]);

  const loadSavedMessages = useCallback(async () => {
    if (!partnerId) return;
    try {
      const response = await api.get(`/messages/saved/${partnerId}`);
      if (response.data) {
        setSavedMessages(response.data);
      }
    } catch (err) {
      console.error('Failed to load saved messages:', err);
    }
  }, [partnerId]);

  const loadUnreadCount = useCallback(async () => {
    if (!partnerId) return;
    try {
      const response = await api.get(`/messages/unread/${partnerId}`);
      if (response.data) {
        setUnreadCount(response.data.count || 0);
      }
    } catch (err) {
      console.error('Failed to load unread count:', err);
    }
  }, [partnerId]);

  // ─── Load History ──────────────────────────────────────────────────────────
  const loadHistory = useCallback(async (isLoadMore = false) => {
    if (!partnerId || !isMounted.current) return;
    try {
      setHasError(false);
      const beforeTimestamp =
        isLoadMore && messages.length > 0 ? messages[0].created_at : undefined;
      const newMessages = await messageService.getHistory(partnerId, beforeTimestamp);

      if (isMounted.current) {
        if (isLoadMore) {
          setMessages((prev) => [...newMessages, ...prev]);
          setHasMore(newMessages.length >= PAGE_SIZE);
        } else {
          setMessages(newMessages);
          setHasMore(newMessages.length >= PAGE_SIZE);
          loadPinnedMessages();
          loadSavedMessages();
        }
      }
    } catch (err) {
      console.error('Failed to load chat history:', err);
      if (isMounted.current) {
        setHasError(true);
        Toast.show({ type: 'error', text1: 'Failed to load messages' });
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    }
  }, [partnerId, messages.length, loadPinnedMessages, loadSavedMessages]);

  useEffect(() => {
    loadHistory(false);

    if (partnerId) {
      // Mark as read on open
      messageService.markAsRead(partnerId).catch(() => { });

      // Fetch initial partner status
      api.get('/users/partner-status').then(res => {
        if (res.data && isMounted.current) {
          setIsPartnerOnline(res.data.isOnline);
          setPartnerLastSeen(res.data.lastSeen);
        }
      }).catch(() => { });

      loadUnreadCount();
    }
  }, [partnerId, loadHistory, loadUnreadCount]);

  const loadMore = useCallback(() => {
    if (!isLoadingMore && hasMore && !isLoading && messages.length > 0 && isMounted.current) {
      setIsLoadingMore(true);
      const beforeTimestamp = messages[0].created_at;
      messageService
        .getHistory(partnerId!, beforeTimestamp)
        .then((newMessages) => {
          if (isMounted.current) {
            setMessages((prev) => [...newMessages, ...prev]);
            setHasMore(newMessages.length >= PAGE_SIZE);
          }
        })
        .catch(console.error)
        .finally(() => {
          if (isMounted.current) {
            setIsLoadingMore(false);
          }
        });
    }
  }, [isLoadingMore, hasMore, isLoading, messages, partnerId]);

  // ─── Socket Setup ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!partnerId || !(user?.id || user?._id)) return;

    let socketInstance: any = null;
    let handleConnectFn: (() => void) | null = null;

    const setupSocket = async () => {
      const socket = await socketService.connect();
      if (!socket || !isMounted.current) return;

      socketInstance = socket;

      const handleConnect = () => {
        socketService.emitUserOnline(user.id || user._id);
        socketService.joinRoom(partnerId);
        // Sync on reconnect
        loadHistory(false).catch(() => { });
        api.get('/users/partner-status').then(res => {
          if (res.data && isMounted.current) {
            setIsPartnerOnline(res.data.isOnline);
            setPartnerLastSeen(res.data.lastSeen);
          }
        }).catch(() => { });
        loadUnreadCount();
      };
      handleConnectFn = handleConnect;

      if (socket.connected) {
        handleConnect();
      }
      socket.on('connect', handleConnect);

      // Receive real-time messages
      socketService.onMessage((incomingMessage: any) => {
        if (!incomingMessage || !isMounted.current) return;

        setMessages((prev) => {
          const messagesArray = Array.isArray(prev) ? prev : [];
          const exists = messagesArray.some(
            (m) =>
              (m.id && (m.id === incomingMessage.id || m.id === incomingMessage._id)) ||
              (m.isTemp && m.message === incomingMessage.message && Math.abs(Date.now() - new Date(m.created_at).getTime()) < 5000)
          );

          if (exists) {
            return messagesArray.map(m =>
              (m.id === (incomingMessage.id || incomingMessage._id))
                ? { ...m, ...incomingMessage, id: m.id }
                : m
            );
          }

          const msg: ChatMessage = {
            id: incomingMessage.id || incomingMessage._id,
            sender_id: incomingMessage.senderId || incomingMessage.sender_id,
            message: incomingMessage.message,
            read: incomingMessage.read ?? false,
            created_at: incomingMessage.createdAt || incomingMessage.created_at,
            status: 'delivered',
            media_url: incomingMessage.media_url,
            media_type: incomingMessage.media_type,
            reply_to: incomingMessage.reply_to,
            is_voice: incomingMessage.is_voice || false,
            voice_duration: incomingMessage.voice_duration || 0,
          };
          return [...messagesArray, msg];
        });

        shouldScrollToEnd.current = true;
        setTimeout(() => {
          if (flatListRef.current && isMounted.current) {
            flatListRef.current.scrollToEnd({ animated: true });
          }
        }, 100);

        if (partnerId) {
          messageService.markAsRead(partnerId).catch(() => { });
          loadUnreadCount();
        }

        Vibration.vibrate(50);
      });

      // Message status updates
      socketService.onMessageStatus((data) => {
        if (!data || !data.messageId || !isMounted.current) return;
        const { messageId, status } = data;
        setMessages((prev) =>
          Array.isArray(prev)
            ? prev.map((msg) => msg.id === messageId ? { ...msg, status: status as any } : msg)
            : []
        );
      });

      // Deletion events
      socketService.onMessageDeleted((data) => {
        if (!data || !data.messageId || !isMounted.current) return;
        const { messageId } = data;
        setMessages((prev) => Array.isArray(prev) ? prev.filter((msg) => msg.id !== messageId) : []);
        setPinnedMessages(prev => prev.filter(msg => msg.id !== messageId));
        setSavedMessages(prev => prev.filter(msg => msg.id !== messageId));
      });

      // Reaction events
      socketService.onReaction((data) => {
        if (!data || !data.messageId || !isMounted.current) return;
        const { messageId, reaction } = data;
        setMessages((prev) =>
          Array.isArray(prev)
            ? prev.map((msg) =>
              msg.id === messageId
                ? { ...msg, reaction: msg.reaction === reaction ? null : reaction }
                : msg
            )
            : []
        );
      });

      // Real-time edited messages
      socket.on('message_edited', (data: { messageId: string; message: string }) => {
        if (!isMounted.current) return;
        const { messageId, message } = data;
        setMessages((prev) =>
          Array.isArray(prev)
            ? prev.map((msg) =>
              msg.id === messageId
                ? { ...msg, message, is_edited: true }
                : msg
            )
            : []
        );
      });

      // Partner online status
      socket?.on('user_status_change', (data: { userId: string; status: string; lastSeen?: string }) => {
        if (!isMounted.current) return;
        if (data.userId === partner?.id || data.userId === partner?._id) {
          setIsPartnerOnline(data.status === 'online');
          if (data.status === 'offline' && data.lastSeen) {
            setPartnerLastSeen(data.lastSeen);
          }
        }
      });

      // Typing indicator
      socketService.onTyping(({ userId, isTyping: typing }) => {
        if (!isMounted.current) return;
        if (userId === partner?.id || userId === partner?._id) {
          setIsTyping(typing);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          if (typing) {
            setIsTypingIndicatorVisible(true);
            typingTimeoutRef.current = setTimeout(() => {
              setIsTyping(false);
              setIsTypingIndicatorVisible(false);
            }, 4000);
          } else {
            setIsTypingIndicatorVisible(false);
          }
        }
      });

      // Read receipts
      socketService.onMessagesRead(({ readerId }) => {
        if (!isMounted.current) return;
        if (readerId === partnerId) {
          setMessages((prev) =>
            Array.isArray(prev)
              ? prev.map((msg) =>
                msg.sender_id === (user?.id || user?._id)
                  ? { ...msg, read: true, status: 'read' }
                  : msg
              )
              : []
          );
        }
      });
    };

    setupSocket();

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (socketInstance && handleConnectFn) {
        socketInstance.off('connect', handleConnectFn);
      }
    };
  }, [partnerId, user?.id, user?._id, partner?.id, partner?._id, loadUnreadCount]);

  // ─── Send Message ──────────────────────────────────────────────────────────
  const handleSend = useCallback(
    async (text: string) => {
      if (!partnerId || !text.trim() || isSending) return;

      setIsSending(true);
      const trimmedText = text.trim();
      const tempId = `temp_${Date.now()}`;
      const userId = user?.id || user?._id || '';

      // Optimistic message
      const optimistic: ChatMessage = {
        id: tempId,
        sender_id: userId,
        message: trimmedText,
        read: false,
        created_at: new Date().toISOString(),
        status: 'sent',
        reply_to: replyToMessage?.message || null,
        isTemp: true,
      };

      setMessages((prev) => [...prev, optimistic]);
      setReplyToMessage(null);
      shouldScrollToEnd.current = true;
      flatListRef.current?.scrollToEnd({ animated: true });

      // Trigger Love Blast!
      setShowLoveBlast(true);
      setTimeout(() => setShowLoveBlast(false), 2000);

      try {
        const saved = await messageService.sendMessage(
          partnerId,
          trimmedText,
          replyToMessage?.id
        );
        if (isMounted.current) {
          setMessages((prev) =>
            prev.map((msg) => (msg.id === tempId ? { ...saved, status: 'sent' } : msg))
          );
          socketService.sendMessage(partnerId, saved);
          loadUnreadCount();
        }
      } catch (err) {
        if (isMounted.current) {
          setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
          Toast.show({ type: 'error', text1: 'Failed to send message' });
        }
      } finally {
        if (isMounted.current) {
          setIsSending(false);
        }
      }
    },
    [partnerId, user?.id, isSending, replyToMessage, loadUnreadCount]
  );

  // ─── Send Voice Message ───────────────────────────────────────────────────
  const handleSendVoice = useCallback(
    async (voiceUri: string, duration: number) => {
      if (!partnerId) return;

      setIsSending(true);
      const tempId = `temp_voice_${Date.now()}`;
      const userId = user?.id || user?._id || '';

      const optimistic: ChatMessage = {
        id: tempId,
        sender_id: userId,
        message: '🎤 Voice message',
        read: false,
        created_at: new Date().toISOString(),
        status: 'sent',
        is_voice: true,
        voice_duration: duration,
        isTemp: true,
        media_url: voiceUri,
        media_type: 'audio',
      };

      setMessages((prev) => [...prev, optimistic]);
      shouldScrollToEnd.current = true;
      flatListRef.current?.scrollToEnd({ animated: true });

      try {
        // Upload voice
        const saved = await messageService.sendVoiceMessage(partnerId, voiceUri);
        // Include voice duration updates if backend returned it
        saved.voice_duration = duration;

        if (isMounted.current) {
          setMessages((prev) =>
            prev.map((msg) => (msg.id === tempId ? { ...saved, status: 'sent' } : msg))
          );
          socketService.sendMessage(partnerId, saved);
        }
      } catch (err) {
        if (isMounted.current) {
          setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
          Toast.show({ type: 'error', text1: 'Failed to send voice message' });
        }
      } finally {
        if (isMounted.current) {
          setIsSending(false);
        }
      }
    },
    [partnerId, user?.id]
  );

  // ─── Send Media / Document ─────────────────────────────────────────────────
  const handleSendMedia = useCallback(() => {
    Alert.alert('Send Attachment', 'Choose media type', [
      { text: 'Photo', onPress: () => pickMedia('photo') },
      { text: 'Video', onPress: () => pickMedia('video') },
      { text: 'Document', onPress: () => pickDocument() },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, []);

  const pickMedia = async (type: 'photo' | 'video') => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Toast.show({ type: 'error', text1: 'Permission required to access media' });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: type === 'photo' ? ImagePicker.MediaTypeOptions.Images : ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: type === 'photo',
      quality: 0.8,
      allowsMultipleSelection: true,
      selectionLimit: MAX_SELECTION,
    });

    if (!result.canceled && result.assets && result.assets.length > 0 && partnerId) {
      setIsSendingMedia(true);
      try {
        for (const asset of result.assets) {
          const mediaMessage = await messageService.sendMedia(
            partnerId,
            asset.uri,
            type
          );
          if (isMounted.current) {
            setMessages((prev) => [...prev, mediaMessage]);
            socketService.sendMedia(partnerId, mediaMessage);
          }
        }
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      } catch (error) {
        Toast.show({ type: 'error', text1: 'Failed to send media' });
      } finally {
        if (isMounted.current) {
          setIsSendingMedia(false);
        }
      }
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || !result.assets[0]) return;

      const asset = result.assets[0];
      setIsSendingMedia(true);

      try {
        const mediaMessage = await messageService.sendDocument(partnerId!, asset.uri, asset.name);
        if (isMounted.current) {
          setMessages((prev) => [...prev, mediaMessage]);
          socketService.sendMedia(partnerId!, mediaMessage);
        }
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        Toast.show({ type: 'success', text1: 'Document sent' });
      } catch (error) {
        Toast.show({ type: 'error', text1: 'Failed to send document' });
      } finally {
        if (isMounted.current) {
          setIsSendingMedia(false);
        }
      }
    } catch (error) {
      console.error('Document picker error:', error);
    }
  };

  // ─── Voice Playback ────────────────────────────────────────────────────────
  const playVoiceMessage = useCallback(async (messageId: string, uri: string) => {
    try {
      if (isPlayingVoice === messageId) {
        if (audioRef.current) {
          await audioRef.current.stopAsync();
          await audioRef.current.unloadAsync();
          audioRef.current = null;
        }
        setIsPlayingVoice(null);
        return;
      }

      if (audioRef.current) {
        await audioRef.current.stopAsync();
        await audioRef.current.unloadAsync();
        audioRef.current = null;
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true }
      );
      audioRef.current = sound;
      setIsPlayingVoice(messageId);

      sound.setOnPlaybackStatusUpdate((status: any) => {
        if (status.didJustFinish) {
          setIsPlayingVoice(null);
          sound.unloadAsync().catch(() => { });
          audioRef.current = null;
        }
      });
    } catch (err) {
      console.error('Failed to play voice message:', err);
      Toast.show({ type: 'error', text1: 'Failed to play voice message' });
      setIsPlayingVoice(null);
    }
  }, [isPlayingVoice]);

  // ─── Pin Message ──────────────────────────────────────────────────────────
  const handlePinMessage = useCallback(async (message: ChatMessage) => {
    try {
      await api.post(`/messages/pin/${message.id}`);
      if (isMounted.current) {
        setPinnedMessages(prev => [message, ...prev]);
        Toast.show({ type: 'success', text1: 'Message pinned' });
      }
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Failed to pin message' });
    }
  }, []);

  const handleUnpinMessage = useCallback(async (messageId: string) => {
    try {
      await api.delete(`/messages/pin/${messageId}`);
      if (isMounted.current) {
        setPinnedMessages(prev => prev.filter(msg => msg.id !== messageId));
        Toast.show({ type: 'success', text1: 'Message unpinned' });
      }
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Failed to unpin message' });
    }
  }, []);

  // ─── Save Message ──────────────────────────────────────────────────────────
  const handleSaveMessage = useCallback(async (message: ChatMessage) => {
    try {
      await api.post(`/messages/save/${message.id}`);
      if (isMounted.current) {
        setSavedMessages(prev => [message, ...prev]);
        Toast.show({ type: 'success', text1: 'Message saved' });
      }
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Failed to save message' });
    }
  }, []);

  const handleUnsaveMessage = useCallback(async (messageId: string) => {
    try {
      await api.delete(`/messages/save/${messageId}`);
      if (isMounted.current) {
        setSavedMessages(prev => prev.filter(msg => msg.id !== messageId));
        Toast.show({ type: 'success', text1: 'Message removed from saved' });
      }
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Failed to unsave message' });
    }
  }, []);

  // ─── Edit Message ──────────────────────────────────────────────────────────
  const handleEditMessage = useCallback((message: ChatMessage) => {
    setMessageToEdit(message);
    setEditText(message.message);
    setEditModalVisible(true);
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!messageToEdit || !editText.trim()) return;

    try {
      await api.put(`/messages/${messageToEdit.id}`, { message: editText.trim() });
      if (isMounted.current) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageToEdit.id
              ? { ...msg, message: editText.trim(), is_edited: true }
              : msg
          )
        );
        setEditModalVisible(false);
        setMessageToEdit(null);
        setEditText('');
        Toast.show({ type: 'success', text1: 'Message edited' });
      }
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Failed to edit message' });
    }
  }, [messageToEdit, editText]);

  // ─── Forward / Share / Copy Message ────────────────────────────────────────
  const handleForwardMessage = useCallback((message: ChatMessage) => {
    navigation.navigate('SelectContact', {
      messageToForward: message,
      onForward: (targetUserId: string) => {
        messageService.forwardMessage(message.id, targetUserId)
          .then(() => Toast.show({ type: 'success', text1: 'Message forwarded' }))
          .catch(() => Toast.show({ type: 'error', text1: 'Failed to forward' }));
      }
    });
  }, [navigation]);

  const handleShareMessage = useCallback(async (message: ChatMessage) => {
    try {
      await Share.share({
        message: message.message || 'Check out this message',
        title: 'Shared Message',
      });
    } catch (err) {
      console.error('Failed to share message:', err);
    }
  }, []);

  const handleCopyMessage = useCallback((message: ChatMessage) => {
    Clipboard.setString(message.message || '');
    Toast.show({ type: 'success', text1: 'Message copied' });
  }, []);

  // ─── Delete Message ────────────────────────────────────────────────────────
  const handleDeleteMessage = useCallback((messageId: string) => {
    Alert.alert(
      'Delete Message',
      'How would you like to delete this message?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete for me',
          onPress: async () => {
            try {
              await messageService.deleteMessageForMe(messageId);
              setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
              setPinnedMessages((prev) => prev.filter((msg) => msg.id !== messageId));
              setSavedMessages((prev) => prev.filter((msg) => msg.id !== messageId));
            } catch {
              Toast.show({ type: 'error', text1: 'Failed to delete message' });
            }
          }
        },
        {
          text: 'Delete for everyone',
          style: 'destructive',
          onPress: async () => {
            try {
              await messageService.deleteMessage(messageId);
              setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
              socketService.deleteMessage(messageId);
            } catch {
              Toast.show({ type: 'error', text1: 'Failed to delete message' });
            }
          },
        },
      ]
    );
  }, []);

  // ─── React to Message ──────────────────────────────────────────────────────
  const handleReactToMessage = useCallback(async (messageId: string, reaction: string) => {
    try {
      await messageService.addReaction(messageId, reaction);
      if (isMounted.current) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId
              ? { ...msg, reaction: msg.reaction === reaction ? null : reaction }
              : msg
          )
        );
        socketService.sendReaction(messageId, reaction);
        Vibration.vibrate(30);
      }
    } catch {
      console.error('Failed to add reaction');
    }
  }, []);

  // ─── Selection Mode ──────────────────────────────────────────────────────
  const toggleSelectionMode = useCallback(() => {
    setIsSelectionMode(prev => !prev);
    if (isSelectionMode) {
      setSelectedMessages([]);
    }
  }, [isSelectionMode]);

  const toggleMessageSelection = useCallback((messageId: string) => {
    setSelectedMessages(prev =>
      prev.includes(messageId)
        ? prev.filter(id => id !== messageId)
        : [...prev, messageId]
    );
  }, []);

  const handleDeleteSelected = useCallback(() => {
    if (selectedMessages.length === 0) return;

    Alert.alert(
      'Delete Messages',
      `Delete ${selectedMessages.length} selected messages?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              for (const id of selectedMessages) {
                await messageService.deleteMessage(id);
                socketService.deleteMessage(id);
              }
              setMessages((prev) => prev.filter((msg) => !selectedMessages.includes(msg.id)));
              setSelectedMessages([]);
              setIsSelectionMode(false);
              Toast.show({ type: 'success', text1: `${selectedMessages.length} messages deleted` });
            } catch {
              Toast.show({ type: 'error', text1: 'Failed to delete messages' });
            }
          },
        },
      ]
    );
  }, [selectedMessages]);

  // ─── Mute Chat ────────────────────────────────────────────────────────────
  const toggleMute = useCallback(() => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    Toast.show({
      type: 'success',
      text1: nextMuted ? 'Chat muted' : 'Chat unmuted',
      text2: nextMuted ? "You won't receive notifications" : 'You will receive notifications'
    });
    api.post(`/chat/mute/${partnerId}`, { muted: nextMuted }).catch(() => { });
  }, [isMuted, partnerId]);

  // ─── Typing Indicator ──────────────────────────────────────────────────────
  const handleTyping = useCallback(
    (isTypingNow: boolean) => {
      if (partnerId) socketService.emitTyping(partnerId, isTypingNow);
    },
    [partnerId]
  );

  // ─── Search Messages ───────────────────────────────────────────────────────
  const handleSearchMessages = useCallback(async () => {
    if (!searchQuery.trim() || !partnerId) return;
    try {
      const results = await messageService.searchMessages(partnerId, searchQuery.trim());
      setSearchResults(results);
    } catch {
      Toast.show({ type: 'error', text1: 'Search failed' });
    }
  }, [partnerId, searchQuery]);

  // ─── Jump to Message ──────────────────────────────────────────────────────
  const jumpToMessage = useCallback((messageId: string) => {
    const index = messages.findIndex(msg => msg.id === messageId);
    if (index !== -1 && flatListRef.current) {
      flatListRef.current.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
      setSearchModalVisible(false);
      setIsPinModalVisible(false);
      setIsSavedMessagesVisible(false);
    } else {
      Toast.show({ type: 'info', text1: 'Message not in loaded list' });
    }
  }, [messages]);

  // ─── Render ────────────────────────────────────────────────────────────────
  const renderItem = useCallback(
    ({ item, index }: { item: ChatMessage; index: number }) => {
      const showDateHeader =
        index === 0 ||
        new Date(messages[index - 1].created_at).toDateString() !==
        new Date(item.created_at).toDateString();

      const itemDateObj = new Date(item.created_at);
      const isInvalidDate = isNaN(itemDateObj.getTime());

      const dateStr = isInvalidDate
        ? 'Unknown Date'
        : itemDateObj.toLocaleDateString(undefined, {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        });

      const today = new Date().toDateString();
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      const itemDateString = isInvalidDate ? '' : itemDateObj.toDateString();

      const displayDate =
        itemDateString === today
          ? 'Today'
          : itemDateString === yesterday
            ? 'Yesterday'
            : dateStr;

      const isSelected = selectedMessages.includes(item.id);
      const isPinned = pinnedMessages.some(msg => msg.id === item.id);
      const isSaved = savedMessages.some(msg => msg.id === item.id);

      return (
        <View key={item.id}>
          {showDateHeader && (
            <View style={styles.dateHeader}>
              <View style={styles.dateLine} />
              <Text style={styles.dateText}>{displayDate}</Text>
              <View style={styles.dateLine} />
            </View>
          )}
          <MessageBubble
            id={item.id}
            text={item.message}
            isMe={item.sender_id === (user?.id || user?._id)}
            timestamp={item.created_at}
            seen={item.read}
            status={item.status}
            mediaUrl={item.media_url}
            mediaType={item.media_type}
            reaction={item.reaction}
            replyTo={item.reply_to}
            isVoice={item.is_voice}
            voiceDuration={item.voice_duration}
            isPlaying={isPlayingVoice === item.id}
            onPlayVoice={() => {
              if (item.media_url) {
                playVoiceMessage(item.id, item.media_url);
              }
            }}
            onDelete={() => handleDeleteMessage(item.id)}
            onReact={(reaction) => handleReactToMessage(item.id, reaction)}
            onReply={() => setReplyToMessage(item)}
            onPin={() => handlePinMessage(item)}
            onUnpin={() => handleUnpinMessage(item.id)}
            onSave={() => handleSaveMessage(item)}
            onUnsave={() => handleUnsaveMessage(item.id)}
            onShare={() => handleShareMessage(item)}
            onCopy={() => handleCopyMessage(item)}
            onForward={() => handleForwardMessage(item)}
            onEdit={() => handleEditMessage(item)}
            isNew={item.isTemp || (index === messages.length - 1 && Date.now() - new Date(item.created_at).getTime() < 10000)}
            isSelected={isSelected}
            onSelect={() => toggleMessageSelection(item.id)}
            isSelectionMode={isSelectionMode}
            isEdited={item.is_edited}
            isPinned={isPinned}
            isSaved={isSaved}
          />
        </View>
      );
    },
    [user?.id, user?._id, messages, handleDeleteMessage, handleReactToMessage,
      pinnedMessages, savedMessages, isPlayingVoice, playVoiceMessage,
      handlePinMessage, handleUnpinMessage, handleSaveMessage, handleUnsaveMessage,
      handleShareMessage, handleCopyMessage, handleForwardMessage, handleEditMessage,
      selectedMessages, toggleMessageSelection, isSelectionMode]
  );

  if (!partnerId) {
    return (
      <View style={[styles.container, styles.centered]}>
        <FontAwesome name="heart-o" size={48} color={COLORS.primary} />
        <Text style={styles.emptyTitle}>No Connection Yet 💔</Text>
        <Text style={styles.emptyText}>Connect with a partner to start chatting</Text>
        <TouchableOpacity
          style={styles.connectButton}
          onPress={() => navigation?.navigate('SoloHome')}
        >
          <Text style={styles.connectButtonText}>Find Your Partner</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      <ChatHeader
        partnerName={partner?.name || 'My Partner'}
        isOnline={isPartnerOnline}
        lastSeen={partnerLastSeen || partner?.lastSeen}
        onSearch={() => setSearchModalVisible(true)}
        onCall={() => Alert.alert('Coming Soon', 'Video/Audio calls coming soon! 💕')}
        isTyping={isTyping}
        unreadCount={unreadCount}
        onMute={toggleMute}
        isMuted={isMuted}
        onPinMessages={() => setIsPinModalVisible(true)}
        onSavedMessages={() => setIsSavedMessagesVisible(true)}
        onSelectMessages={toggleSelectionMode}
        isSelectionMode={isSelectionMode}
        selectedCount={selectedMessages.length}
        onDeleteSelected={handleDeleteSelected}
      />

      {isSelectionMode && selectedMessages.length > 0 && (
        <Animated.View entering={SlideInDown} exiting={SlideOutDown} style={styles.selectionBar}>
          <TouchableOpacity onPress={handleDeleteSelected} style={styles.selectionAction}>
            <FontAwesome name="trash" size={18} color="#ff4444" />
            <Text style={styles.selectionActionText}>Delete</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setSelectedMessages([])} style={styles.selectionAction}>
            <FontAwesome name="times" size={18} color="#fff" />
            <Text style={styles.selectionActionText}>Clear</Text>
          </TouchableOpacity>
          <Text style={styles.selectionCount}>{selectedMessages.length} selected</Text>
        </Animated.View>
      )}

      {pinnedMessages.length > 0 && (
        <TouchableOpacity
          style={styles.pinnedBanner}
          onPress={() => setIsPinModalVisible(true)}
        >
          <FontAwesome name="thumb-tack" size={14} color={COLORS.primary} />
          <Text style={styles.pinnedBannerText}>
            {pinnedMessages.length} pinned message{pinnedMessages.length > 1 ? 's' : ''}
          </Text>
          <Feather name="chevron-right" size={16} color={COLORS.subtext} />
        </TouchableOpacity>
      )}

      {replyToMessage && (
        <View style={styles.replyBar}>
          <View style={styles.replyBarContent}>
            <FontAwesome name="reply" size={12} color={COLORS.primary} style={{ marginRight: 8 }} />
            <Text style={styles.replyBarText} numberOfLines={1}>
              Replying to: {replyToMessage.message}
            </Text>
          </View>
          <TouchableOpacity onPress={() => setReplyToMessage(null)}>
            <FontAwesome name="times" size={14} color={COLORS.subtext} />
          </TouchableOpacity>
        </View>
      )}

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id || `msg_${Date.now()}_${Math.random()}`}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          onScrollBeginDrag={() => { shouldScrollToEnd.current = false; }}
          onContentSizeChange={() => {
            if (shouldScrollToEnd.current && flatListRef.current) {
              flatListRef.current.scrollToEnd({ animated: true });
            }
          }}
          onScrollToIndexFailed={(info) => {
            flatListRef.current?.scrollToOffset({ offset: info.averageItemLength * info.index, animated: true });
          }}
          maintainVisibleContentPosition={{
            minIndexForVisible: 0,
          }}
          removeClippedSubviews={false}
          initialNumToRender={15}
          maxToRenderPerBatch={10}
          windowSize={5}
          extraData={[selectedMessages, isSelectionMode, isPlayingVoice, pinnedMessages, savedMessages]}
          ListHeaderComponent={
            isLoadingMore ? (
              <View style={styles.loadingMore}>
                <ActivityIndicator size="small" color={COLORS.subtext} />
              </View>
            ) : null
          }
          ListEmptyComponent={
            hasError ? (
              <View style={styles.centered}>
                <Feather name="alert-triangle" size={48} color="#ff4444" />
                <Text style={[styles.emptyTitle, { color: '#ff4444' }]}>Failed to load messages</Text>
                <Text style={styles.emptyText}>Please check your connection and try again.</Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={() => loadHistory(false)}
                >
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.centered}>
                <FontAwesome name="comments-o" size={48} color={COLORS.border} />
                <Text style={styles.emptyTitle}>No messages yet</Text>
                <Text style={styles.emptyText}>Send a message to start the conversation 👋</Text>
              </View>
            )
          }
        />
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {(isTyping || isTypingIndicatorVisible) && (
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(200)}
            style={styles.typingBubbleContainer}
          >
            <View style={styles.typingBubble}>
              <TypingDots />
            </View>
            <Text style={styles.typingBubbleText}>
              {partner?.name || 'Partner'} is typing
            </Text>
          </Animated.View>
        )}
        <ChatInput
          onSendMessage={handleSend}
          onSendMedia={handleSendMedia}
          onTyping={handleTyping}
          partnerId={partnerId}
          isSendingMedia={isSendingMedia}
          isSending={isSending}
          voiceRecorder={<VoiceRecorder onSendVoice={handleSendVoice} />}
        />
      </KeyboardAvoidingView>

      {/* ─── Search Modal ─────────────────────────────────────── */}
      <Modal
        visible={searchModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSearchModalVisible(false)}
      >
        <View style={styles.searchOverlay}>
          <View style={styles.searchHeaderRow}>
            <TouchableOpacity onPress={() => setSearchModalVisible(false)} style={styles.searchCloseBtn}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <TextInput
              style={styles.searchInputField}
              placeholder="Search messages..."
              placeholderTextColor={COLORS.subtext}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearchMessages}
              autoFocus
            />
            <TouchableOpacity onPress={handleSearchMessages} style={styles.searchGoBtn}>
              <FontAwesome name="search" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 20 }}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.searchResultItem} onPress={() => jumpToMessage(item.id)}>
                <Text style={styles.searchResultSender}>{item.sender_id === (user?.id || user?._id) ? 'Me' : (partner?.name || 'Partner')}</Text>
                <Text style={styles.searchResultText}>{item.message}</Text>
                <Text style={styles.searchResultDate}>{new Date(item.created_at).toLocaleString()}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              searchQuery.trim() !== '' ? (
                <Text style={styles.searchNoResults}>No messages matched your query</Text>
              ) : null
            }
          />
        </View>
      </Modal>

      {/* ─── Pinned Messages Modal ───────────────────────────────── */}
      <Modal
        visible={isPinModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsPinModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pinned Messages 📌</Text>
              <TouchableOpacity onPress={() => setIsPinModalVisible(false)}>
                <FontAwesome name="close" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
            {pinnedMessages.length === 0 ? (
              <View style={styles.modalEmpty}>
                <FontAwesome name="thumb-tack" size={40} color="#555" />
                <Text style={styles.modalEmptyText}>No pinned messages yet</Text>
              </View>
            ) : (
              <FlatList
                data={pinnedMessages}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View style={styles.modalItem}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.modalItemSender}>{item.sender_id === (user?.id || user?._id) ? 'Me' : (partner?.name || 'Partner')}</Text>
                      <Text style={styles.modalItemText} numberOfLines={2}>{item.message}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <TouchableOpacity style={styles.modalActionBtn} onPress={() => jumpToMessage(item.id)}>
                        <Text style={styles.modalActionBtnText}>Go</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.modalActionBtn} onPress={() => handleUnpinMessage(item.id)}>
                        <Text style={[styles.modalActionBtnText, { color: '#ff4444' }]}>Unpin</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* ─── Saved Messages Modal ────────────────────────────────── */}
      <Modal
        visible={isSavedMessagesVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsSavedMessagesVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Saved Messages 💾</Text>
              <TouchableOpacity onPress={() => setIsSavedMessagesVisible(false)}>
                <FontAwesome name="close" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
            {savedMessages.length === 0 ? (
              <View style={styles.modalEmpty}>
                <FontAwesome name="bookmark" size={40} color="#555" />
                <Text style={styles.modalEmptyText}>No saved messages yet</Text>
              </View>
            ) : (
              <FlatList
                data={savedMessages}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View style={styles.modalItem}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.modalItemSender}>{item.sender_id === (user?.id || user?._id) ? 'Me' : (partner?.name || 'Partner')}</Text>
                      <Text style={styles.modalItemText} numberOfLines={2}>{item.message}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <TouchableOpacity style={styles.modalActionBtn} onPress={() => jumpToMessage(item.id)}>
                        <Text style={styles.modalActionBtnText}>Go</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.modalActionBtn} onPress={() => handleUnsaveMessage(item.id)}>
                        <Text style={[styles.modalActionBtnText, { color: '#ff4444' }]}>Unsave</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* ─── Edit Message Modal ──────────────────────────────────── */}
      <Modal
        visible={editModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => { setEditModalVisible(false); setMessageToEdit(null); }}
      >
        <View style={styles.editOverlay}>
          <View style={styles.editContainer}>
            <Text style={styles.editTitle}>Edit Message</Text>
            <TextInput
              style={styles.editInput}
              value={editText}
              onChangeText={setEditText}
              multiline
              placeholder="Edit your message..."
              placeholderTextColor={COLORS.subtext}
            />
            <View style={styles.editActions}>
              <TouchableOpacity
                style={[styles.editBtn, styles.editCancelBtn]}
                onPress={() => { setEditModalVisible(false); setMessageToEdit(null); }}
              >
                <Text style={styles.editBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.editBtn, styles.editSaveBtn]}
                onPress={handleSaveEdit}
              >
                <Text style={styles.editBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Love Blast Animation */}
      {showLoveBlast && (
        <View style={styles.blastOverlay} pointerEvents="none">
          <Animated.View entering={ZoomIn.duration(500)} exiting={FadeOut}>
            <FontAwesome name="heart" size={100} color={COLORS.primary} opacity={0.6} />
          </Animated.View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginTop: 16 },
  emptyText: { color: COLORS.subtext, fontSize: 14, textAlign: 'center', marginTop: 8 },
  connectButton: { backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24, marginTop: 16 },
  connectButtonText: { color: '#fff', fontWeight: 'bold' },
  retryButton: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 16,
  },
  retryButtonText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  listContent: { padding: 20, paddingBottom: 20, flexGrow: 1 },
  // Typing Indicator Styles
  typingBubbleContainer: {
    paddingHorizontal: 20,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typingBubble: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomLeftRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typingDotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  typingBubbleText: {
    color: COLORS.subtext,
    fontSize: 12,
    fontStyle: 'italic',
  },
  replyBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#1a1a1a', borderBottomWidth: 1, borderBottomColor: COLORS.border },
  replyBarContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  replyBarText: { color: COLORS.subtext, fontSize: 12, flex: 1 },
  loadingMore: { padding: 16, alignItems: 'center' },
  // Date Header
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    opacity: 0.5,
  },
  dateLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dateText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginHorizontal: 15,
  },
  // Selection mode bar
  selectionBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    padding: 15,
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  selectionAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  selectionActionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  selectionCount: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  // Pinned message banner
  pinnedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1b1319',
    padding: 10,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#3a2034',
  },
  pinnedBannerText: {
    flex: 1,
    color: '#fff',
    fontSize: 13,
    marginLeft: 10,
  },
  // Voice recording layout
  recordingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: COLORS.card,
    borderRadius: 24,
    marginHorizontal: 15,
    marginBottom: 5,
    borderWidth: 1,
    borderColor: '#333',
  },
  recordingCancel: {
    padding: 8,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordingPulse: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ff4444',
    marginRight: 8,
  },
  recordingTime: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  recordingStop: {
    padding: 4,
  },
  voiceButton: {
    padding: 8,
    marginRight: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Search Overlay
  searchOverlay: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  searchHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  searchCloseBtn: {
    padding: 5,
  },
  searchInputField: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    color: '#fff',
    marginHorizontal: 12,
    fontSize: 15,
  },
  searchGoBtn: {
    backgroundColor: COLORS.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchResultItem: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#222',
  },
  searchResultSender: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  searchResultText: {
    color: '#fff',
    fontSize: 15,
    marginBottom: 6,
  },
  searchResultDate: {
    color: COLORS.subtext,
    fontSize: 10,
  },
  searchNoResults: {
    color: COLORS.subtext,
    textAlign: 'center',
    marginTop: 40,
    fontSize: 15,
  },
  // Generic Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    padding: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalEmpty: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 15,
  },
  modalEmptyText: {
    color: COLORS.subtext,
    fontSize: 14,
  },
  modalItem: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  modalItemSender: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  modalItemText: {
    color: '#fff',
    fontSize: 14,
  },
  modalActionBtn: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  modalActionBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  // Edit overlay styles
  editOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    width: '85%',
    padding: 20,
    borderWidth: 1,
    borderColor: '#444',
  },
  editTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  editInput: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    color: '#fff',
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  editBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  editCancelBtn: {
    backgroundColor: '#333',
  },
  editSaveBtn: {
    backgroundColor: COLORS.primary,
  },
  editBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  blastOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
});
