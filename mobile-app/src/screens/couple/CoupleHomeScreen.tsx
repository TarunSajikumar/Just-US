import React, { useEffect, useState, useCallback, useMemo } from 'react';
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
} from 'react-native';
import { COLORS } from '../../theme/colors';
import { SPACING } from '../../theme/spacing';
import { FontAwesome } from '@expo/vector-icons';
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
import MoodCard from '../../components/home/MoodCard';
import AnniversaryCard from '../../components/home/AnniversaryCard';
import MeetCountdownCard from '../../components/home/MeetCountdownCard';
import AchievementsCard from '../../components/home/AchievementsCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
  if (hour < 12) return 'Good Morning ❤️';
  if (hour < 17) return 'Good Afternoon ❤️';
  return 'Good Evening ❤️';
}

function formatLastSeen(lastSeenDateStr?: string | Date | null): string {
  if (!lastSeenDateStr) return 'Offline';
  try {
    const lastSeen = new Date(lastSeenDateStr);
    const now = new Date();
    const diffMs = now.getTime() - lastSeen.getTime();

    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Active just now';
    if (mins < 60) return `Last seen ${mins} min${mins > 1 ? 's' : ''} ago`;

    const hours = Math.floor(mins / 60);
    if (hours < 24) return `Last seen ${hours} hour${hours > 1 ? 's' : ''} ago`;

    const days = Math.floor(hours / 24);
    return `Last seen ${days} day${days > 1 ? 's' : ''} ago`;
  } catch {
    return 'Offline';
  }
}

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

  const [isSendingPing, setIsSendingPing] = useState(false);
  const [partnerStatus, setPartnerStatus] = useState<{ isOnline: boolean; lastSeen: string | null } | null>(null);
  const [partnerMood, setPartnerMood] = useState<{ mood: string; emoji?: string } | null>(null);
  const [partnerNote, setPartnerNote] = useState<{ content: string; createdAt: string } | null>(null);
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isNoteModalVisible, setNoteModalVisible] = useState(false);
  const [noteInput, setNoteInput] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);

  const displayName = partnerNickname || partner?.name || 'Partner';
  const coupleName = user?.name ? `${user.name} & ${displayName}` : 'You & Partner';
  const daysOfLove = getDaysOfLove(relationshipStartDate);
  const greeting = getGreeting();

  const userInitials = useMemo(() => {
    if (!user?.name) return '?';
    return user.name
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }, [user?.name]);

  const partnerInitials = useMemo(() => {
    const name = partnerNickname || partner?.name;
    if (!name) return '?';
    return name
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }, [partnerNickname, partner?.name]);

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

  const fetchDashboardData = useCallback(async () => {
    if (!partner) return;
    
    try {
      const [statusRes, moodRes, noteRes, achRes] = await Promise.allSettled([
        api.get('/users/partner-status'),
        moodService.getPartnerMood(),
        noteService.getPartnerNote(),
        achievementService.getAchievements(),
      ]);

      if (statusRes.status === 'fulfilled' && statusRes.value) {
        setPartnerStatus(statusRes.value.data);
      }
      if (moodRes.status === 'fulfilled' && moodRes.value) {
        setPartnerMood(moodRes.value);
      }
      if (noteRes.status === 'fulfilled' && noteRes.value) {
        setPartnerNote(noteRes.value);
      }
      if (achRes.status === 'fulfilled' && achRes.value?.success) {
        setUnlockedAchievements(achRes.value.achievements.map((a: any) => a.code));
      }
    } catch (err) {
      console.log('Error loading dashboard data', err);
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
      const errorMsg = error?.response?.data?.message || error?.message || 'Could not load latest data';
      Toast.show({
        type: 'error',
        text1: 'Refresh failed',
        text2: errorMsg
      });
    } finally {
      setRefreshing(false);
    }
  }, [fetchDashboardData]);

  const handleResetStatus = useCallback(async () => {
    Alert.alert(
      "Reset Status",
      "If your relationship isn't syncing correctly, you can reset your status to solo and try connecting again. This will not delete your memories.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset to Solo",
          style: "destructive",
          onPress: async () => {
            setLoadingDashboard(true);
            try {
              await authService.resetStatus();
              Toast.show({ type: 'success', text1: 'Status Reset', text2: 'You can now try connecting again.' });
            } catch (err) {
              Toast.show({ type: 'error', text1: 'Reset Failed', text2: 'Please try again later' });
            } finally {
              setLoadingDashboard(false);
            }
          }
        }
      ]
    );
  }, []);

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
      Toast.show({
        type: 'success',
        text1: 'Note Sent ❤️',
        text2: 'Your partner will see this on their home screen',
      });
      
      // Refresh achievements
      const achRes = await achievementService.getAchievements();
      if (achRes?.success) {
        setUnlockedAchievements(achRes.achievements.map((a: any) => a.code));
      }
    } catch (error: any) {
      Toast.show({ 
        type: 'error', 
        text1: 'Failed to save note', 
        text2: error?.response?.data?.message || 'Please try again' 
      });
    } finally {
      setIsSavingNote(false);
    }
  }, [noteInput]);

  // Socket sync and initial fetch
  useEffect(() => {
    let isMounted = true;

    const setupDashboard = async () => {
      // If partner is missing, try to fetch fresh profile first
      if (!partner) {
        try {
          await authService.me();
        } catch (e) {
          console.log('Initial profile refresh failed', e);
        }
      }

      await fetchDashboardData();

      let socket = socketService.getSocket();
      if (!socket) {
        socket = await socketService.connect();
      }

      if (user?._id) {
        socketService.emitUserOnline(user._id);
      }

      socket?.on('user_status_change', (data: { userId: string; status: string; lastSeen?: string }) => {
        if (isMounted && partner && data.userId === partner._id) {
          setPartnerStatus({
            isOnline: data.status === 'online',
            lastSeen: data.lastSeen || null,
          });
          // Refresh partner mood & note
          moodService.getPartnerMood().then(setPartnerMood).catch(() => null);
          noteService.getPartnerNote().then(setPartnerNote).catch(() => null);
        }
      });

      // Listen for new notes in real-time
      socket?.on('new_love_note', (data: { content: string; createdAt: string }) => {
        if (isMounted && data) {
          setPartnerNote(data as any);
          Toast.show({ type: 'info', text1: 'New Love Note 💌', text2: 'Your partner left you a note!', visibilityTime: 3000 });
        }
      });
    };

    setupDashboard();

    const interval = setInterval(() => {
      if (isMounted) {
        if (!partner) {
          authService.me().then(() => fetchDashboardData()).catch(() => null);
        } else {
          fetchDashboardData();
        }
      }
    }, 20000); // Check every 20 seconds

    return () => {
      isMounted = false;
      clearInterval(interval);
      const socket = socketService.getSocket();
      socket?.off('user_status_change');
      socket?.off('new_love_note');
    };
  }, [user?._id, partner?._id, fetchDashboardData]);

  const getPartnerStatusDisplay = useCallback(() => {
    if (!partnerStatus) return 'Offline';
    if (partnerStatus.isOnline) return '🟢 Online';
    return formatLastSeen(partnerStatus.lastSeen);
  }, [partnerStatus]);

  if (!partner) {
    return (
      <View style={styles.centeredContainer}>
        <FontAwesome name="heart-o" size={60} color={COLORS.primary} style={{ marginBottom: 20 }} />
        <Text style={styles.emptyTitle}>Connection Syncing...</Text>
        <Text style={styles.emptyText}>
          We're having trouble loading your partner's data. We'll keep trying to sync automatically.
        </Text>

        <TouchableOpacity 
          style={styles.connectButton}
          onPress={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.connectButtonText}>Sync Now 🔄</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.connectButton, { marginTop: 15, backgroundColor: 'transparent', borderWidth: 1, borderColor: COLORS.border }]}
          onPress={handleResetStatus}
        >
          <Text style={[styles.connectButtonText, { color: COLORS.subtext }]}>Reset Relationship Status</Text>
        </TouchableOpacity>

        {refreshing && (
          <Text style={{ color: COLORS.subtext, fontSize: 12, marginTop: 15 }}>
            Fetching latest profile data...
          </Text>
        )}
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.coupleName}>{coupleName}</Text>
          </View>
          <TouchableOpacity
            style={styles.notificationBtn}
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
              <FontAwesome name="bell-o" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>

        {/* Days Together Card */}
        <LinearGradient
          colors={[COLORS.primary, COLORS.secondary]}
          style={styles.counterCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.avatarRow}>
            <View style={styles.avatarCircle}>
              <Text style={[styles.avatarInitials, { color: COLORS.primary }]}>
                {userInitials}
              </Text>
            </View>
            <FontAwesome name="heart" size={20} color="#fff" style={{ marginHorizontal: 15 }} />
            <View style={styles.avatarCircle}>
              <Text style={[styles.avatarInitials, { color: COLORS.secondary }]}>
                {partnerInitials}
              </Text>
            </View>
          </View>
          <Text style={styles.counterValue}>{daysOfLove}</Text>
          <Text style={styles.counterLabel}>Days Together ❤️</Text>
        </LinearGradient>

        {/* Connected Card with Partner Status 🟢 */}
        {partner && (
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
              <Text style={styles.badgeText}>Couple</Text>
            </View>
          </View>
        )}

        {/* Mood Sharing 😊 */}
        <MoodCard
          partnerName={displayName}
          partnerMoodData={partnerMood}
          onMoodSaved={fetchDashboardData}
        />

        {/* Anniversary Countdown */}
        {anniversaryDate && <AnniversaryCard anniversaryDate={anniversaryDate} />}

        {/* Meet Countdown (Live) */}
        {nextMeetDate && <MeetCountdownCard nextMeetDate={nextMeetDate} />}

        {/* Achievements Trophies Card */}
        <AchievementsCard
          unlockedCodes={unlockedAchievements}
          onSeeAllPress={() => navigation.navigate('Achievements')}
        />

        {/* Daily Love Note Card */}
        <View style={styles.noteCard}>
          <View style={styles.noteHeader}>
            <Text style={styles.noteTitle}>Daily Love Note</Text>
            <FontAwesome name="quote-right" size={14} color={COLORS.primary} />
          </View>
          {partnerNote ? (
            <Text style={styles.noteText}>"{partnerNote.content}"</Text>
          ) : (
            <Text style={[styles.noteText, { color: COLORS.subtext, fontStyle: 'italic' }]}>
              {displayName} hasn't left a love note for you today yet.
            </Text>
          )}

          <TouchableOpacity style={styles.leaveNoteBtn} onPress={() => setNoteModalVisible(true)}>
            <FontAwesome name="pencil" size={12} color="#fff" style={{ marginRight: 6 }} />
            <Text style={styles.leaveNoteBtnText}>Leave Note</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Write Love Note Modal */}
      <Modal
        visible={isNoteModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setNoteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Pen a Daily Love Note 📝</Text>
            <TextInput
              style={styles.modalInput}
              value={noteInput}
              onChangeText={setNoteInput}
              placeholder="Good morning my love ❤️"
              placeholderTextColor="#555"
              multiline={true}
              numberOfLines={4}
              maxLength={200}
              autoFocus={true}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setNoteModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton, isSavingNote && styles.disabledButton]} 
                onPress={handleSaveNote}
                disabled={isSavingNote}
              >
                {isSavingNote ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Send note</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Floating Action Menu */}
      <FloatingActionMenu />
    </View>
  );
}

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
    marginTop: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  greeting: {
    color: COLORS.subtext,
    fontSize: 14,
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
  counterCard: {
    borderRadius: 30,
    padding: 30,
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  counterValue: {
    color: '#fff',
    fontSize: 72,
    fontWeight: 'bold',
  },
  counterLabel: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    fontWeight: '600',
    marginTop: -5,
  },
  partnerCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  partnerCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heartCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 77, 109, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  partnerStatus: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  partnerOnlineText: {
    color: COLORS.subtext,
    fontSize: 12,
    marginTop: 2,
    fontWeight: '600',
  },
  badge: {
    backgroundColor: 'rgba(255, 77, 109, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 109, 0.3)',
  },
  badgeText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  noteCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 24,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  noteTitle: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  noteText: {
    color: '#fff',
    fontSize: 16,
    fontStyle: 'italic',
    lineHeight: 24,
  },
  leaveNoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 15,
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  leaveNoteBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 25,
    width: '85%',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: '#111',
    color: '#fff',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    height: 100,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    marginRight: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  saveButton: {
    marginLeft: 10,
    backgroundColor: COLORS.primary,
  },
  cancelButtonText: {
    color: COLORS.subtext,
    fontWeight: 'bold',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.6,
  },
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
    fontSize: 15,
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
  },
});
