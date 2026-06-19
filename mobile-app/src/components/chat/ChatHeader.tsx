import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';

interface ChatHeaderProps {
  partnerName: string;
  isOnline: boolean;
  lastSeen?: string | Date | null;
  onSearch?: () => void;
  onCall?: () => void;
  isTyping?: boolean;
  unreadCount?: number;
  onMute?: () => void;
  isMuted?: boolean;
  onPinMessages?: () => void;
  onSavedMessages?: () => void;
  onSelectMessages?: () => void;
  isSelectionMode?: boolean;
  selectedCount?: number;
  onDeleteSelected?: () => void;
}

function formatLastSeen(lastSeenDateStr?: string | Date | null): string {
  if (!lastSeenDateStr) return 'Offline';
  try {
    const lastSeen = new Date(lastSeenDateStr);
    if (isNaN(lastSeen.getTime())) return 'Offline';

    const now = new Date();
    const diffMs = now.getTime() - lastSeen.getTime();

    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Away (just now)';
    if (mins < 60) return `Away (${mins}m ago)`;

    const hours = Math.floor(mins / 60);
    if (hours < 24) return `Away (${hours}h ago)`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `Away (${days}d ago)`;

    return `Last seen ${lastSeen.toLocaleDateString()}`;
  } catch {
    return 'Offline';
  }
}

export const ChatHeader = ({
  partnerName,
  isOnline,
  lastSeen,
  onSearch,
  onCall,
  isTyping,
  unreadCount = 0,
  onMute,
  isMuted = false,
  onPinMessages,
  onSavedMessages,
  onSelectMessages,
  isSelectionMode = false,
  selectedCount = 0,
  onDeleteSelected,
}: ChatHeaderProps) => {
  if (isSelectionMode) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.left}>
            <TouchableOpacity style={styles.iconBtn} onPress={onSelectMessages}>
              <FontAwesome name="arrow-left" size={18} color="#fff" />
            </TouchableOpacity>
            <Text style={[styles.name, { marginLeft: 15 }]}>{selectedCount} Selected</Text>
          </View>
          <View style={styles.right}>
            {onDeleteSelected && selectedCount > 0 && (
              <TouchableOpacity style={styles.iconBtn} onPress={onDeleteSelected}>
                <FontAwesome name="trash" size={18} color="#ff4444" />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.iconBtn} onPress={onSelectMessages}>
              <FontAwesome name="times" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.left}>
          <TouchableOpacity style={styles.avatar}>
            <FontAwesome name="user" size={18} color={COLORS.subtext} />
          </TouchableOpacity>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.name}>{partnerName}</Text>
              {isMuted && <FontAwesome name="volume-off" size={12} color={COLORS.subtext} />}
            </View>
            <View style={styles.statusRow}>
              <View style={[
                styles.statusDot, 
                isOnline && styles.statusDotOnline,
                isTyping && styles.statusDotTyping
              ]} />
              <Text style={[
                styles.status, 
                isOnline && styles.onlineText,
                isTyping && styles.typingTextHeader
              ]}>
                {isTyping ? 'typing...' : isOnline ? 'Online now ❤️' : formatLastSeen(lastSeen)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.right}>
          {onSearch && (
            <TouchableOpacity style={styles.iconBtn} onPress={onSearch}>
              <FontAwesome name="search" size={16} color="#fff" />
            </TouchableOpacity>
          )}
          {onPinMessages && (
            <TouchableOpacity style={styles.iconBtn} onPress={onPinMessages}>
              <FontAwesome name="thumb-tack" size={16} color="#fff" />
            </TouchableOpacity>
          )}
          {onSavedMessages && (
            <TouchableOpacity style={styles.iconBtn} onPress={onSavedMessages}>
              <FontAwesome name="bookmark" size={16} color="#fff" />
            </TouchableOpacity>
          )}
          {onSelectMessages && (
            <TouchableOpacity style={styles.iconBtn} onPress={onSelectMessages}>
              <FontAwesome name="check-square-o" size={16} color="#fff" />
            </TouchableOpacity>
          )}
          {onMute && (
            <TouchableOpacity style={styles.iconBtn} onPress={onMute}>
              <FontAwesome name={isMuted ? "bell-slash" : "bell"} size={16} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: Platform.OS === 'android' ? 30 : 0,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  name: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: COLORS.subtext,
  },
  statusDotOnline: {
    backgroundColor: COLORS.success,
  },
  statusDotTyping: {
    backgroundColor: COLORS.primary,
  },
  status: {
    color: COLORS.subtext,
    fontSize: 12,
  },
  onlineText: {
    color: COLORS.success,
  },
  typingTextHeader: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    marginLeft: 15,
    padding: 6,
  },
});
