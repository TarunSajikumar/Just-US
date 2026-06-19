import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { COLORS } from '../../theme/colors';
import { Activity } from '../../services/activityService';
import { FontAwesome } from '@expo/vector-icons';

interface ActivityFeedCardProps {
  activities: Activity[];
}

const getActionIcon = (type: string) => {
  switch (type) {
    case 'mood_updated': return 'smile-o';
    case 'goal_created': return 'bullseye';
    case 'goal_updated': return 'line-chart';
    case 'goal_completed': return 'trophy';
    case 'poll_created': return 'list-ul';
    case 'poll_voted': return 'check-square-o';
    case 'love_note_sent': return 'envelope-o';
    case 'memory_added': return 'camera';
    case 'timeline_added': return 'calendar';
    case 'miss_you_ping': return 'bell-o';
    case 'event_created': return 'calendar-plus-o';
    default: return 'circle-o';
  }
};

const getActionIconColor = (type: string): string => {
  switch (type) {
    case 'goal_completed': return '#FFD700';
    case 'love_note_sent': return '#FF4D8D';
    case 'miss_you_ping': return '#FF85A1';
    case 'memory_added': return '#4D96FF';
    case 'event_created': return '#9B5DE5';
    default: return COLORS.primary;
  }
};

const getActionText = (activity: Activity) => {
  const actor = activity.actorId?.name || 'Partner';
  const details = activity.details || {};

  switch (activity.actionType) {
    case 'mood_updated': return `${actor} is feeling ${details.mood}`;
    case 'goal_created': return `${actor} created goal: ${details.title}`;
    case 'goal_updated': return `${actor} updated progress for ${details.title}`;
    case 'goal_completed': return `🏆 Goal Completed: ${details.title}!`;
    case 'poll_created': return `${actor} started a poll: "${details.question}"`;
    case 'poll_voted': return `${actor} voted in a poll`;
    case 'love_note_sent': return `${actor} sent a love note 💌`;
    case 'memory_added': return `${actor} added a new memory 📸`;
    case 'timeline_added': return `${actor} added to the timeline`;
    case 'miss_you_ping': return `${actor} sent a "Miss You" ping ❤️`;
    case 'event_created': return `${actor} added event: ${details.title}`;
    default: return 'Something happened';
  }
};

function getRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;

  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function AnimatedActivityItem({ activity, index }: { activity: Activity; index: number }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateAnim = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        delay: index * 80,
        useNativeDriver: true,
      }),
      Animated.timing(translateAnim, {
        toValue: 0,
        duration: 350,
        delay: index * 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const iconColor = getActionIconColor(activity.actionType);

  return (
    <Animated.View
      style={[
        styles.item,
        { opacity: fadeAnim, transform: [{ translateY: translateAnim }] },
        index === 0 && { marginTop: 10 },
      ]}
    >
      <View style={[styles.iconCircle, { backgroundColor: `${iconColor}18` }]}>
        <FontAwesome
          name={getActionIcon(activity.actionType) as any}
          size={14}
          color={iconColor}
        />
      </View>
      <View style={styles.textContent}>
        <Text style={styles.actionText}>{getActionText(activity)}</Text>
        <Text style={styles.timeText}>{getRelativeTime(activity.createdAt)}</Text>
      </View>
    </Animated.View>
  );
}

const ActivityFeedCard: React.FC<ActivityFeedCardProps> = ({ activities }) => {
  if (activities.length === 0) return null;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Recent Activity ⚡</Text>
      {activities.slice(0, 6).map((activity, index) => (
        <AnimatedActivityItem key={activity._id} activity={activity} index={index} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 6,
  },
  title: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  textContent: {
    flex: 1,
  },
  actionText: {
    color: '#f0f0f0',
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
    letterSpacing: 0.2,
  },
  timeText: {
    color: COLORS.subtext,
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
  },
});

export default ActivityFeedCard;
