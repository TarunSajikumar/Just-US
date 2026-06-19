import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { COLORS } from '../../theme/colors';
import { SPACING } from '../../theme/spacing';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../store/authStore';
import { inviteService } from '../../services/inviteService';
import Toast from 'react-native-toast-message';
import VideoBackground from '../../components/VideoBackground';

// ============ Constants ============
const DAILY_QUOTES = [
  { text: 'The best thing to hold onto in life is each other.', author: 'Audrey Hepburn' },
  { text: 'Love is composed of a single soul inhabiting two bodies.', author: 'Aristotle' },
  { text: 'Whatever our souls are made of, his and mine are the same.', author: 'Emily Brontë' },
  { text: 'To love and be loved is to feel the sun from both sides.', author: 'David Viscott' },
  { text: 'A successful marriage requires falling in love many times.', author: 'Mignon McLaughlin' },
  { text: 'The greatest happiness of life is the conviction that we are loved.', author: 'Victor Hugo' },
  { text: 'Love is not about how many days, months, or years you have been together.', author: 'Unknown' },
  { text: 'Where there is love, there is life.', author: 'Mahatma Gandhi' },
  { text: 'The best love is the kind that awakens the soul.', author: 'Nicholas Sparks' },
  { text: 'Love recognizes no barriers.', author: 'Maya Angelou' },
];

const FEATURES = [
  { icon: 'comments', label: 'Private Chat', color: '#4D96FF', description: 'Secure 1-on-1 messaging' },
  { icon: 'image', label: 'Shared Gallery', color: COLORS.primary, description: 'Store memories together' },
  { icon: 'history', label: 'Love Timeline', color: '#9B5DE5', description: 'Track your journey' },
  { icon: 'trophy', label: 'Achievements', color: '#FFD700', description: 'Earn badges together' },
  { icon: 'bell', label: 'Miss You Pings', color: '#6BCB77', description: 'Send love reminders' },
  { icon: 'lock', label: 'Private Vault', color: '#FF9F43', description: 'Keep secrets safe' },
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const FEATURE_ITEM_WIDTH = (SCREEN_WIDTH - SPACING.md * 2 - 20) / 3 - 14;

// ============ Helper Functions ============
const getDailyQuote = () => {
  const startOfYear = new Date(new Date().getFullYear(), 0, 0);
  const dayOfYear = Math.floor((Date.now() - startOfYear.getTime()) / 86400000);
  return DAILY_QUOTES[dayOfYear % DAILY_QUOTES.length];
};

const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
};

