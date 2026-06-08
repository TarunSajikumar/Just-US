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
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    paddingBottom: 8,
  },
  activeTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  addEventLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 77, 109, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  addLinkText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: 'bold',
  },
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 77, 109, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyText: {
    color: COLORS.subtext,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18,
    paddingHorizontal: 20,
  },
  gradientBtn: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  btnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  btnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  emojiCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  emoji: {
    fontSize: 18,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  eventDate: {
    color: COLORS.subtext,
    fontSize: 11,
  },
  daysLeftBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    minWidth: 46,
  },
  daysLeftValue: {
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 16,
  },
  daysLeftLabel: {
    color: COLORS.subtext,
    fontSize: 8,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  hintText: {
    color: COLORS.subtext,
    fontSize: 10,
    textAlign: 'center',
    marginTop: 8,
    opacity: 0.5,
    fontStyle: 'italic',
  },
});

export default UpcomingEventsCard;
