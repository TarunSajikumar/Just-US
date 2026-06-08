import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  RefreshControl,
  Dimensions,
  Animated as RNAnimated,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import { COLORS } from '../../theme/colors';
import { SPACING } from '../../theme/spacing';
import { FontAwesome, MaterialIcons, Ionicons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/authService';
import { notificationService } from '../../services/notificationService';
import Toast from 'react-native-toast-message';
import FloatingActionMenu from '../../components/FloatingActionMenu';
import { socketService } from '../../services/socket';
import { api } from '../../services/api';
import { moodService } from '../../services/moodService';
import { noteService } from '../../services/noteService';
import { achievementService } from '../../services/achievementService';
import { goalService, Goal } from '../../services/goalService';
import { pollService, Poll } from '../../services/pollService';
import { activityService, Activity } from '../../services/activityService';
import { eventService, CoupleEvent } from '../../services/eventService';
import GoalsCard from '../../components/home/GoalsCard';
import PollsCard from '../../components/home/PollsCard';
import ActivityFeedCard from '../../components/home/ActivityFeedCard';
import UpcomingEventsCard from '../../components/home/UpcomingEventsCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// =============== TYPE DEFINITIONS ===============

interface PartnerStatus {
  isOnline: boolean;
  lastSeen: string | null;
}

interface QuickLoveMessage {
  id: string;
  text: string;
  emoji: string;
}

interface CustomQuickMessage {
  id: string;
  text: string;
  emoji: string;
}

// =============== DEFAULT QUICK LOVE MESSAGES ===============

const DEFAULT_QUICK_LOVE_MESSAGES: QuickLoveMessage[] = [
  { id: 'love', text: 'Love You ❤️', emoji: '❤️' },
  { id: 'miss', text: 'Miss You 💕', emoji: '💕' },
  { id: 'thinking', text: 'Thinking About You 💭', emoji: '💭' },
  { id: 'where', text: 'Where Are You? 👀', emoji: '👀' },
  { id: 'doing', text: 'What Are You Doing? 😊', emoji: '😊' },
  { id: 'proud', text: "I'm Proud of You 🌟", emoji: '🌟' },
  { id: 'grateful', text: "I'm Grateful for You 🙏", emoji: '🙏' },
  { id: 'cuddle', text: 'Need a Cuddle 🤗', emoji: '🤗' },
];

// =============== HELPER FUNCTIONS ===============

function getDaysOfLove(startDate?: string | null): number {
  if (!startDate) return 0;
  try {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const diffMs = now.getTime() - start.getTime();
    return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  } catch {
    return 0;
  }
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning ☀️';
  if (hour < 17) return 'Good Afternoon 🌤️';
  return 'Good Evening 🌙';
}

function formatLastSeen(lastSeenDateStr?: string | Date | null): string {
  if (!lastSeenDateStr) return 'Offline';
  try {
    const lastSeen = new Date(lastSeenDateStr);
    const now = new Date();
    const diffMs = now.getTime() - lastSeen.getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Active just now';
    if (mins < 60) return `Last seen ${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `Last seen ${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `Last seen ${days}d ago`;
  } catch {
    return 'Offline';
  }
}

// =============== ENHANCED QUICK LOVE BUTTON ===============

const EnhancedQuickLoveButton = React.memo(({
  onSendMessage,
  isSending,
  quickLoveEnabled,
  defaultMessage,
}: {
  onSendMessage: (message: string, emoji?: string) => void;
  isSending: boolean;
  quickLoveEnabled: boolean;
  defaultMessage: string;
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [customMessage, setCustomMessage] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  if (!quickLoveEnabled) return null;

  const quickMessages = [
    { emoji: '❤️', text: 'I Love You' },
    { emoji: '💕', text: 'Miss You' },
    { emoji: '💭', text: 'Thinking of You' },
    { emoji: '🌟', text: 'Proud of You' },
    { emoji: '🙏', text: 'Grateful for You' },
    { emoji: '🤗', text: 'Need a Hug' },
  ];

  const handleSingleClick = () => {
    onSendMessage(defaultMessage, '❤️');
  };

  const handleLongPress = () => {
    setShowMenu(true);
  };

  const handleSelectMessage = (text: string, emoji: string) => {
    onSendMessage(text, emoji);
    setShowMenu(false);
    setShowCustomInput(false);
  };

  const handleSendCustom = () => {
    if (customMessage.trim()) {
      onSendMessage(customMessage.trim(), '💌');
      setCustomMessage('');
      setShowCustomInput(false);
      setShowMenu(false);
    }
  };

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handleSingleClick}
        onLongPress={handleLongPress}
        delayLongPress={500}
        disabled={isSending}
      >
        <LinearGradient
          colors={[COLORS.primary, '#C23576']}
          style={styles.quickLoveButtonEnhanced}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {isSending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <FontAwesome name="heart" size={20} color="#fff" />
              <Text style={styles.quickLoveButtonTextEnhanced}>Quick Love</Text>
              <MaterialIcons name="touch-app" size={16} color="#fff" style={{ opacity: 0.7 }} />
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>

      {/* Quick Love Menu Modal */}
      <Modal
        visible={showMenu}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowMenu(false);
          setShowCustomInput(false);
        }}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => {
            setShowMenu(false);
            setShowCustomInput(false);
          }}
        >
          <View style={styles.quickLoveModal}>
            <View style={styles.quickLoveModalHeader}>
              <Text style={styles.quickLoveModalTitle}>💕 Send a message</Text>
              <TouchableOpacity onPress={() => setShowMenu(false)}>
                <MaterialIcons name="close" size={22} color={COLORS.subtext} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 400 }}>
              <View style={styles.quickMessagesGrid}>
                {quickMessages.map((msg, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.quickMessageCard}
                    onPress={() => handleSelectMessage(msg.text, msg.emoji)}
                  >
                    <Text style={styles.quickMessageEmoji}>{msg.emoji}</Text>
                    <Text style={styles.quickMessageText}>{msg.text}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.divider} />

              {!showCustomInput ? (
                <TouchableOpacity
                  style={styles.customMessageBtn}
                  onPress={() => setShowCustomInput(true)}
                >
                  <MaterialIcons name="edit" size={20} color={COLORS.primary} />
                  <Text style={styles.customMessageBtnText}>Write Custom Message</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.customInputContainer}>
                  <TextInput
                    style={styles.customMessageInput}
                    value={customMessage}
                    onChangeText={setCustomMessage}
                    placeholder="Type your message..."
                    placeholderTextColor="#666"
                    autoFocus
                    maxLength={100}
                  />
                  <View style={styles.customInputActions}>
                    <TouchableOpacity
                      style={styles.cancelCustomBtn}
                      onPress={() => {
                        setShowCustomInput(false);
                        setCustomMessage('');
                      }}
                    >
                      <Text style={styles.cancelCustomText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.sendCustomBtn}
                      onPress={handleSendCustom}
                    >
                      <Text style={styles.sendCustomText}>Send 💕</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
});