// ============ Main Component ============
export default function SoloHomeScreen({ navigation }: any) {
  const { user, refreshUser } = useAuthStore();
  const displayName = user?.name?.split(' ')[0] || 'There';
  const quote = useMemo(() => getDailyQuote(), []);
  const greeting = useMemo(() => getGreeting(), []);

  const [myCode, setMyCode] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load existing active invite code on mount
  useEffect(() => {
    const loadExistingInvite = async () => {
      try {
        const existingInvites = await inviteService.getMyInvites();
        if (existingInvites && existingInvites.length > 0) {
          const activeInvite = existingInvites.find(
            (invite: any) => !invite.used && new Date(invite.expiresAt) > new Date()
          );
          if (activeInvite) {
            setMyCode(activeInvite.code);
          }
        }
      } catch {
        // Silently fail — user can generate a new code
      }
    };
    loadExistingInvite();
  }, []);

  // ============ Handlers ============
  const handleGenerateCode = useCallback(async () => {
    if (isGenerating) return;

    setIsGenerating(true);
    try {
      const code = await inviteService.createInvite();
      setMyCode(code);
      Toast.show({ type: 'success', text1: '✨ Invite code created!', text2: 'Share it with your partner' });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Failed to generate code',
        text2: error?.response?.data?.message || 'Please check your connection',
      });
    } finally {
      setIsGenerating(false);
    }
  }, [isGenerating]);

  const handleCopyCode = useCallback(() => {
    if (!myCode) return;
    // Clipboard import removed for RN 0.73+ compatibility; using Share as primary
    Toast.show({ type: 'success', text1: '📋 Use Share to send your code!', text2: myCode });
  }, [myCode]);

  const handleShareCode = useCallback(async () => {
    if (!myCode) return;

    try {
      await Share.share({
        message: `💕 Join me on JustUs — our private space together!\n\n✨ Use my invite code: ${myCode}\n\nDownload the app and enter the code to connect with me! 💑`,
        title: 'JustUs Invite - Connect with me!',
      });
    } catch {
      // User cancelled share dialog
      handleCopyCode();
    }
  }, [myCode, handleCopyCode]);

  const handleJoin = useCallback(async () => {
    const trimmedCode = joinCode.trim().toUpperCase();
    if (trimmedCode.length < 4) {
      Toast.show({ type: 'error', text1: 'Invalid code', text2: 'Please enter the complete invite code' });
      return;
    }

    setIsJoining(true);
    try {
      await inviteService.joinInvite(trimmedCode);
      Toast.show({ type: 'success', text1: '🎉 Connected!', text2: 'You are now linked with your partner!' });
      await refreshUser();
      setShowJoinInput(false);
      setJoinCode('');
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Could not connect',
        text2: err?.response?.data?.message || 'Please check the code and try again',
      });
    } finally {
      setIsJoining(false);
    }
  }, [joinCode, refreshUser]);

  const handlePromptForCode = useCallback(() => {
    Alert.prompt(
      'Enter Partner Code',
      'Enter the 6-character code your partner shared with you',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Connect ❤️',
          onPress: (code?: string) => code && setJoinCode(code.toUpperCase()),
        },
      ],
      'plain-text',
      joinCode,
      'default'
    );
  }, [joinCode]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refreshUser();
      const existingInvites = await inviteService.getMyInvites();
      if (existingInvites && existingInvites.length > 0) {
        const activeInvite = existingInvites.find(
          (invite: any) => !invite.used && new Date(invite.expiresAt) > new Date()
        );
        if (activeInvite) setMyCode(activeInvite.code);
      }
    } catch {
      // Silent fail
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshUser]);

  // ============ Profile Completeness ============
  const profileCompleteness = useMemo(() => {
    let score = 0;
    if (user?.name && user.name.trim().length > 0) score += 34;
    if (user?.birthday) score += 33;
    if (user?.gender) score += 33;
    return score;
  }, [user?.name, user?.birthday, user?.gender]);

  const missingFields = useMemo(() => {
    const missing: string[] = [];
    if (!user?.birthday) missing.push('Add your birthday');
    if (!user?.gender) missing.push('Add your gender');
    return missing;
  }, [user?.birthday, user?.gender]);

  const codeCharacters = useMemo(() => myCode.split(''), [myCode]);

  const joinCodeCharacters = useMemo(() => {
    const chars = joinCode.split('');
    while (chars.length < 6) chars.push('');
    return chars;
  }, [joinCode]);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <VideoBackground />
      <ScrollView
        style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
      }
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.greeting}>{greeting}, {displayName} 👋</Text>
          <Text style={styles.headerSub}>Your personal space</Text>
        </View>
        <TouchableOpacity
          style={styles.avatarCircle}
          onPress={() => navigation?.navigate('Profile')}
          activeOpacity={0.7}
        >
          <Text style={styles.avatarInitial}>
            {displayName.charAt(0).toUpperCase()}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Daily Quote Card */}
      <View style={styles.quoteCard}>
        <FontAwesome name="quote-left" size={20} color={COLORS.primary} style={styles.quoteIcon} />
        <Text style={styles.quoteText}>"{quote.text}"</Text>
        <Text style={styles.quoteAuthor}>— {quote.author}</Text>
      </View>

      {/* Profile Completeness */}
      {profileCompleteness < 100 && (
        <TouchableOpacity
          style={styles.profileCard}
          onPress={() => navigation?.navigate('EditProfile')}
          activeOpacity={0.8}
        >
          <View style={styles.profileCardHeader}>
            <FontAwesome name="user-circle-o" size={18} color={COLORS.secondary} />
            <Text style={styles.profileCardTitle}>Complete your profile</Text>
            <FontAwesome name="chevron-right" size={12} color={COLORS.subtext} />
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${profileCompleteness}%` as any }]} />
          </View>
          <Text style={styles.progressLabel}>{profileCompleteness}% complete</Text>
          {missingFields.map((field, index) => (
            <Text key={index} style={styles.profileHint}>· {field}</Text>
          ))}
        </TouchableOpacity>
      )}

      {/* Partner Connection Card */}
      <View style={styles.connectSection}>
        <Text style={styles.sectionLabel}>CONNECT WITH PARTNER</Text>

        {/* Share my code */}
        <View style={styles.connectCard}>
          <View style={styles.connectCardHeader}>
            <LinearGradient
              colors={['rgba(255,77,141,0.15)', 'transparent']}
              style={styles.connectIconBg}
            >
              <FontAwesome name="heart" size={18} color={COLORS.primary} />
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={styles.connectTitle}>Share your invite code</Text>
              <Text style={styles.connectDesc}>Send this to your partner to link accounts</Text>
            </View>
          </View>

          {myCode ? (
            <View>
              <View style={styles.codeDisplay}>
                {codeCharacters.map((char, i) => (
                  <View key={i} style={styles.codeChar}>
                    <Text style={styles.codeCharText}>{char}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.codeActions}>
                <TouchableOpacity style={styles.codeBtn} onPress={handleCopyCode}>
                  <FontAwesome name="copy" size={14} color={COLORS.primary} />
                  <Text style={styles.codeBtnText}>Copy</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.codeBtn, styles.codeBtnShare]} onPress={handleShareCode}>
                  <FontAwesome name="share-alt" size={14} color="#fff" />
                  <Text style={[styles.codeBtnText, { color: '#fff' }]}>Share</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.codeExpiry}>⏱ Code expires in 24 hours</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.generateBtn, isGenerating && styles.disabledButton]}
              onPress={handleGenerateCode}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <FontAwesome name="magic" size={14} color="#fff" />
                  <Text style={styles.generateBtnText}>Generate My Code</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Join with partner's code */}
        <TouchableOpacity
          style={styles.joinCard}
          onPress={() => setShowJoinInput(!showJoinInput)}
          activeOpacity={0.8}
        >
          <View style={styles.connectCardHeader}>
            <View style={[styles.connectIconBg, { backgroundColor: 'rgba(77,150,255,0.12)' }]}>
              <FontAwesome name="link" size={16} color="#4D96FF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.connectTitle}>Enter partner's code</Text>
              <Text style={styles.connectDesc}>Have their code? Connect now</Text>
            </View>
            <FontAwesome
              name={showJoinInput ? 'chevron-up' : 'chevron-down'}
              size={13}
              color={COLORS.subtext}
            />
          </View>

          {showJoinInput && (
            <View style={styles.joinInputRow}>
              <View style={styles.joinInput}>
                {joinCodeCharacters.map((char, i) => (
                  <View
                    key={i}
                    style={[styles.codeChar, styles.codeCharInput, char ? styles.codeCharFilled : undefined]}
                  >
                    <Text style={[styles.codeCharText, { color: char ? '#fff' : '#333' }]}>
                      {char || '·'}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={styles.hiddenInputWrapper}>
                <Text style={styles.hiddenInput} onPress={handlePromptForCode}>
                  {joinCode ? '✓ Code entered' : 'Tap to enter code'}
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.joinBtn, (!joinCode.trim() || isJoining) && styles.disabledButton]}
                onPress={handleJoin}
                disabled={!joinCode.trim() || isJoining}
              >
                {isJoining ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.joinBtnText}>Connect ❤️</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* What you'll unlock */}
      <Text style={styles.sectionLabel}>✨ COUPLE FEATURES WAITING FOR YOU</Text>
      <View style={styles.featureGrid}>
        {FEATURES.map((feature) => (
          <TouchableOpacity key={feature.label} style={styles.featureItem} activeOpacity={0.7}>
            <View style={[styles.featureIcon, { backgroundColor: `${feature.color}18` }]}>
              <FontAwesome name={feature.icon as any} size={20} color={feature.color} />
            </View>
            <Text style={styles.featureLabel}>{feature.label}</Text>
            <Text style={styles.featureDescription} numberOfLines={2}>
              {feature.description}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Footer note */}
      <Text style={styles.footerNote}>
        💕 Once connected, you'll unlock private chat, shared gallery, and more!
      </Text>
    </ScrollView>
    </View>
  );
}

// ============ Styles ============
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  contentContainer: {
    paddingHorizontal: SPACING.md,
    paddingBottom: 100,
  },
  headerRow: {
    marginTop: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  greeting: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  headerSub: {
    color: COLORS.subtext,
    fontSize: 13,
    marginTop: 3,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },

  // Quote
  quoteCard: {
    backgroundColor: COLORS.card,
    borderRadius: 22,
    padding: 22,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quoteIcon: {
    marginBottom: 10,
  },
  quoteText: {
    color: '#fff',
    fontSize: 15,
    fontStyle: 'italic',
    lineHeight: 24,
    marginBottom: 10,
  },
  quoteAuthor: {
    color: COLORS.subtext,
    textAlign: 'right',
    fontSize: 12,
  },

  // Profile completeness
  profileCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 18,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  profileCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  profileCardTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#222',
    borderRadius: 3,
    marginBottom: 8,
  },
  progressBarFill: {
    height: 6,
    backgroundColor: COLORS.secondary,
    borderRadius: 3,
  },
  progressLabel: {
    color: COLORS.subtext,
    fontSize: 11,
  },
  profileHint: {
    color: COLORS.subtext,
    fontSize: 12,
    marginTop: 4,
  },

  // Connect section
  connectSection: {
    marginBottom: SPACING.lg,
  },
  sectionLabel: {
    color: COLORS.subtext,
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1.2,
    marginBottom: 12,
    marginTop: 4,
  },
  connectCard: {
    backgroundColor: COLORS.card,
    borderRadius: 22,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  connectCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  connectIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,77,141,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  connectDesc: {
    color: COLORS.subtext,
    fontSize: 12,
  },

  codeDisplay: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  codeChar: {
    width: 38,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  codeCharInput: {
    borderColor: '#333',
    borderStyle: 'dashed',
  },
  codeCharFilled: {
    borderColor: COLORS.primary,
    borderStyle: 'solid',
  },
  codeCharText: {
    color: COLORS.primary,
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 1,
  },

  codeActions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  codeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(255,77,141,0.08)',
  },
  codeBtnShare: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  codeBtnText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 13,
  },
  codeExpiry: {
    color: COLORS.subtext,
    fontSize: 11,
    textAlign: 'center',
  },

  generateBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  generateBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },

  // Join card
  joinCard: {
    backgroundColor: COLORS.card,
    borderRadius: 22,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  joinInputRow: {
    marginTop: 4,
  },
  joinInput: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 14,
  },
  hiddenInputWrapper: {
    alignItems: 'center',
    marginBottom: 8,
  },
  hiddenInput: {
    color: COLORS.subtext,
    fontSize: 13,
  },
  joinBtn: {
    backgroundColor: '#4D96FF',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  joinBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },

  // Feature grid
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  featureItem: {
    width: FEATURE_ITEM_WIDTH,
    backgroundColor: COLORS.card,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
    padding: 12,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  featureDescription: {
    color: COLORS.subtext,
    fontSize: 9,
    textAlign: 'center',
  },
  footerNote: {
    color: COLORS.subtext,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  disabledButton: {
    opacity: 0.6,
  },
});
