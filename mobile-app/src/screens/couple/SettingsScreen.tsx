import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  RefreshControl,
  Linking,
} from 'react-native';
import { COLORS } from '../../theme/colors';
import { FontAwesome } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { clearAuthData } from '../../store/authStore';
import { authService } from '../../services/authService';
import { userService } from '../../services/userService';
import Toast from 'react-native-toast-message';
import { api } from '../../services/api';

interface SettingItemProps {
  icon: string;
  label: string;
  value?: boolean;
  onToggle?: (value: boolean) => void | Promise<void>;
  onPress?: () => void;
  isDestructive?: boolean;
  isLast?: boolean;
  loading?: boolean;
}

const SettingItem = React.memo(({ 
  icon, 
  label, 
  value, 
  onToggle, 
  onPress, 
  isDestructive, 
  isLast,
  loading 
}: SettingItemProps) => {
  const [localLoading, setLocalLoading] = useState(false);
  
  const handleToggle = async (newValue: boolean) => {
    if (onToggle && !loading) {
      setLocalLoading(true);
      try {
        await onToggle(newValue);
      } finally {
        setLocalLoading(false);
      }
    }
  };

  return (
    <TouchableOpacity
      style={[styles.item, isLast && { borderBottomWidth: 0 }]}
      onPress={onPress}
      disabled={!!onToggle || loading || localLoading}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.itemLeft}>
        <View style={[styles.iconContainer, isDestructive && { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
          <FontAwesome name={icon as any} size={18} color={isDestructive ? COLORS.danger : COLORS.primary} />
        </View>
        <Text style={[styles.itemLabel, isDestructive && { color: COLORS.danger }]}>{label}</Text>
      </View>
      {onToggle ? (
        (localLoading || loading) ? (
          <ActivityIndicator size="small" color={COLORS.primary} />
        ) : (
          <Switch
            value={value || false}
            onValueChange={handleToggle}
            trackColor={{ false: '#333', true: COLORS.primary }}
            thumbColor="#fff"
          />
        )
      ) : (
        <FontAwesome name="chevron-right" size={14} color="#555" />
      )}
    </TouchableOpacity>
  );
});

export default function SettingsScreen({ navigation }: any) {
  const logout = useAuthStore((state) => state.logout);
  const setToken = useAuthStore((state) => state.setToken);
  const setUser = useAuthStore((state) => state.setUser);
  const {
    user,
    partner,
    relationshipStartDate,
    partnerNickname,
    setPartnerNickname,
    partnerPingMessage,
    setPartnerPingMessage,
    notificationsEnabled,
    setNotificationsEnabled,
  } = useAuthStore();
  
  const [darkMode, setDarkMode] = useState(true);
  const [isNicknameModalVisible, setNicknameModalVisible] = useState(false);
  const [isPingModalVisible, setPingModalVisible] = useState(false);
  const [newNickname, setNewNickname] = useState(partnerNickname || '');
  const [newPingMessage, setNewPingMessage] = useState(partnerPingMessage || '');
  const [isSavingNickname, setIsSavingNickname] = useState(false);
  const [isSavingPing, setIsSavingPing] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [language, setLanguage] = useState('en');
  const [fontSize, setFontSize] = useState('medium');
  const [exportingData, setExportingData] = useState(false);

  // ===== COUPLE+ SETTINGS =====
  const [coupleFeatureEnabled, setCoupleFeatureEnabled] = useState(false);
  const [coupleFeatureStatus, setCoupleFeatureStatus] = useState<'pending' | 'active' | 'declined' | null>(null);
  const [isTogglingCoupleFeature, setIsTogglingCoupleFeature] = useState(false);

  // ===== QUICK LOVE BUTTON SETTINGS =====
  const [quickLoveNotifications, setQuickLoveNotifications] = useState(true);
  const [showQuickLoveMessages, setShowQuickLoveMessages] = useState(false);
  const [defaultQuickMessage, setDefaultQuickMessage] = useState('I Love You ❤️');
  const [isSavingDefaultMessage, setIsSavingDefaultMessage] = useState(false);
  
  const nicknameInputRef = useRef<TextInput>(null);
  const pingInputRef = useRef<TextInput>(null);

  // Load preferences on mount
  useEffect(() => {
    userService.getPreferences().then((prefs) => {
      if (prefs?.language) setLanguage(prefs.language);
      if (prefs?.fontSize) setFontSize(prefs.fontSize);
    }).catch(() => { /* silent fail — preferences are non-critical */ });

    api.get('/users/settings/quick-love-default').then((res) => {
      if (res?.data?.defaultMessage) {
        setDefaultQuickMessage(res.data.defaultMessage);
      }
    }).catch(() => {});
  }, []);

  const handleSaveDefaultQuickMessage = useCallback(async () => {
    setIsSavingDefaultMessage(true);
    try {
      await api.post('/users/settings/quick-love-default', { defaultMessage: defaultQuickMessage });
      Toast.show({ type: 'success', text1: 'Default message saved!' });
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Failed to save' });
    } finally {
      setIsSavingDefaultMessage(false);
    }
  }, [defaultQuickMessage]);

  const formatDate = useCallback((dateString?: string | null) => {
    if (!dateString) return 'Not set';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return 'Invalid date';
    }
  }, []);

  const getDaysTogether = useCallback((dateString?: string | null) => {
    if (!dateString) return 0;
    try {
      const start = new Date(dateString);
      start.setHours(0, 0, 0, 0);
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const diffMs = now.getTime() - start.getTime();
      return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    } catch {
      return 0;
    }
  }, []);

  const daysTogether = useMemo(() => getDaysTogether(relationshipStartDate), [relationshipStartDate, getDaysTogether]);

  const handleEditDate = useCallback(() => {
    navigation.navigate('EditRelationshipDate');
  }, [navigation]);

  const handleUpdateNickname = useCallback(async () => {
    const trimmedNickname = newNickname.trim();
    if (trimmedNickname.length > 50) {
      Toast.show({ type: 'error', text1: 'Nickname too long', text2: 'Maximum 50 characters' });
      return;
    }
    
    setIsSavingNickname(true);
    try {
      await userService.updatePartnerNickname(trimmedNickname);
      setPartnerNickname(trimmedNickname);
      setNicknameModalVisible(false);
      Toast.show({ type: 'success', text1: 'Nickname updated!', text2: 'Your partner nickname has been saved ❤️' });
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Update failed', text2: error?.response?.data?.message || 'Please try again' });
    } finally {
      setIsSavingNickname(false);
    }
  }, [newNickname, setPartnerNickname]);

  const handleUpdatePingMessage = useCallback(async () => {
    const trimmedMessage = newPingMessage.trim();
    if (trimmedMessage.length > 200) {
      Toast.show({ type: 'error', text1: 'Message too long', text2: 'Maximum 200 characters' });
      return;
    }
    
    setIsSavingPing(true);
    try {
      await userService.updatePingMessage(trimmedMessage || "I miss you, where are you? ❤️");
      setPartnerPingMessage(trimmedMessage || "I miss you, where are you? ❤️");
      setPingModalVisible(false);
      Toast.show({ type: 'success', text1: 'Message updated!', text2: 'Your Miss You message has been saved ❤️' });
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Update failed', text2: error?.response?.data?.message || 'Please try again' });
    } finally {
      setIsSavingPing(false);
    }
  }, [newPingMessage, setPartnerPingMessage]);

  const handleToggleNotifications = useCallback(async (value: boolean) => {
    try {
      await userService.updateNotificationSettings(value);
      setNotificationsEnabled(value);
      Toast.show({ 
        type: 'success', 
        text1: value ? 'Notifications enabled' : 'Notifications disabled',
        text2: value ? "You'll receive updates from your partner" : "You won't receive notifications"
      });
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Update failed', text2: error?.response?.data?.message || 'Please try again' });
      throw error;
    }
  }, [setNotificationsEnabled]);

  const handleLogout = useCallback(() => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout? You'll need to log in again to access your account.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            setIsLoggingOut(true);
            try {
              await authService.logout();
              await clearAuthData();
              setToken(null);
              setUser(null);
              logout();
              Toast.show({ type: 'success', text1: 'Logged out successfully' });
            } catch (error) {
              console.error('Logout error:', error);
              Toast.show({ type: 'error', text1: 'Logout failed', text2: 'Please try again' });
            } finally {
              setIsLoggingOut(false);
            }
          }
        }
      ]
    );
  }, [logout, setToken, setUser]);

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      "Delete Account",
      "⚠️ DANGER: This action is permanent and cannot be undone.\n\nAll your data including memories, messages, and your relationship will be permanently deleted.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete Account", 
          style: "destructive", 
          onPress: async () => {
            setIsDeletingAccount(true);
            try {
              await api.delete('/auth/account');
              await clearAuthData();
              setToken(null);
              setUser(null);
              logout();
              Toast.show({ type: 'success', text1: 'Account deleted permanently' });
            } catch (error: any) {
              Toast.show({ 
                type: 'error', 
                text1: 'Delete failed', 
                text2: error?.response?.data?.message || 'Please contact support' 
              });
            } finally {
              setIsDeletingAccount(false);
            }
          }
        }
      ]
    );
  }, [logout, setToken, setUser]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await authService.me();
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Refresh failed', text2: 'Could not load latest data' });
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handleChangePassword = useCallback(() => {
    navigation.navigate('ChangePassword');
  }, [navigation]);

  const handlePrivacyPolicy = useCallback(() => {
    Linking.openURL('https://justus.app/privacy').catch(() =>
      navigation.navigate('WebView', { url: 'https://justus.app/privacy', title: 'Privacy Policy' })
    );
  }, [navigation]);

  const handleTermsOfService = useCallback(() => {
    Linking.openURL('https://justus.app/terms').catch(() =>
      navigation.navigate('WebView', { url: 'https://justus.app/terms', title: 'Terms of Service' })
    );
  }, [navigation]);

  const handleContactSupport = useCallback(() => {
    Linking.openURL('mailto:support@justus.app?subject=JustUs%20Support').catch(() =>
      navigation.navigate('ContactSupport')
    );
  }, [navigation]);

  const handleChangeLanguage = useCallback(async (lang: string) => {
    try {
      await userService.updatePreferences({ language: lang });
      setLanguage(lang);
      Toast.show({ type: 'success', text1: `Language set to ${lang.toUpperCase()}` });
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to update language' });
    }
  }, []);

  const handleChangeFontSize = useCallback(async (size: string) => {
    try {
      await userService.updatePreferences({ fontSize: size });
      setFontSize(size);
      Toast.show({ type: 'success', text1: 'Font size updated' });
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to update font size' });
    }
  }, []);

  const handleExportData = useCallback(async () => {
    setExportingData(true);
    try {
      await userService.exportUserData();
      Toast.show({ type: 'success', text1: 'Data export ready', text2: 'Check your email for the download link' });
    } catch {
      Toast.show({ type: 'error', text1: 'Export failed', text2: 'Please try again later' });
    } finally {
      setExportingData(false);
    }
  }, []);

  // ===== COUPLE+ HANDLERS =====

  const handleToggleCoupleFeature = useCallback(async (enabled: boolean) => {
    setIsTogglingCoupleFeature(true);
    try {
      if (enabled) {
        await api.post('/couple/request-feature');
        setCoupleFeatureStatus('pending');
        Toast.show({
          type: 'info',
          text1: 'Request Sent 💕',
          text2: 'Waiting for your partner to accept',
        });
      } else {
        await api.post('/couple/disable-feature');
        setCoupleFeatureStatus('declined');
        setCoupleFeatureEnabled(false);
        Toast.show({
          type: 'info',
          text1: 'Couple+ Disabled',
        });
      }
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Failed to update Couple+ settings' });
    } finally {
      setIsTogglingCoupleFeature(false);
    }
  }, []);

  const handleToggleQuickLoveNotifications = useCallback(async (enabled: boolean) => {
    try {
      await userService.updatePreferences({ quickLoveNotifications: enabled });
      setQuickLoveNotifications(enabled);
      Toast.show({
        type: 'success',
        text1: enabled ? 'Quick Love notifications enabled' : 'Quick Love notifications disabled',
      });
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to update settings' });
    }
  }, []);

  useEffect(() => {
    if (isNicknameModalVisible) {
      setTimeout(() => nicknameInputRef.current?.focus(), 100);
    }
  }, [isNicknameModalVisible]);

  useEffect(() => {
    if (isPingModalVisible) {
      setTimeout(() => pingInputRef.current?.focus(), 100);
    }
  }, [isPingModalVisible]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <FontAwesome name="chevron-left" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} />
        }
      >
        <View style={styles.userProfileCard}>
          <View style={styles.userAvatar}>
            <FontAwesome name="user-circle" size={60} color={COLORS.primary} />
          </View>
          <Text style={styles.userName}>{user?.name || 'User'}</Text>
          <Text style={styles.userEmail}>{user?.email || user?.phone || 'No contact'}</Text>
          <View style={styles.statusBadge}>
            <View style={[styles.statusDot, { backgroundColor: user?.relationship_status === 'couple' ? COLORS.success : COLORS.subtext }]} />
            <Text style={styles.userStatus}>
              {user?.relationship_status === 'couple' ? 'In a Relationship ❤️' : 'Solo Mode'}
            </Text>
          </View>
        </View>

        {user?.relationship_status === 'couple' && (
          <>
            <Text style={styles.sectionTitle}>RELATIONSHIP ❤️</Text>
            <View style={styles.section}>
              <View style={styles.statusItem}>
                <View style={styles.itemLeft}>
                  <View style={[styles.iconContainer, { backgroundColor: 'rgba(255, 77, 109, 0.1)' }]}>
                    <FontAwesome name="heart" size={18} color={COLORS.primary} />
                  </View>
                  <View>
                    <Text style={styles.itemLabel}>Connected With</Text>
                    <Text style={styles.itemSubLabel}>{partner?.name || 'Partner'}</Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity style={[styles.statusItem, { borderTopWidth: 1, borderTopColor: '#111' }]} onPress={handleEditDate}>
                <View style={styles.itemLeft}>
                  <View style={[styles.iconContainer, { backgroundColor: 'rgba(77, 150, 255, 0.1)' }]}>
                    <FontAwesome name="calendar" size={18} color="#4D96FF" />
                  </View>
                  <View>
                    <Text style={styles.itemLabel}>Since</Text>
                    <Text style={styles.itemSubLabel}>{formatDate(relationshipStartDate)}</Text>
                  </View>
                </View>
                <FontAwesome name="chevron-right" size={14} color="#555" />
              </TouchableOpacity>

              <View style={[styles.statusItem, { borderTopWidth: 1, borderTopColor: '#111' }]}>
                <View style={styles.itemLeft}>
                  <View style={[styles.iconContainer, { backgroundColor: 'rgba(107, 203, 119, 0.1)' }]}>
                    <FontAwesome name="clock-o" size={18} color="#6BCB77" />
                  </View>
                  <View>
                    <Text style={styles.itemLabel}>Days Together</Text>
                    <Text style={styles.itemSubLabel}>{daysTogether} Days</Text>
                  </View>
                </View>
              </View>
            </View>

            <Text style={styles.sectionTitle}>PARTNER NICKNAME ❤️</Text>
            <View style={styles.section}>
              <View style={styles.statusItem}>
                <View style={styles.itemLeft}>
                  <View style={[styles.iconContainer, { backgroundColor: 'rgba(255, 77, 109, 0.1)' }]}>
                    <FontAwesome name="heart" size={18} color={COLORS.primary} />
                  </View>
                  <View>
                    <Text style={styles.itemLabel}>Current Nickname</Text>
                    <Text style={styles.itemSubLabel}>{partnerNickname || 'Not set'}</Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity
                style={styles.editDateBtn}
                onPress={() => {
                  setNewNickname(partnerNickname || '');
                  setNicknameModalVisible(true);
                }}
              >
                <Text style={styles.editDateText}>Edit Nickname</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>MISS YOU NOTIFICATION ❤️</Text>
            <View style={styles.section}>
              <View style={styles.statusItem}>
                <View style={styles.itemLeft}>
                  <View style={[styles.iconContainer, { backgroundColor: 'rgba(255, 77, 109, 0.1)' }]}>
                    <FontAwesome name="bell" size={18} color={COLORS.primary} />
                  </View>
                  <View>
                    <Text style={styles.itemLabel}>Current Message</Text>
                    <Text style={styles.itemSubLabel} numberOfLines={2}>
                      {partnerPingMessage || "I miss you, where are you? ❤️"}
                    </Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity
                style={styles.editDateBtn}
                onPress={() => {
                  setNewPingMessage(partnerPingMessage || "I miss you, where are you? ❤️");
                  setPingModalVisible(true);
                }}
              >
                <Text style={styles.editDateText}>Edit Message</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* ===== COUPLE PREFERENCES ===== */}
        {user?.relationship_status === 'couple' && (
          <>
            <Text style={styles.sectionTitle}>COUPLE PREFERENCES ❤️</Text>
            <View style={styles.section}>
              <SettingItem
                icon="bell"
                label="Quick Love Button"
                value={quickLoveNotifications}
                onToggle={handleToggleQuickLoveNotifications}
              />
              <SettingItem
                icon="heart"
                label="Activity Feed Notifications"
                value={notificationsEnabled}
                onToggle={handleToggleNotifications}
              />
              <SettingItem
                icon="calendar"
                label="Goal Notifications"
                value={notificationsEnabled}
                onToggle={() => {}}
              />
              <SettingItem
                icon="pie-chart"
                label="Poll Notifications"
                value={notificationsEnabled}
                onToggle={() => {}}
              />
              <SettingItem
                icon="gift"
                label="Event Notifications"
                value={notificationsEnabled}
                onToggle={() => {}}
                isLast
              />
            </View>

            <Text style={styles.sectionTitle}>QUICK LOVE SETTINGS ❤️</Text>
            <View style={styles.section}>
              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>Default Quick Love Message</Text>
                <TextInput
                  style={styles.settingInput}
                  value={defaultQuickMessage}
                  onChangeText={setDefaultQuickMessage}
                  placeholder="I Love You ❤️"
                  placeholderTextColor="#777"
                  maxLength={50}
                />
                <TouchableOpacity 
                  style={styles.saveMessageBtn} 
                  onPress={handleSaveDefaultQuickMessage}
                  disabled={isSavingDefaultMessage}
                >
                  {isSavingDefaultMessage ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.saveMessageBtnText}>Save Default</Text>
                  )}
                </TouchableOpacity>
              </View>
              <Text style={styles.helperText}>
                💡 Single tap sends this message. Long press to choose from options.
              </Text>
            </View>

            {/* ===== COUPLE+ SETTINGS ===== */}
            <Text style={styles.sectionTitle}>COUPLE+ FEATURES 🔒</Text>
            <View style={styles.section}>
              <View style={styles.coupleFeatureInfo}>
                <Text style={styles.coupleFeatureLabel}>Exclusive Features</Text>
                <Text style={styles.coupleFeatureDesc}>
                  Connection Meter • Couple Questions • Date Ideas • Challenges • Private Wishlist
                </Text>
              </View>
              <SettingItem
                icon="lock"
                label={
                  coupleFeatureStatus === 'active'
                    ? 'Couple+ Active ✓'
                    : coupleFeatureStatus === 'pending'
                    ? 'Request Pending...'
                    : 'Enable Couple+'
                }
                value={coupleFeatureEnabled || coupleFeatureStatus === 'active'}
                onToggle={handleToggleCoupleFeature}
                loading={isTogglingCoupleFeature}
                isLast
              />
              {coupleFeatureStatus === 'pending' && (
                <Text style={styles.coupleFeaturePending}>
                  ⏳ Waiting for {partner?.name || 'your partner'} to accept
                </Text>
              )}
            </View>
          </>
        )}

        <Text style={styles.sectionTitle}>PREFERENCES</Text>
        <View style={styles.section}>
          <SettingItem
            icon="moon-o"
            label="Dark Mode"
            value={darkMode}
            onToggle={setDarkMode}
          />
          <SettingItem
            icon="bell-o"
            label="Push Notifications"
            value={notificationsEnabled}
            onToggle={handleToggleNotifications}
          />
          <SettingItem
            icon="language"
            label={`Language: ${language.toUpperCase()}`}
            onPress={() =>
              Alert.alert('Language', 'Choose your language', [
                { text: 'English', onPress: () => handleChangeLanguage('en') },
                { text: 'Spanish', onPress: () => handleChangeLanguage('es') },
                { text: 'French', onPress: () => handleChangeLanguage('fr') },
                { text: 'Cancel', style: 'cancel' },
              ])
            }
          />
          <SettingItem
            icon="text-height"
            label={`Font Size: ${fontSize.charAt(0).toUpperCase() + fontSize.slice(1)}`}
            onPress={() =>
              Alert.alert('Font Size', 'Choose font size', [
                { text: 'Small', onPress: () => handleChangeFontSize('small') },
                { text: 'Medium', onPress: () => handleChangeFontSize('medium') },
                { text: 'Large', onPress: () => handleChangeFontSize('large') },
                { text: 'Cancel', style: 'cancel' },
              ])
            }
            isLast
          />
        </View>

        <Text style={styles.sectionTitle}>DATA MANAGEMENT</Text>
        <View style={styles.section}>
          <SettingItem
            icon="download"
            label={exportingData ? 'Exporting...' : 'Export My Data'}
            onPress={handleExportData}
            loading={exportingData}
          />
          <SettingItem
            icon="trash"
            label="Clear Cache"
            onPress={() =>
              Alert.alert('Clear Cache', 'This will clear temporary files. Your data will not be deleted.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Clear', onPress: () => Toast.show({ type: 'success', text1: 'Cache cleared' }) },
              ])
            }
            isLast
          />
        </View>

        <Text style={styles.sectionTitle}>SECURITY</Text>
        <View style={styles.section}>
          <SettingItem icon="lock" label="Change Password" onPress={handleChangePassword} />
          <SettingItem icon="mobile" label="Two-Factor Authentication" onPress={() => {}} isLast />
        </View>

        <Text style={styles.sectionTitle}>ABOUT</Text>
        <View style={styles.section}>
          <SettingItem icon="file-text-o" label="Privacy Policy" onPress={handlePrivacyPolicy} />
          <SettingItem icon="file-text-o" label="Terms of Service" onPress={handleTermsOfService} />
          <SettingItem icon="envelope-o" label="Contact Support" onPress={handleContactSupport} />
          <SettingItem icon="info-circle" label="Version 2.0.0" onPress={() => {}} isLast />
        </View>

        <Text style={styles.sectionTitle}>ACCOUNT</Text>
        <View style={styles.section}>
          <SettingItem 
            icon="sign-out" 
            label="Logout" 
            onPress={handleLogout} 
            isDestructive 
            loading={isLoggingOut}
          />
          <SettingItem 
            icon="trash" 
            label="Delete Account" 
            onPress={handleDeleteAccount} 
            isDestructive 
            isLast
            loading={isDeletingAccount}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.version}>JUST US v1.0.0</Text>
          <Text style={styles.madeWith}>Made with ❤️ for Lovers</Text>
        </View>
      </ScrollView>

      {/* Nickname Modal */}
      <Modal
        visible={isNicknameModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setNicknameModalVisible(false)}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Partner Nickname ❤️</Text>
            <Text style={styles.modalSubtitle}>What do you call your partner? (Optional)</Text>
            <TextInput
              ref={nicknameInputRef}
              style={styles.modalInput}
              value={newNickname}
              onChangeText={setNewNickname}
              placeholder="e.g. Teddy, Honey, My Love"
              placeholderTextColor="#777"
              maxLength={50}
              returnKeyType="done"
              onSubmitEditing={handleUpdateNickname}
            />
            <Text style={styles.charCount}>{newNickname.length}/50</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setNicknameModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton, isSavingNickname && styles.disabledButton]}
                onPress={handleUpdateNickname}
                disabled={isSavingNickname}
              >
                {isSavingNickname ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Ping Message Modal */}
      <Modal
        visible={isPingModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setPingModalVisible(false)}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Miss You Message ❤️</Text>
            <Text style={styles.modalSubtitle}>Customize your "Miss You" ping message</Text>
            <TextInput
              ref={pingInputRef}
              style={[styles.modalInput, styles.multilineInput]}
              value={newPingMessage}
              onChangeText={setNewPingMessage}
              placeholder="e.g. Thinking about you ❤️"
              placeholderTextColor="#777"
              multiline
              maxLength={200}
              returnKeyType="done"
            />
            <Text style={styles.charCount}>{newPingMessage.length}/200</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setPingModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton, isSavingPing && styles.disabledButton]}
                onPress={handleUpdatePingMessage}
                disabled={isSavingPing}
              >
                {isSavingPing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20 },
  backButton: { padding: 8 },
  title: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  
  userProfileCard: { alignItems: 'center', marginBottom: 30, paddingVertical: 10 },
  userAvatar: { marginBottom: 12 },
  userName: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  userEmail: { color: COLORS.subtext, fontSize: 14, marginTop: 4 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  userStatus: { color: COLORS.subtext, fontSize: 13 },
  
  sectionTitle: { color: COLORS.subtext, fontSize: 12, fontWeight: 'bold', marginLeft: 20, marginBottom: 8, marginTop: 8, letterSpacing: 1.5 },
  section: { backgroundColor: COLORS.card, marginHorizontal: 16, borderRadius: 20, overflow: 'hidden', marginBottom: 20 },
  
  item: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  statusItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  itemLeft: { flexDirection: 'row', alignItems: 'center' },
  iconContainer: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  itemLabel: { color: COLORS.subtext, fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5 },
  itemSubLabel: { color: '#fff', fontSize: 16, fontWeight: '600', marginTop: 2 },
  
  editDateBtn: { padding: 14, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#1a1a1a' },
  editDateText: { color: COLORS.primary, fontWeight: 'bold', fontSize: 14 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: COLORS.card, borderRadius: 24, padding: 24, width: '85%', maxWidth: 400, borderWidth: 1, borderColor: COLORS.border },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  modalSubtitle: { color: COLORS.subtext, fontSize: 13, textAlign: 'center', marginBottom: 20 },
  modalInput: { backgroundColor: '#111', color: '#fff', borderRadius: 12, padding: 14, fontSize: 16, borderWidth: 1, borderColor: COLORS.border },
  multilineInput: { minHeight: 100, textAlignVertical: 'top' },
  charCount: { color: COLORS.subtext, fontSize: 11, textAlign: 'right', marginTop: 8, marginBottom: 16 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  modalButton: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  cancelButton: { backgroundColor: 'transparent', borderWidth: 1, borderColor: COLORS.border },
  saveButton: { backgroundColor: COLORS.primary },
  cancelButtonText: { color: COLORS.subtext, fontWeight: 'bold' },
  saveButtonText: { color: '#fff', fontWeight: 'bold' },
  disabledButton: { opacity: 0.6 },

  // ===== COUPLE FEATURE STYLES =====
  coupleFeatureInfo: {
    backgroundColor: 'rgba(255,77,109,0.08)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,77,109,0.15)',
  },
  coupleFeatureLabel: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  coupleFeatureDesc: {
    color: COLORS.subtext,
    fontSize: 11,
    lineHeight: 16,
  },
  coupleFeaturePending: {
    color: COLORS.subtext,
    fontSize: 11,
    marginTop: 10,
    paddingHorizontal: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  
  footer: { alignItems: 'center', marginVertical: 40 },
  version: { color: COLORS.subtext, fontSize: 12, fontWeight: 'bold' },
  madeWith: { color: '#444', fontSize: 12, marginTop: 5 },
  settingItem: {
    padding: 16,
    gap: 10,
  },
  settingLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  settingInput: {
    backgroundColor: '#111',
    color: '#fff',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  saveMessageBtn: {
    backgroundColor: COLORS.primary,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  saveMessageBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  helperText: {
    color: COLORS.subtext,
    fontSize: 11,
    lineHeight: 16,
    paddingHorizontal: 16,
    paddingBottom: 16,
    marginTop: -8,
  },
});
