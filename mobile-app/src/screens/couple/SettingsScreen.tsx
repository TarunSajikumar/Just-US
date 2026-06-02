import React, { useState } from 'react';
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
} from 'react-native';
import { COLORS } from '../../theme/colors';
import { FontAwesome } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { clearAuthData } from '../../store/authStore';
import { authService } from '../../services/authService';
import { userService } from '../../services/userService';

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
  const [newNickname, setNewNickname] = useState(partnerNickname);
  const [newPingMessage, setNewPingMessage] = useState(partnerPingMessage);

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getDaysTogether = (dateString?: string | null) => {
    if (!dateString) return 0;
    const start = new Date(dateString);
    start.setHours(0, 0, 0, 0);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const diffMs = now.getTime() - start.getTime();
    return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  };

  const handleEditDate = () => {
    navigation.navigate('EditRelationshipDate');
  };

  const handleUpdateNickname = async () => {
    try {
      await userService.updatePartnerNickname(newNickname);
      setPartnerNickname(newNickname);
      setNicknameModalVisible(false);
      Alert.alert('Success', 'Partner nickname updated! ❤️');
    } catch (e) {
      Alert.alert('Error', 'Failed to update nickname');
    }
  };

  const handleUpdatePingMessage = async () => {
    try {
      await userService.updatePingMessage(newPingMessage);
      setPartnerPingMessage(newPingMessage);
      setPingModalVisible(false);
      Alert.alert('Success', 'Miss You message updated! ❤️');
    } catch (e) {
      Alert.alert('Error', 'Failed to update message');
    }
  };

  const handleToggleNotifications = async (value: boolean) => {
    try {
      await userService.updateNotificationSettings(value);
      setNotificationsEnabled(value);
    } catch (e) {
      Alert.alert('Error', 'Failed to update notification settings');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout? ❤️",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              console.log('Starting logout...');
              // Clear auth data from storage
              await clearAuthData();
              console.log('Auth data cleared');
              
              // Clear store state
              setToken(null);
              setUser(null);
              logout();
              console.log('Logout completed, token cleared');
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This action is permanent and will delete all your shared memories. 🥺",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => {} }
      ]
    );
  };

  const SettingItem = ({ icon, label, value, onToggle, isLast, isDestructive, onPress }: any) => (
    <TouchableOpacity
      style={[styles.item, isLast && { borderBottomWidth: 0 }]}
      onPress={onPress}
      disabled={onToggle !== undefined}
    >
      <View style={styles.itemLeft}>
        <View style={[styles.iconContainer, isDestructive && { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
          <FontAwesome name={icon} size={18} color={isDestructive ? COLORS.danger : COLORS.primary} />
        </View>
        <Text style={[styles.itemLabel, isDestructive && { color: COLORS.danger }]}>{label}</Text>
      </View>
      {onToggle !== undefined ? (
        <Switch
          value={value}
          onValueChange={onToggle}
          trackColor={{ false: '#333', true: COLORS.primary }}
        />
      ) : (
        <FontAwesome name="chevron-right" size={14} color="#333" />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ width: 40 }} />
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.userProfileCard}>
          <View style={styles.userAvatar}>
            <FontAwesome name="user-circle" size={50} color={COLORS.primary} />
          </View>
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.userEmail}>Relationship Status: {user?.relationship_status === 'couple' ? 'Couple ❤️' : 'Solo'}</Text>
        </View>

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

          <View style={[styles.statusItem, { borderTopWidth: 1, borderTopColor: '#111' }]}>
            <View style={styles.itemLeft}>
              <View style={[styles.iconContainer, { backgroundColor: 'rgba(77, 150, 255, 0.1)' }]}>
                <FontAwesome name="calendar" size={18} color="#4D96FF" />
              </View>
              <View>
                <Text style={styles.itemLabel}>Since</Text>
                <Text style={styles.itemSubLabel}>{formatDate(relationshipStartDate)}</Text>
              </View>
            </View>
          </View>

          <View style={[styles.statusItem, { borderTopWidth: 1, borderTopColor: '#111' }]}>
            <View style={styles.itemLeft}>
              <View style={[styles.iconContainer, { backgroundColor: 'rgba(107, 203, 119, 0.1)' }]}>
                <FontAwesome name="clock-o" size={18} color="#6BCB77" />
              </View>
              <View>
                <Text style={styles.itemLabel}>Days Together</Text>
                <Text style={styles.itemSubLabel}>{getDaysTogether(relationshipStartDate)} Days</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.editDateBtn} onPress={handleEditDate}>
            <Text style={styles.editDateText}>Edit Date</Text>
          </TouchableOpacity>
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
              setNewNickname(partnerNickname);
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
                <Text style={styles.itemSubLabel}>{partnerPingMessage}</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity
            style={styles.editDateBtn}
            onPress={() => {
              setNewPingMessage(partnerPingMessage);
              setPingModalVisible(true);
            }}
          >
            <Text style={styles.editDateText}>Edit Message</Text>
          </TouchableOpacity>
        </View>

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
            isLast
          />
        </View>

        <Text style={styles.sectionTitle}>PRIVACY & SECURITY</Text>
        <View style={styles.section}>
          <SettingItem icon="lock" label="Vault Security" onPress={() => {}} />
          <SettingItem icon="eye-slash" label="Incognito Mode" onPress={() => {}} isLast />
        </View>

        <Text style={styles.sectionTitle}>ACCOUNT</Text>
        <View style={styles.section}>
          <SettingItem icon="sign-out" label="Logout" onPress={handleLogout} isDestructive />
          <SettingItem icon="trash" label="Delete Account" onPress={handleDeleteAccount} isDestructive isLast />
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
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Partner Nickname ❤️</Text>
            <TextInput
              style={styles.modalInput}
              value={newNickname}
              onChangeText={setNewNickname}
              placeholder="e.g. Teddy"
              placeholderTextColor="#777"
              autoFocus={true}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setNicknameModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleUpdateNickname}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Ping Message Modal */}
      <Modal
        visible={isPingModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setPingModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Miss You Message ❤️</Text>
            <TextInput
              style={styles.modalInput}
              value={newPingMessage}
              onChangeText={setNewPingMessage}
              placeholder="e.g. Thinking about you ❤️"
              placeholderTextColor="#777"
              autoFocus={true}
              multiline={true}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setPingModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleUpdatePingMessage}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 25, marginBottom: 30 },
  title: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  userProfileCard: { alignItems: 'center', marginBottom: 30, paddingVertical: 10 },
  userAvatar: { marginBottom: 15 },
  userName: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  userEmail: { color: COLORS.subtext, fontSize: 14, marginTop: 4 },
  sectionTitle: { color: COLORS.subtext, fontSize: 12, fontWeight: 'bold', marginLeft: 25, marginBottom: 10, letterSpacing: 1.5 },
  section: { backgroundColor: COLORS.card, marginHorizontal: 20, borderRadius: 20, overflow: 'hidden', marginBottom: 25 },
  item: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18, borderBottomWidth: 1, borderBottomColor: '#111' },
  statusItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18 },
  itemLeft: { flexDirection: 'row', alignItems: 'center' },
  iconContainer: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255, 77, 109, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  itemLabel: { color: COLORS.subtext, fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5 },
  itemSubLabel: { color: '#fff', fontSize: 16, fontWeight: '600', marginTop: 2 },
  itemDetail: { color: COLORS.subtext, fontSize: 13, marginTop: 2 },
  editDateBtn: {
    padding: 15,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#111',
  },
  editDateText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 14,
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
    padding: 30,
    width: '85%',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: '#111',
    color: '#fff',
    borderRadius: 12,
    padding: 15,
    fontSize: 18,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    marginRight: 10,
    backgroundColor: 'transparent',
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
  footer: { alignItems: 'center', marginVertical: 40 },
  version: { color: COLORS.subtext, fontSize: 12, fontWeight: 'bold' },
  madeWith: { color: '#444', fontSize: 12, marginTop: 5 }
});
