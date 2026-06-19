import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { COLORS } from '../../theme/colors';
import { FontAwesome } from '@expo/vector-icons';
import { CoupleEvent, eventService } from '../../services/eventService';
import { LinearGradient } from 'expo-linear-gradient';

interface UpcomingEventsCardProps {
  events: CoupleEvent[];
  onAddEvent: () => void;
  onRefresh: () => void;
}

function getDaysLeft(dateStr: string): number {
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = target.getTime() - today.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

const EVENT_TYPE_COLORS: Record<string, string> = {
  anniversary: '#FF4D8D',
  trip: '#4D96FF',
  date: '#FF9F43',
  milestone: '#FFD700',
  custom: '#9B5DE5',
};

const UpcomingEventsCard: React.FC<UpcomingEventsCardProps> = ({
  events,
  onAddEvent,
  onRefresh,
}) => {
  const handleDelete = (eventId: string, title: string) => {
    Alert.alert('Remove Event', `Remove "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await eventService.deleteEvent(eventId);
            onRefresh();
          } catch (_) {}
        },
      },
    ]);
  };

  if (events.length === 0) {
    return (
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.activeTitle}>Upcoming Events</Text>
          <TouchableOpacity style={styles.addEventLink} onPress={onAddEvent}>
            <FontAwesome name="plus-circle" size={14} color={COLORS.primary} style={{ marginRight: 4 }} />
            <Text style={styles.addLinkText}>Add New</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.emptyStateContainer}>
          <View style={styles.iconCircle}>
            <FontAwesome name="calendar" size={32} color={COLORS.primary} />
          </View>
          <Text style={styles.emptyText}>No upcoming events yet.</Text>
          <TouchableOpacity style={styles.gradientBtn} onPress={onAddEvent}>
            <LinearGradient
              colors={[COLORS.primary, '#C23576']}
              style={styles.btnGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.btnText}>Plan Something Special ✨</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.activeTitle}>Upcoming Events</Text>
        <TouchableOpacity style={styles.addEventLink} onPress={onAddEvent}>
          <FontAwesome name="plus-circle" size={14} color={COLORS.primary} style={{ marginRight: 4 }} />
          <Text style={styles.addLinkText}>Add New</Text>
        </TouchableOpacity>
      </View>

      {events.slice(0, 5).map((event) => {
        const daysLeft = getDaysLeft(event.eventDate);
        const accentColor = EVENT_TYPE_COLORS[event.eventType] || COLORS.primary;
        const isToday = daysLeft === 0;

        return (
          <TouchableOpacity
            key={event._id}
            style={styles.eventItem}
            onLongPress={() => handleDelete(event._id, event.title)}
            activeOpacity={0.8}
          >
            <View style={[styles.emojiCircle, { backgroundColor: `${accentColor}18` }]}>
              <Text style={styles.emoji}>{event.emoji || '📅'}</Text>
            </View>
            <View style={styles.eventInfo}>
              <Text style={styles.eventTitle} numberOfLines={1}>{event.title}</Text>
              <Text style={styles.eventDate}>{formatDate(event.eventDate)}</Text>
            </View>
            <View style={[styles.daysLeftBadge, { backgroundColor: `${accentColor}15`, borderColor: `${accentColor}40` }]}>
              {isToday ? (
                <Text style={[styles.daysLeftValue, { color: accentColor, fontSize: 10 }]}>TODAY</Text>
              ) : (
                <>
                  <Text style={[styles.daysLeftValue, { color: accentColor }]}>{daysLeft}</Text>
                  <Text style={styles.daysLeftLabel}>days</Text>
                </>
              )}
            </View>
          </TouchableOpacity>
        );
      })}

      <Text style={styles.hintText}>Long-press an event to remove it</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    paddingBottom: 12,
  },
  activeTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  addEventLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 77, 109, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 109, 0.2)',
  },
  addLinkText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '600',
  },
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 77, 109, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 77, 109, 0.2)',
  },
  emptyText: {
    color: COLORS.subtext,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  gradientBtn: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  btnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  btnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
    letterSpacing: 0.3,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
  },
  emojiCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  emoji: {
    fontSize: 20,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 3,
    letterSpacing: 0.2,
  },
  eventDate: {
    color: COLORS.subtext,
    fontSize: 12,
    fontWeight: '400',
  },
  daysLeftBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    minWidth: 50,
  },
  daysLeftValue: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 16,
  },
  daysLeftLabel: {
    color: COLORS.subtext,
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  hintText: {
    color: COLORS.subtext,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 12,
    opacity: 0.6,
    fontStyle: 'italic',
  },
});

export default UpcomingEventsCard;