// Add this component for floating hearts animation
const FloatingHeart = ({ style, children }: { style?: any; children: React.ReactNode }) => {
  const translateY = useRef(new RNAnimated.Value(0)).current;
  const opacity = useRef(new RNAnimated.Value(0.4)).current;

  useEffect(() => {
    RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(translateY, {
          toValue: -10,
          duration: 2000,
          useNativeDriver: true,
        }),
        RNAnimated.timing(translateY, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(opacity, {
          toValue: 0.8,
          duration: 2000,
          useNativeDriver: true,
        }),
        RNAnimated.timing(opacity, {
          toValue: 0.2,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <RNAnimated.Text
      style={[
        style,
        {
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      {children}
    </RNAnimated.Text>
  );
};

// =============== MAIN COMPONENT ===============

export default function CoupleHomeScreen({ navigation }: any) {
  const {
    user,
    partner,
    relationshipStartDate,
    anniversaryDate,
    nextMeetDate,
    partnerNickname,
    refreshUser,
  } = useAuthStore();

  const quickLoveEnabled = user?.preferences?.quickLoveNotifications !== false;

  // ===== REANIMATED MOTION STATE =====
  const heartScale = useSharedValue(1);
  const ring1Scale = useSharedValue(1);
  const ring1Opacity = useSharedValue(0.4);
  const ring2Scale = useSharedValue(1);
  const ring2Opacity = useSharedValue(0.2);

  useEffect(() => {
    heartScale.value = withRepeat(
      withSequence(
        withSpring(1.2, { damping: 4, stiffness: 80 }),
        withSpring(1, { damping: 4, stiffness: 80 })
      ),
      -1,
      true
    );

    ring1Scale.value = withRepeat(
      withTiming(1.6, { duration: 2000 }),
      -1,
      false
    );
    ring1Opacity.value = withRepeat(
      withTiming(0, { duration: 2000 }),
      -1,
      false
    );

    const timer = setTimeout(() => {
      ring2Scale.value = withRepeat(
        withTiming(1.6, { duration: 2000 }),
        -1,
        false
      );
      ring2Opacity.value = withRepeat(
        withTiming(0, { duration: 2000 }),
        -1,
        false
      );
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  const heartAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  const ring1Style = useAnimatedStyle(() => ({
    transform: [{ scale: ring1Scale.value }],
    opacity: ring1Opacity.value,
  }));

  const ring2Style = useAnimatedStyle(() => ({
    transform: [{ scale: ring2Scale.value }],
    opacity: ring2Opacity.value,
  }));

  // ===== STATE =====
  const [isSendingPing, setIsSendingPing] = useState(false);
  const [partnerStatus, setPartnerStatus] = useState<PartnerStatus | null>(null);
  const [partnerMood, setPartnerMood] = useState<{ mood: string; emoji?: string; updatedAt?: string } | null>(null);
  const [myMood, setMyMood] = useState<{ mood: string; emoji?: string } | null>(null);
  const [partnerNote, setPartnerNote] = useState<{ content: string; createdAt: string } | null>(null);
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [events, setEvents] = useState<CoupleEvent[]>([]);
  const [customQuickMessages, setCustomQuickMessages] = useState<CustomQuickMessage[]>([]);
  const [defaultQuickMessage, setDefaultQuickMessage] = useState('I Love You ❤️');

  const loadDefaultQuickMessage = useCallback(async () => {
    try {
      const response = await api.get('/users/settings/quick-love-default');
      if (response?.data?.defaultMessage) {
        setDefaultQuickMessage(response.data.defaultMessage);
      }
    } catch (error) {
      setDefaultQuickMessage('I Love You ❤️');
    }
  }, []);

  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');
  const [isSendingQuickLove, setIsSendingQuickLove] = useState(false);

  // Modals
  const [isNoteModalVisible, setNoteModalVisible] = useState(false);
  const [isGoalModalVisible, setGoalModalVisible] = useState(false);
  const [isPollModalVisible, setPollModalVisible] = useState(false);
  const [isEventModalVisible, setEventModalVisible] = useState(false);
  const [isMoodModalVisible, setMoodModalVisible] = useState(false);
  const [isQuickLoveCustomizeVisible, setQuickLoveCustomizeVisible] = useState(false);

  // Inputs
  const [noteInput, setNoteInput] = useState('');
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalEmoji, setGoalEmoji] = useState('🎯');
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventEmoji, setEventEmoji] = useState('📅');
  const [eventType, setEventType] = useState<CoupleEvent['eventType']>('custom');
  const [moodInput, setMoodInput] = useState('');
  const [selectedMoodEmoji, setSelectedMoodEmoji] = useState('😊');
  const [customMessageInput, setCustomMessageInput] = useState('');
  const [customMessageEmoji, setCustomMessageEmoji] = useState('❤️');

  // Loading States
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [isSavingGoal, setIsSavingGoal] = useState(false);
  const [isSavingPoll, setIsSavingPoll] = useState(false);
  const [isSavingEvent, setIsSavingEvent] = useState(false);
  const [isSavingMood, setIsSavingMood] = useState(false);
  const [isAddingCustomMessage, setIsAddingCustomMessage] = useState(false);

  // Animation
  const daysAnimated = useRef(new RNAnimated.Value(0)).current;
  const [displayDays, setDisplayDays] = useState(0);

  // Computed Values
  const displayName = partnerNickname || partner?.name || 'Partner';
  const coupleName = user?.name ? `${user.name} & ${displayName}` : 'You & Partner';
  const daysOfLove = getDaysOfLove(relationshipStartDate);
  const greeting = getGreeting();

  const userInitials = useMemo(() => {
    if (!user?.name) return '?';
    return user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  }, [user?.name]);

  const partnerInitials = useMemo(() => {
    const name = partnerNickname || partner?.name;
    if (!name) return '?';
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  }, [partnerNickname, partner?.name]);

  // Animate days count-up
  useEffect(() => {
    if (!loadingDashboard && daysOfLove > 0) {
      RNAnimated.timing(daysAnimated, {
        toValue: daysOfLove,
        duration: 1200,
        useNativeDriver: false,
      }).start();
      const listener = daysAnimated.addListener(({ value }) => {
        setDisplayDays(Math.floor(value));
      });
      return () => daysAnimated.removeListener(listener);
    }
  }, [loadingDashboard, daysOfLove]);

  // ===== API CALLS =====

  const sendMissYouNotification = useCallback(async (customMessage?: string) => {
    if (isSendingPing) return;
    setIsSendingPing(true);
    try {
      await notificationService.sendMissYouPing(customMessage);
      Toast.show({
        type: 'success',
        text1: '❤️ Ping Sent',
        text2: customMessage ? `"${customMessage.substring(0, 50)}"` : 'Your partner will know you miss them!',
        visibilityTime: 2000,
      });
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Failed to send',
        text2: err?.response?.data?.message || 'Could not send notification',
      });
    } finally {
      setIsSendingPing(false);
    }
  }, [isSendingPing]);

  const handleQuickPing = useCallback((message: string) => {
    sendMissYouNotification(message);
  }, [sendMissYouNotification]);

  const handleSendQuickLove = useCallback(async (message: string, emoji: string = '❤️') => {
    if (isSendingQuickLove) return;
    setIsSendingQuickLove(true);
    try {
      await notificationService.sendQuickMessage(`${emoji} ${message}`);
      Toast.show({
        type: 'success',
        text1: '💕 Love Sent!',
        text2: message,
        visibilityTime: 1500,
      });
      
      const socket = socketService.getSocket();
      if (socket) {
        socket.emit('quick_love_sent', { message, userId: user?._id });
      }
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Failed to send message' });
    } finally {
      setIsSendingQuickLove(false);
    }
  }, [isSendingQuickLove, user?._id]);

  const handleAddCustomMessage = useCallback(async () => {
    if (!customMessageInput.trim()) return;
    setIsAddingCustomMessage(true);
    try {
      const newMessage = {
        id: Date.now().toString(),
        text: customMessageInput.trim(),
        emoji: customMessageEmoji,
      };
      await api.post('/couple/quick-love-messages', newMessage);
      setCustomQuickMessages(prev => [...prev, newMessage]);
      setCustomMessageInput('');
      Toast.show({ type: 'success', text1: 'Message Added! 💕' });
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Failed to add message' });
    } finally {
      setIsAddingCustomMessage(false);
    }
  }, [customMessageInput, customMessageEmoji]);

  const fetchDashboardData = useCallback(async () => {
    if (!partner) return;

    try {
      const [statusRes, myMoodRes, partnerMoodRes, noteRes, achRes, goalRes, pollRes, activityRes, eventRes, quickMessagesRes] =
        await Promise.allSettled([
          api.get('/users/partner-status'),
          moodService.getMyMood(),
          moodService.getPartnerMood(),
          noteService.getPartnerNote(),
          achievementService.getAchievements(),
          goalService.getGoals(),
          pollService.getPolls(),
          activityService.getActivities(),
          eventService.getEvents(),
          api.get('/couple/quick-love-messages'),
        ]);

      if (statusRes.status === 'fulfilled') setPartnerStatus(statusRes.value?.data || null);
      if (myMoodRes.status === 'fulfilled') setMyMood(myMoodRes.value);
      if (partnerMoodRes.status === 'fulfilled') setPartnerMood(partnerMoodRes.value);
      if (noteRes.status === 'fulfilled') setPartnerNote(noteRes.value);
      if (achRes.status === 'fulfilled' && achRes.value?.success) {
        setUnlockedAchievements(achRes.value.achievements.map((a: any) => a.code));
      }
      if (goalRes.status === 'fulfilled') setGoals(goalRes.value || []);
      if (pollRes.status === 'fulfilled') setPolls(pollRes.value || []);
      if (activityRes.status === 'fulfilled') setActivities(activityRes.value || []);
      if (eventRes.status === 'fulfilled') setEvents(eventRes.value || []);
      if (quickMessagesRes.status === 'fulfilled' && quickMessagesRes.value?.data) {
        setCustomQuickMessages(quickMessagesRes.value.data);
      }
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoadingDashboard(false);
    }
  }, [partner]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await authService.me();
      await fetchDashboardData();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Refresh failed',
        text2: error?.response?.data?.message || error?.message || 'Could not load latest data',
      });
    } finally {
      setRefreshing(false);
    }
  }, [fetchDashboardData]);

  const handleSaveNote = useCallback(async () => {
    const trimmedNote = noteInput.trim();
    if (!trimmedNote) {
      Toast.show({ type: 'info', text1: 'Empty note', text2: 'Please write something before sending' });
      return;
    }
    if (trimmedNote.length > 500) {
      Toast.show({ type: 'error', text1: 'Note too long', text2: 'Maximum 500 characters' });
      return;
    }
    setIsSavingNote(true);
    try {
      await noteService.saveNote(trimmedNote);
      setNoteModalVisible(false);
      setNoteInput('');
      Toast.show({ type: 'success', text1: 'Note Sent ❤️', text2: 'Your partner will see this' });
      fetchDashboardData();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Failed to save note',
        text2: error?.response?.data?.message || 'Please try again',
      });
    } finally {
      setIsSavingNote(false);
    }
  }, [noteInput, fetchDashboardData]);

  const handleSaveMood = useCallback(async () => {
    // If no custom text but an emoji is selected, use the label from quick selection
    let moodText = moodInput.trim();
    if (!moodText && selectedMoodEmoji) {
      // Find the label for the selected emoji
      const moodMap: { [key: string]: string } = {
        '😊': 'Happy', '😍': 'Loved', '😔': 'Sad', '😤': 'Angry', '😴': 'Tired',
        '🥰': 'Romantic', '🤗': 'Grateful', '🎉': 'Excited', '😎': 'Confident', '🥺': 'Missing You'
      };
      moodText = moodMap[selectedMoodEmoji] || 'Feeling good';
    }
    
    if (!moodText) {
      Toast.show({ type: 'info', text1: 'Empty mood', text2: 'Please select or describe how you feel' });
      return;
    }
    
    setIsSavingMood(true);
    try {
      await moodService.setMood(moodText, selectedMoodEmoji);
      setMoodModalVisible(false);
      setMoodInput('');
      Toast.show({ type: 'success', text1: 'Mood Updated 😊', text2: 'Your partner can see how you feel' });
      fetchDashboardData();
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Failed to save mood' });
    } finally {
      setIsSavingMood(false);
    }
  }, [moodInput, selectedMoodEmoji, fetchDashboardData]);

  const handleQuickMoodSelect = useCallback(async (mood: string, emoji: string) => {
    try {
      await moodService.setMood(mood, emoji);
      Toast.show({ 
        type: 'success', 
        text1: `Mood Updated: ${emoji} ${mood}`, 
        visibilityTime: 1500 
      });
      fetchDashboardData();
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Failed to update mood' });
    }
  }, [fetchDashboardData]);

  const handleSaveGoal = useCallback(async () => {
    if (!goalTitle.trim()) {
      Toast.show({ type: 'error', text1: 'Missing fields', text2: 'Please enter a goal title' });
      return;
    }

    // Default target to 1 if not provided, for one-off bucket list items
    const targetNum = goalTarget.trim() ? parseInt(goalTarget) : 1;
    if (isNaN(targetNum) || targetNum <= 0) {
      Toast.show({ type: 'error', text1: 'Invalid target', text2: 'Please enter a valid number' });
      return;
    }

    setIsSavingGoal(true);
    try {
      const response = await goalService.createGoal(goalTitle.trim(), targetNum, goalEmoji);
      if (response && (response as any).success !== false) {
        setGoalModalVisible(false);
        setGoalTitle('');
        setGoalTarget('');
        setGoalEmoji('🎯');
        Toast.show({ type: 'success', text1: 'Goal Created! 🎯' });
        await fetchDashboardData();

        const socket = socketService.getSocket();
        if (socket) {
          socket.emit('goal_created', { goal: response, actorId: user?._id, actorName: user?.name });
        }
      }
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Failed to create goal', text2: error?.message });
    } finally {
      setIsSavingGoal(false);
    }
  }, [goalTitle, goalTarget, goalEmoji, fetchDashboardData, user]);

  const handleUpdateGoalProgress = useCallback(async (goalId: string, increment: number = 1) => {
    try {
      await goalService.updateProgress(goalId, increment);
      fetchDashboardData();
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Failed to update progress' });
    }
  }, [fetchDashboardData]);

  const handleSavePoll = useCallback(async () => {
    const filteredOptions = pollOptions.filter((o) => o.trim());
    if (!pollQuestion.trim() || filteredOptions.length < 2) {
      Toast.show({ type: 'error', text1: 'Invalid poll', text2: 'Question and at least 2 options required' });
      return;
    }

    setIsSavingPoll(true);
    try {
      const response = await pollService.createPoll(pollQuestion.trim(), filteredOptions);
      if (response && (response as any).success !== false) {
        setPollModalVisible(false);
        setPollQuestion('');
        setPollOptions(['', '']);
        Toast.show({ type: 'success', text1: 'Poll Started! 🗳️' });
        await fetchDashboardData();

        const socket = socketService.getSocket();
        if (socket) {
          socket.emit('poll_created', { poll: response, actorId: user?._id, actorName: user?.name });
        }
      }
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Failed to create poll', text2: error?.message });
    } finally {
      setIsSavingPoll(false);
    }
  }, [pollQuestion, pollOptions, fetchDashboardData, user]);

  const handleVote = useCallback(async (pollId: string, optionIndex: number) => {
    try {
      await pollService.vote(pollId, optionIndex);
      fetchDashboardData();
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Failed to vote' });
    }
  }, [fetchDashboardData]);

  const handleSaveEvent = useCallback(async () => {
    if (!eventTitle.trim() || !eventDate.trim()) {
      Toast.show({ type: 'error', text1: 'Missing fields', text2: 'Title and date required' });
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) {
      Toast.show({ type: 'error', text1: 'Invalid date', text2: 'Use format YYYY-MM-DD' });
      return;
    }

    setIsSavingEvent(true);
    try {
      const response = await eventService.createEvent(eventTitle.trim(), eventDate, eventType, eventEmoji);
      if (response && (response as any).success !== false) {
        setEventModalVisible(false);
        setEventTitle('');
        setEventDate('');
        setEventEmoji('📅');
        setEventType('custom');
        Toast.show({ type: 'success', text1: 'Event Added! 📅' });
        await fetchDashboardData();

        const socket = socketService.getSocket();
        if (socket) {
          socket.emit('event_created', { event: response, actorId: user?._id, actorName: user?.name });
        }
      }
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Failed to create event', text2: error?.message });
    } finally {
      setIsSavingEvent(false);
    }
  }, [eventTitle, eventDate, eventEmoji, eventType, fetchDashboardData, user]);

  const getPartnerStatusDisplay = useCallback(() => {
    if (!partnerStatus) return 'Offline';
    if (partnerStatus.isOnline) return '🟢 Online';
    return formatLastSeen(partnerStatus.lastSeen);
  }, [partnerStatus]);

  // Socket + Initial Fetch
  useEffect(() => {
    let isMounted = true;

    const setupDashboard = async () => {
      loadDefaultQuickMessage();
      await fetchDashboardData();

      let socket = socketService.getSocket();
      if (!socket) {
        socket = await socketService.connect();
      }

      if (socket) {
        setConnectionStatus(socket.connected ? 'connected' : 'connecting');
        socket.on('connect', () => setConnectionStatus('connected'));
        socket.on('disconnect', () => setConnectionStatus('disconnected'));
      }

      if (user?._id) {
        socketService.emitUserOnline(user._id);
        if (partner?._id) {
          socketService.joinRoom(partner._id);
        }
      }

      socket?.on('user_status_change', (data: { userId: string; status: string; lastSeen?: string }) => {
        if (isMounted && partner && data.userId === partner._id) {
          setPartnerStatus({ isOnline: data.status === 'online', lastSeen: data.lastSeen || null });
        }
      });

      socket?.on('partner_mood_updated', () => {
        if (isMounted) fetchDashboardData();
      });

      socket?.on('new_love_note', () => {
        if (isMounted) {
          Toast.show({ type: 'info', text1: 'New Love Note 💌', text2: 'Your partner left you a note!' });
          fetchDashboardData();
        }
      });

      socket?.on('goal_created', () => {
        if (isMounted) {
          Toast.show({ type: 'info', text1: 'New Goal! 🎯', text2: 'Your partner created a new goal' });
          fetchDashboardData();
        }
      });

      socket?.on('goal_updated', () => { if (isMounted) fetchDashboardData(); });

      socket?.on('goal_completed', (data: any) => {
        if (isMounted) {
          Toast.show({ type: 'success', text1: 'Goal Completed! 🏆', text2: data.goal?.title });
          fetchDashboardData();
        }
      });

      socket?.on('poll_created', () => {
        if (isMounted) {
          Toast.show({ type: 'info', text1: 'New Poll! 🗳️', text2: 'Your partner started a poll' });
          fetchDashboardData();
        }
      });

      socket?.on('poll_voted', () => { if (isMounted) fetchDashboardData(); });

      socket?.on('event_created', (data: any) => {
        if (isMounted) {
          Toast.show({ type: 'info', text1: 'New Event! 📅', text2: `${data.actorName} added an event` });
          fetchDashboardData();
        }
      });

      socket?.on('quick_love_received', (data: { message: string }) => {
        if (isMounted) {
          Toast.show({
            type: 'info',
            text1: '❤️ Message from ' + displayName,
            text2: data.message,
            visibilityTime: 3000,
          });
        }
      });
    };

    setupDashboard();

    const interval = setInterval(() => {
      if (isMounted) fetchDashboardData();
    }, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
      const socket = socketService.getSocket();
      socket?.off('user_status_change');
      socket?.off('new_love_note');
      socket?.off('goal_created');
      socket?.off('goal_updated');
      socket?.off('goal_completed');
      socket?.off('poll_created');
      socket?.off('poll_voted');
      socket?.off('event_created');
      socket?.off('quick_love_received');
    };
  }, [user?._id, partner?._id, fetchDashboardData, displayName]);

  // No partner state
  if (!partner) {
    return (
      <View style={styles.centeredContainer}>
        <FontAwesome name="heart-o" size={60} color={COLORS.primary} style={{ marginBottom: 20 }} />
        <Text style={styles.emptyTitle}>Connection Syncing...</Text>
        <Text style={styles.emptyText}>
          We're having trouble loading your partner's data. We'll keep trying to sync automatically.
        </Text>
        <TouchableOpacity style={styles.connectButton} onPress={handleRefresh} disabled={refreshing}>
          {refreshing ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.connectButtonText}>Sync Now 🔄</Text>}
        </TouchableOpacity>
      </View>
    );
  }

  // Main Render
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      {/* Connection Status Indicator */}
      {connectionStatus === 'disconnected' && (
        <View style={styles.connectionStatusBar}>
          <Text style={styles.connectionStatusText}>⚠️ Reconnecting...</Text>
        </View>
      )}

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} />}
      >
        {/* ===== ENHANCED HEADER SECTION ===== */}
        <Animated.View entering={FadeInDown.duration(400)}>
          <View style={styles.headerContainer}>
            <View style={styles.headerTop}>
              <View>
                <Text style={styles.greetingText}>{greeting}</Text>
                <Text style={styles.userNameText}>{user?.name?.split(' ')[0] || 'Love'}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                {/* Ping/Miss You Button */}
                <TouchableOpacity
                  style={styles.notificationBtnEnhanced}
                  onPress={() => sendMissYouNotification()}
                  onLongPress={() => {
                    Alert.alert(
                      'Quick Ping ❤️',
                      'Choose a message to send to your partner',
                      [
                        { text: '❤️ Miss You', onPress: () => handleQuickPing('I miss you ❤️') },
                        { text: '📞 Call Me', onPress: () => handleQuickPing('Call me when you are free 📞') },
                        { text: '🥺 Need You', onPress: () => handleQuickPing('I need you right now 🥺') },
                        { text: '😘 Thinking of You', onPress: () => handleQuickPing('Thinking of you 😘') },
                        { text: 'Cancel', style: 'cancel' },
                      ]
                    );
                  }}
                  disabled={isSendingPing}
                >
                  {isSendingPing ? (
                    <ActivityIndicator color={COLORS.primary} size="small" />
                  ) : (
                    <FontAwesome name="heart" size={18} color="#fff" />
                  )}
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.profileIcon}
                  onPress={() => navigation.navigate('Settings')}
                >
                  <LinearGradient
                    colors={[COLORS.primary, '#C23576']}
                    style={styles.profileGradient}
                  >
                    <Text style={styles.profileInitials}>{userInitials}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* ===== REDESIGNED DAYS TOGETHER CARD ===== */}
        <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.daysCardContainer}>
          <LinearGradient
            colors={['#FF4D8D', '#C23576', '#8B1A5C']}
            style={styles.daysCardGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Decorative elements */}
            <View style={styles.decorativeCircles}>
              <View style={[styles.decorCircle, styles.decorCircle1]} />
              <View style={[styles.decorCircle, styles.decorCircle2]} />
              <View style={[styles.decorCircle, styles.decorCircle3]} />
            </View>
            
            <View style={styles.sparkleContainer}>
              <Text style={styles.sparkleIcon}>✨</Text>
              <Text style={styles.sparkleIcon2}>💫</Text>
            </View>

            {/* Romantic Quote */}
            <Text style={styles.romanticQuote}>"Every day with you is my favorite day"</Text>

            {/* Avatars with floating animation */}
            <View style={styles.avatarSection}>
              <View style={styles.avatarWrapper}>
                <LinearGradient
                  colors={['#fff', '#FFE0E8']}
                  style={styles.avatarGlow}
                >
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarInitials}>{userInitials}</Text>
                  </View>
                </LinearGradient>
                <Text style={styles.avatarName}>{user?.name?.split(' ')[0] || 'You'}</Text>
              </View>

              <View style={styles.heartAnimation}>
                <Animated.View style={[styles.heartBeatRing, ring1Style]} />
                <Animated.View style={[styles.heartBeatRing2, ring2Style]} />
                <Animated.View style={heartAnimatedStyle}>
                  <FontAwesome name="heart" size={28} color="#fff" />
                </Animated.View>
              </View>

              <View style={styles.avatarWrapper}>
                <LinearGradient
                  colors={['#fff', '#FFE0E8']}
                  style={styles.avatarGlow}
                >
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarInitials}>{partnerInitials}</Text>
                  </View>
                </LinearGradient>
                <Text style={styles.avatarName}>{displayName.split(' ')[0]}</Text>
              </View>
            </View>

            {/* Days Counter with animation */}
            <View style={styles.daysCounterSection}>
              <Text style={styles.daysLabel}>Days of Love</Text>
              <Animated.Text entering={ZoomIn.delay(300).duration(600)} style={styles.daysNumber}>{displayDays}</Animated.Text>
              <View style={styles.daysBadgeContainer}>
                <LinearGradient
                  colors={['rgba(255, 255, 255, 0.25)', 'rgba(255, 255, 255, 0.1)']}
                  style={styles.daysBadgeGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.daysBadgeText}>❤️ Together</Text>
                </LinearGradient>
              </View>
              
              {/* Progress bar */}
              <View style={styles.milestoneProgress}>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { width: `${Math.min(100, (displayDays / 365) * 100)}%` }
                    ]} 
                  />
                </View>
                <View style={styles.milestoneLabels}>
                  <Text style={styles.milestoneLabel}>💑 Started</Text>
                  <Text style={styles.milestoneLabel}>🎉 1 Year</Text>
                  <Text style={styles.milestoneLabel}>💎 Forever</Text>
                </View>
              </View>
            </View>

            {/* Floating hearts animation */}
            <View style={styles.floatingHearts}>
              <FloatingHeart style={[styles.floatingHeart, { top: 10, left: 20 }]}>❤️</FloatingHeart>
              <FloatingHeart style={[styles.floatingHeart, { top: 60, right: 15 }]}>💕</FloatingHeart>
              <FloatingHeart style={[styles.floatingHeart, { bottom: 20, left: 30 }]}>💖</FloatingHeart>
              <FloatingHeart style={[styles.floatingHeart, { bottom: 50, right: 25 }]}>💗</FloatingHeart>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Partner Status Card */}
        <Animated.View entering={FadeInDown.delay(200).duration(600)}>
          <View style={styles.partnerCard}>
            <View style={styles.partnerCardLeft}>
              <View style={styles.heartCircle}>
                <FontAwesome name="heart" size={16} color={COLORS.primary} />
              </View>
              <View>
                <Text style={styles.partnerStatus}>Connected with {partner.name}</Text>
                <Text style={styles.partnerOnlineText}>{getPartnerStatusDisplay()}</Text>
              </View>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>💑 Couple</Text>
            </View>
          </View>
        </Animated.View>

        {/* Mood Section */}
        <Animated.View entering={FadeInDown.delay(300).duration(600)}>
          <View style={styles.moodCard}>
            <View style={styles.moodHeader}>
              <Text style={styles.moodLabel}>😊 Mood Check</Text>
              <TouchableOpacity onPress={() => setMoodModalVisible(true)}>
                <Text style={styles.moodUpdateText}>Update</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.moodRow}>
              <View style={styles.moodItem}>
                <Text style={styles.moodItemLabel}>Your Mood</Text>
                <Text style={styles.moodValue}>
                  {myMood?.emoji || '😊'} {myMood?.mood || 'Not set'}
                </Text>
              </View>
              <View style={styles.moodDivider} />
              <View style={styles.moodItem}>
                <Text style={styles.moodItemLabel}>Partner's Mood</Text>
                <Text style={styles.moodValue}>
                  {partnerMood?.emoji || '😊'} {partnerMood?.mood || 'Not shared'}
                </Text>
              </View>
            </View>

            {/* Quick Mood Selector directly on the card */}
            <View style={styles.cardQuickMoodContainer}>
              <Text style={styles.cardQuickMoodTitle}>How are you feeling today?</Text>
              <View style={styles.cardQuickMoodRow}>
                {[
                  { emoji: '😊', label: 'Happy', color: '#FFD93D' },
                  { emoji: '😍', label: 'Loved', color: '#FF6B6B' },
                  { emoji: '😔', label: 'Sad', color: '#6C9EBF' },
                  { emoji: '😤', label: 'Angry', color: '#E74C3C' },
                  { emoji: '😴', label: 'Tired', color: '#9B59B6' },
                ].map((mood) => (
                  <TouchableOpacity
                    key={mood.label}
                    style={[
                      styles.cardQuickMoodButton,
                      myMood?.emoji === mood.emoji && { borderColor: mood.color, backgroundColor: `${mood.color}15` }
                    ]}
                    onPress={() => handleQuickMoodSelect(mood.label, mood.emoji)}
                  >
                    <Text style={styles.cardQuickMoodEmoji}>{mood.emoji}</Text>
                    <Text style={[styles.cardQuickMoodLabel, myMood?.emoji === mood.emoji && { color: mood.color }]}>
                      {mood.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Daily Love Note */}
        <Animated.View entering={FadeInDown.delay(400).duration(600)}>
          <View style={styles.noteCard}>
            <View style={styles.noteHeader}>
              <Text style={styles.noteTitle}>💌 Daily Love Note</Text>
              <FontAwesome name="quote-right" size={14} color={COLORS.primary} />
            </View>
            {partnerNote ? (
              <Text style={styles.noteText}>"{partnerNote.content}"</Text>
            ) : (
              <Text style={styles.noteEmpty}>No love note today yet 💌</Text>
            )}
            <TouchableOpacity style={styles.leaveNoteBtn} onPress={() => setNoteModalVisible(true)}>
              <FontAwesome name="pencil" size={12} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.leaveNoteBtnText}>Write Note</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Anniversary Countdown */}
        {anniversaryDate && (
          <Animated.View entering={FadeInDown.delay(450).duration(600)}>
            <View style={styles.anniversaryCard}>
              <Text style={styles.anniversaryTitle}>🎉 Next Anniversary</Text>
              <Text style={styles.anniversaryDate}>
                {new Date(anniversaryDate).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
              <Text style={styles.anniversaryDays}>
                {Math.ceil((new Date(anniversaryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days to go
              </Text>
            </View>
          </Animated.View>
        )}

        {/* Shared Goals */}
        <Animated.View entering={FadeInDown.delay(500).duration(600)}>
          <Text style={styles.sectionDivider}>🎯 Shared Goals</Text>
          <GoalsCard
            goals={goals}
            onUpdateProgress={handleUpdateGoalProgress}
            onAddGoal={() => setGoalModalVisible(true)}
          />
        </Animated.View>

        {/* Active Polls */}
        <Animated.View entering={FadeInDown.delay(600).duration(600)}>
          <Text style={styles.sectionDivider}>📊 Active Polls</Text>
          <PollsCard
            polls={polls}
            onVote={handleVote}
            onAddPoll={() => setPollModalVisible(true)}
          />
        </Animated.View>

        {/* Upcoming Events */}
        <Animated.View entering={FadeInDown.delay(700).duration(600)}>
          <Text style={styles.sectionDivider}>📅 Upcoming Events</Text>
          <UpcomingEventsCard
            events={events}
            onAddEvent={() => setEventModalVisible(true)}
            onRefresh={fetchDashboardData}
          />
        </Animated.View>

        {/* Activity Feed */}
        <Animated.View entering={FadeInDown.delay(800).duration(600)}>
          <Text style={styles.sectionDivider}>📱 Recent Activity</Text>
          <ActivityFeedCard activities={activities} />
        </Animated.View>

        {/* Bottom padding for FAB */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ===== MODALS ===== */}

      {/* Love Note Modal */}
      <Modal visible={isNoteModalVisible} transparent animationType="slide" onRequestClose={() => setNoteModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Write a Love Note 💌</Text>
            <Text style={styles.modalSubtitle}>Your partner will see this immediately</Text>
            <TextInput
              style={styles.modalInput}
              value={noteInput}
              onChangeText={setNoteInput}
              placeholder="My love, I've been thinking about you..."
              placeholderTextColor="#666"
              multiline
              numberOfLines={4}
              maxLength={500}
              autoFocus
            />
            <Text style={styles.charCounter}>{noteInput.length}/500</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setNoteModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.saveButton, isSavingNote && styles.buttonDisabled]} onPress={handleSaveNote} disabled={isSavingNote}>
                {isSavingNote ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveButtonText}>Send with Love ❤️</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Mood Modal */}
      <Modal visible={isMoodModalVisible} transparent animationType="slide" onRequestClose={() => setMoodModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>How are you feeling today?</Text>
            <Text style={styles.modalSubtitle}>Share your mood with your partner</Text>
            
            {/* Quick Mood Selection Buttons */}
            <View style={styles.quickMoodGrid}>
              {[
                { emoji: '😊', label: 'Happy', color: '#FFD93D' },
                { emoji: '😍', label: 'Loved', color: '#FF6B6B' },
                { emoji: '😔', label: 'Sad', color: '#6C9EBF' },
                { emoji: '😤', label: 'Angry', color: '#E74C3C' },
                { emoji: '😴', label: 'Tired', color: '#9B59B6' },
                { emoji: '🥰', label: 'Romantic', color: '#FF69B4' },
                { emoji: '🤗', label: 'Grateful', color: '#2ECC71' },
                { emoji: '🎉', label: 'Excited', color: '#F39C12' },
                { emoji: '😎', label: 'Confident', color: '#1ABC9C' },
                { emoji: '🥺', label: 'Missing You', color: '#E67E22' },
              ].map((mood) => (
                <TouchableOpacity
                  key={mood.label}
                  style={[
                    styles.quickMoodButton,
                    selectedMoodEmoji === mood.emoji && { borderColor: mood.color, backgroundColor: `${mood.color}20` }
                  ]}
                  onPress={() => {
                    setSelectedMoodEmoji(mood.emoji);
                    setMoodInput(mood.label);
                  }}
                >
                  <Text style={styles.quickMoodEmoji}>{mood.emoji}</Text>
                  <Text style={[styles.quickMoodLabel, selectedMoodEmoji === mood.emoji && { color: mood.color }]}>
                    {mood.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Custom Mood Input */}
            <View style={styles.customMoodDivider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or describe your mood</Text>
              <View style={styles.dividerLine} />
            </View>

            <TextInput
              style={styles.modalInput}
              value={moodInput}
              onChangeText={setMoodInput}
              placeholder="e.g., Feeling energetic and happy today! 🌟"
              placeholderTextColor="#666"
              autoFocus
              maxLength={100}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setMoodModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.saveButton, isSavingMood && styles.buttonDisabled]} onPress={handleSaveMood} disabled={isSavingMood}>
                {isSavingMood ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveButtonText}>Share Mood 😊</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Quick Love Customize Modal */}
      <Modal visible={isQuickLoveCustomizeVisible} transparent animationType="slide" onRequestClose={() => setQuickLoveCustomizeVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Customize Quick Love Messages 💕</Text>
            <Text style={styles.modalSubtitle}>Add your own messages to send to your partner</Text>
            
            <View style={styles.customMessageInputRow}>
              <TextInput
                style={styles.emojiInput}
                value={customMessageEmoji}
                onChangeText={setCustomMessageEmoji}
                placeholder="❤️"
                maxLength={2}
              />
              <TextInput
                style={styles.messageInput}
                value={customMessageInput}
                onChangeText={setCustomMessageInput}
                placeholder="e.g., You're amazing!"
                placeholderTextColor="#666"
                maxLength={50}
              />
              <TouchableOpacity style={styles.addMessageBtn} onPress={handleAddCustomMessage} disabled={isAddingCustomMessage}>
                {isAddingCustomMessage ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.addMessageBtnText}>Add</Text>}
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 300, marginTop: 16 }}>
              <Text style={styles.customMessagesTitle}>Your Custom Messages:</Text>
              {customQuickMessages.length === 0 ? (
                <Text style={styles.noMessagesText}>No custom messages yet. Add one above! ✨</Text>
              ) : (
                customQuickMessages.map((msg) => (
                  <View key={msg.id} style={styles.customMessageItem}>
                    <Text style={styles.customMessageEmoji}>{msg.emoji}</Text>
                    <Text style={styles.customMessageText}>{msg.text}</Text>
                  </View>
                ))
              )}
            </ScrollView>

            <TouchableOpacity style={styles.closeModalBtn} onPress={() => setQuickLoveCustomizeVisible(false)}>
              <Text style={styles.closeModalText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Goal Modal */}
      <Modal visible={isGoalModalVisible} transparent animationType="slide" onRequestClose={() => setGoalModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add a Goal or Bucket List Item 🎯</Text>
            <Text style={styles.inputLabel}>Pick an emoji</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              {['🎯', '🏃', '🍕', '🎬', '🌍', '📚', '❤️', '🎮', '🎨', '✈️', '🏋️', '💪'].map((e) => (
                <TouchableOpacity
                  key={e}
                  style={[styles.emojiChip, goalEmoji === e && styles.emojiChipSelected]}
                  onPress={() => setGoalEmoji(e)}
                >
                  <Text style={styles.emojiChipText}>{e}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 10 }}>
              <Text style={[styles.inputLabel, { marginBottom: 0 }]}>Or enter custom emoji:</Text>
              <TextInput
                style={{
                  backgroundColor: '#111',
                  color: '#fff',
                  borderRadius: 12,
                  width: 44,
                  height: 44,
                  fontSize: 18,
                  textAlign: 'center',
                  borderWidth: 1,
                  borderColor: COLORS.border,
                }}
                value={['🎯', '🏃', '🍕', '🎬', '🌍', '📚', '❤️', '🎮', '🎨', '✈️', '🏋️', '💪'].includes(goalEmoji) ? '' : goalEmoji}
                onChangeText={(text) => {
                  const emoji = text.trim();
                  setGoalEmoji(emoji || '🎯');
                }}
                maxLength={2}
                placeholder="➕"
                placeholderTextColor="#666"
              />
            </View>
            <TextInput
              style={[styles.modalInput, { height: 50 }]}
              value={goalTitle}
              onChangeText={setGoalTitle}
              placeholder="e.g., Save ₹50,000 For Goa Trip ✈️"
              placeholderTextColor="#555"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setGoalModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.saveButton, isSavingGoal && styles.buttonDisabled]} onPress={handleSaveGoal} disabled={isSavingGoal}>
                {isSavingGoal ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveButtonText}>Create Goal</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Poll Modal */}
      <Modal visible={isPollModalVisible} transparent animationType="slide" onRequestClose={() => setPollModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Start a Poll 🗳️</Text>
            <TextInput
              style={[styles.modalInput, { height: 50 }]}
              value={pollQuestion}
              onChangeText={setPollQuestion}
              placeholder="What's for dinner? 🍕"
              placeholderTextColor="#555"
            />
            {pollOptions.map((opt, i) => (
              <TextInput
                key={i}
                style={[styles.modalInput, { height: 44, marginBottom: 10 }]}
                value={opt}
                onChangeText={(text) => {
                  const newOpts = [...pollOptions];
                  newOpts[i] = text;
                  setPollOptions(newOpts);
                }}
                placeholder={`Option ${i + 1}`}
                placeholderTextColor="#555"
              />
            ))}
            <TouchableOpacity onPress={() => setPollOptions([...pollOptions, ''])} style={{ marginBottom: 15 }}>
              <Text style={{ color: COLORS.primary, fontWeight: 'bold' }}>+ Add Option</Text>
            </TouchableOpacity>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setPollModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.saveButton, isSavingPoll && styles.buttonDisabled]} onPress={handleSavePoll} disabled={isSavingPoll}>
                {isSavingPoll ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveButtonText}>Start Poll</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Event Modal */}
      <Modal visible={isEventModalVisible} transparent animationType="slide" onRequestClose={() => setEventModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add an Event 📅</Text>
            <Text style={styles.inputLabel}>Event Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              {[
                { label: '❤️ Date', value: 'date', color: '#FF9F43' },
                { label: '✈️ Trip', value: 'trip', color: '#4D96FF' },
                { label: '🎂 Milestone', value: 'milestone', color: '#FFD700' },
                { label: '📌 Custom', value: 'custom', color: '#9B5DE5' },
              ].map((et) => (
                <TouchableOpacity
                  key={et.value}
                  style={[styles.typeChip, eventType === et.value && { backgroundColor: `${et.color}30`, borderColor: et.color }]}
                  onPress={() => setEventType(et.value as CoupleEvent['eventType'])}
                >
                  <Text style={[styles.typeChipText, eventType === et.value && { color: et.color }]}>{et.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={styles.inputLabel}>Pick an emoji</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              {['📅', '💑', '✈️', '🎂', '🌹', '🏖️', '🎉', '🍽️', '🎭', '💍'].map((e) => (
                <TouchableOpacity
                  key={e}
                  style={[styles.emojiChip, eventEmoji === e && styles.emojiChipSelected]}
                  onPress={() => setEventEmoji(e)}
                >
                  <Text style={styles.emojiChipText}>{e}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 10 }}>
              <Text style={[styles.inputLabel, { marginBottom: 0 }]}>Or enter custom emoji:</Text>
              <TextInput
                style={{
                  backgroundColor: '#111',
                  color: '#fff',
                  borderRadius: 12,
                  width: 44,
                  height: 44,
                  fontSize: 18,
                  textAlign: 'center',
                  borderWidth: 1,
                  borderColor: COLORS.border,
                }}
                value={['📅', '💑', '✈️', '🎂', '🌹', '🏖️', '🎉', '🍽️', '🎭', '💍'].includes(eventEmoji) ? '' : eventEmoji}
                onChangeText={(text) => {
                  const emoji = text.trim();
                  setEventEmoji(emoji || '📅');
                }}
                maxLength={2}
                placeholder="➕"
                placeholderTextColor="#666"
              />
            </View>
            <TextInput
              style={[styles.modalInput, { height: 50 }]}
              value={eventTitle}
              onChangeText={setEventTitle}
              placeholder="Event name (e.g. Paris Trip)"
              placeholderTextColor="#555"
            />
            <TextInput
              style={[styles.modalInput, { height: 50 }]}
              value={eventDate}
              onChangeText={setEventDate}
              placeholder="Date (YYYY-MM-DD)"
              placeholderTextColor="#555"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setEventModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.saveButton, isSavingEvent && styles.buttonDisabled]} onPress={handleSaveEvent} disabled={isSavingEvent}>
                {isSavingEvent ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveButtonText}>Add Event</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Floating Action Menu */}
      <FloatingActionMenu
        onAddGoal={() => setGoalModalVisible(true)}
        onAddPoll={() => setPollModalVisible(true)}
        onAddNote={() => setNoteModalVisible(true)}
        onAddEvent={() => setEventModalVisible(true)}
      />
    </View>
  );
}

// =============== STYLES ===============

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.md,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  header: {
    marginTop: Platform.OS === 'ios' ? 60 : 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
  },
  greeting: {
    color: COLORS.subtext,
    fontSize: 13,
    fontWeight: '600',
  },
  coupleName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 4,
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  // Redesigned Days Card Styles
  daysCardContainer: {
    marginBottom: 16,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#FF4D8D',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  daysCardGradient: {
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  decorativeCircles: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  decorCircle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  decorCircle1: {
    width: 150,
    height: 150,
    top: -50,
    right: -50,
  },
  decorCircle2: {
    width: 100,
    height: 100,
    bottom: -30,
    left: -30,
  },
  decorCircle3: {
    width: 200,
    height: 200,
    top: '30%',
    left: '-20%',
  },
  sparkleContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
    flexDirection: 'row',
    gap: 8,
  },
  sparkleIcon: {
    fontSize: 14,
    opacity: 0.6,
  },
  sparkleIcon2: {
    fontSize: 10,
    opacity: 0.4,
  },
  romanticQuote: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  avatarWrapper: {
    alignItems: 'center',
    gap: 6,
  },
  avatarGlow: {
    borderRadius: 32,
    padding: 2,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  avatarInitials: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FF4D8D',
  },
  avatarName: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.9,
  },
  heartAnimation: {
    marginHorizontal: 16,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  heartBeatRing: {
    position: 'absolute',
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  heartBeatRing2: {
    position: 'absolute',
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  daysCounterSection: {
    alignItems: 'center',
    marginTop: 8,
    width: '100%',
  },
  daysLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 2,
  },
  daysNumber: {
    color: '#fff',
    fontSize: 64,
    fontWeight: '900',
    lineHeight: 68,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.15)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 8,
  },
  daysBadgeContainer: {
    marginTop: 4,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 12,
  },
  daysBadgeGradient: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  daysBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  milestoneProgress: {
    width: '100%',
    marginTop: 6,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 2,
  },
  milestoneLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  milestoneLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 9,
    fontWeight: '500',
  },
  floatingHearts: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  floatingHeart: {
    position: 'absolute',
    fontSize: 14,
    opacity: 0.4,
  },
  partnerCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  partnerCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heartCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 77, 109, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  partnerStatus: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  partnerOnlineText: {
    color: COLORS.subtext,
    fontSize: 11,
    marginTop: 2,
    fontWeight: '600',
  },
  badge: {
    backgroundColor: 'rgba(255, 77, 109, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 109, 0.3)',
  },
  badgeText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: 'bold',
  },
  // Quick Love Styles
  quickLoveContainer: {
    marginBottom: SPACING.md,
  },
  quickLoveButton: {
    borderRadius: 30,
    overflow: 'hidden',
  },
  quickLoveGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 14,
  },
  quickLoveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  quickLoveMenu: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  quickLoveMenuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  quickLoveMenuTitle: {
    color: COLORS.subtext,
    fontSize: 12,
    fontWeight: '600',
  },
  quickLoveCustomize: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '600',
  },
  quickLoveItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    justifyContent: 'space-between',
  },
  quickLoveItemDisabled: {
    opacity: 0.5,
  },
  quickLoveItemEmoji: {
    fontSize: 18,
    marginRight: 10,
  },
  quickLoveItemText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  // Mood Card Styles
  moodCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  moodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  moodLabel: {
    color: COLORS.subtext,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  moodUpdateText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '600',
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  moodItem: {
    flex: 1,
    alignItems: 'center',
  },
  moodDivider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: 12,
  },
  moodItemLabel: {
    color: COLORS.subtext,
    fontSize: 10,
    marginBottom: 4,
  },
  moodValue: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },
  // Note Card Styles
  noteCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  noteTitle: {
    color: COLORS.subtext,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  noteText: {
    color: '#fff',
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 18,
    marginBottom: 10,
  },
  noteEmpty: {
    color: COLORS.subtext,
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: 10,
  },
  leaveNoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  leaveNoteBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  // Anniversary Card Styles
  anniversaryCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  anniversaryTitle: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  anniversaryDate: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  anniversaryDays: {
    color: COLORS.subtext,
    fontSize: 11,
  },
  // Section Divider
  sectionDivider: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: 4,
    marginBottom: 10,
    marginTop: 18,
    letterSpacing: 0.5,
  },
  // Connection Status
  connectionStatusBar: {
    backgroundColor: 'rgba(255, 77, 109, 0.1)',
    paddingVertical: 6,
    alignItems: 'center',
  },
  connectionStatusText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '600',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 18,
    width: '85%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
    textAlign: 'center',
  },
  modalSubtitle: {
    color: COLORS.subtext,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 14,
  },
  inputLabel: {
    color: COLORS.subtext,
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: '#111',
    color: '#fff',
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 8,
  },
  charCounter: {
    color: COLORS.subtext,
    fontSize: 10,
    textAlign: 'right',
    marginBottom: 12,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  emojiButton: {
    width: '22%',
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emojiButtonSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  emojiText: {
    fontSize: 28,
  },
  emojiChip: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  emojiChipSelected: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(255, 77, 141, 0.15)',
  },
  emojiChipText: {
    fontSize: 22,
  },
  typeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
  },
  typeChipText: {
    color: COLORS.subtext,
    fontSize: 13,
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
  },
  cancelButtonText: {
    color: COLORS.subtext,
    fontWeight: '600',
    fontSize: 13,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  // Custom Message Styles
  customMessageInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  emojiInput: {
    backgroundColor: '#111',
    color: '#fff',
    borderRadius: 12,
    padding: 12,
    fontSize: 20,
    textAlign: 'center',
    width: 50,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  messageInput: {
    flex: 1,
    backgroundColor: '#111',
    color: '#fff',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  addMessageBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 12,
    justifyContent: 'center',
  },
  addMessageBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  customMessagesTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  noMessagesText: {
    color: COLORS.subtext,
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 16,
  },
  customMessageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    marginBottom: 8,
  },
  customMessageEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  customMessageText: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
  },
  closeModalBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  closeModalText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  // Empty State
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.background,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyText: {
    color: COLORS.subtext,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  connectButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  connectButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  // Enhanced Quick Love Button Styles
  quickLoveButtonEnhanced: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    marginBottom: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  quickLoveButtonTextEnhanced: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  // Quick Love Modal Styles
  quickLoveModal: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    width: '85%',
    maxWidth: 380,
    maxHeight: '80%',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quickLoveModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  quickLoveModalTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  quickMessagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    gap: 8,
  },
  quickMessageCard: {
    backgroundColor: 'rgba(255,77,109,0.08)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,77,109,0.2)',
  },
  quickMessageEmoji: {
    fontSize: 16,
  },
  quickMessageText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: 14,
    marginVertical: 10,
  },
  customMessageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    marginHorizontal: 14,
    marginBottom: 14,
    backgroundColor: 'rgba(255,77,109,0.08)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,77,109,0.3)',
    borderStyle: 'dashed',
  },
  customMessageBtnText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  customInputContainer: {
    padding: 14,
    gap: 10,
  },
  customMessageInput: {
    backgroundColor: '#111',
    color: '#fff',
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  customInputActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancelCustomBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelCustomText: {
    color: COLORS.subtext,
    fontSize: 12,
  },
  sendCustomBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  sendCustomText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  // Enhanced Header Styles
  headerContainer: {
    marginTop: Platform.OS === 'ios' ? 60 : 40,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  greetingText: {
    color: COLORS.subtext,
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  userNameText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 2,
  },
  waveEmoji: {
    fontSize: 24,
  },
  profileIcon: {
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  profileGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitials: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  coupleNameText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  daysSubtext: {
    color: COLORS.subtext,
    fontSize: 13,
    marginTop: 4,
    fontWeight: '500',
  },

  notificationBtnEnhanced: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  // Quick Mood Grid Styles
  quickMoodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  quickMoodButton: {
    width: '30%',
    aspectRatio: 1.2,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 6,
  },
  quickMoodEmoji: {
    fontSize: 26,
    marginBottom: 4,
  },
  quickMoodLabel: {
    color: COLORS.subtext,
    fontSize: 11,
    fontWeight: '500',
  },
  customMoodDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
    gap: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    color: COLORS.subtext,
    fontSize: 11,
    fontStyle: 'italic',
  },
  // Card Direct Quick Mood Styles
  cardQuickMoodContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  cardQuickMoodTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  cardQuickMoodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  cardQuickMoodButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  cardQuickMoodEmoji: {
    fontSize: 18,
    marginBottom: 4,
  },
  cardQuickMoodLabel: {
    color: COLORS.subtext,
    fontSize: 10,
    fontWeight: '500',
  },
});