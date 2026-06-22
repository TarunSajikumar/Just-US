import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ActivityIndicator,
} from 'react-native';
import { useAuthStore } from '../store/authStore';
import { socket } from '../services/socket';

interface OnlineStatusProps {
  partnerId?: string;
  compact?: boolean;
}

export function OnlineStatusComponent({ partnerId, compact }: OnlineStatusProps) {
  const { partner } = useAuthStore();
  const [isOnline, setIsOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for status changes from socket
    const handleStatusChange = (data: any) => {
      if (data.userId === (partnerId || partner?._id)) {
        setIsOnline(data.status === 'online');
        if (data.lastSeen) {
          setLastSeen(new Date(data.lastSeen));
        }
      }
    };

    socket.on('user_status_change', handleStatusChange);
    setLoading(false);

    return () => {
      socket.off('user_status_change', handleStatusChange);
    };
  }, [partnerId, partner]);

  if (loading) {
    return (
      <View style={[styles.container, compact && styles.compact]}>
        <ActivityIndicator size="small" color="#e94560" />
      </View>
    );
  }

  const getLastSeenText = () => {
    if (!lastSeen) return '';

    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - lastSeen.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    }

    if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    }

    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    }

    return lastSeen.toLocaleDateString();
  };

  return (
    <View style={[styles.container, compact && styles.compact]}>
      <View
        style={[
          styles.indicator,
          isOnline ? styles.indicatorOnline : styles.indicatorOffline,
        ]}
      />
      <Text
        style={[
          styles.text,
          compact && styles.compactText,
          isOnline ? styles.textOnline : styles.textOffline,
        ]}
      >
        {isOnline ? 'Online' : `Last seen ${getLastSeenText()}`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  compact: {
    gap: 4,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  indicatorOnline: {
    backgroundColor: '#4caf50',
  },
  indicatorOffline: {
    backgroundColor: '#999',
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
  },
  compactText: {
    fontSize: 12,
  },
  textOnline: {
    color: '#4caf50',
  },
  textOffline: {
    color: '#aaa',
  },
});
