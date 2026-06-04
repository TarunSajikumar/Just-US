import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { COLORS } from '../../theme/colors';
import { FontAwesome } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { timelineService, TimelineEvent } from '../../services/timelineService';

export default function TimelineScreen() {
  const { user } = useAuthStore();
  const coupleId = user?.couple_id;

  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchEvents = useCallback(async (silent = false) => {
    if (!coupleId) {
      setIsLoading(false);
      return;
    }
    if (!silent) setIsLoading(true);
    try {
      const data = await timelineService.getEvents(coupleId);
      setEvents(data);
    } catch (err) {
      console.error('Failed to load timeline events:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [coupleId]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchEvents(true);
  };

  const renderEvent = ({ item, index }: { item: TimelineEvent; index: number }) => {
    const isLast = index === events.length - 1;
    const date = new Date(item.date);

    return (
      <View style={styles.eventContainer}>
        {/* The Vertical Line */}
        <View style={styles.lineColumn}>
          <View style={styles.dot} />
          {!isLast && <View style={styles.line} />}
        </View>

        {/* The Event Content */}
        <View style={styles.contentColumn}>
          <Text style={styles.eventDate}>
            {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </Text>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.eventTitle}>{item.title}</Text>
              {item.type === 'milestone' && (
                <FontAwesome name="star" size={16} color={COLORS.primary} />
              )}
            </View>
            {item.description ? (
              <Text style={styles.eventDesc}>{item.description}</Text>
            ) : null}
          </View>
        </View>
      </View>
    );
  };

  if (!coupleId) {
    return (
      <View style={[styles.container, styles.centered]}>
        <FontAwesome name="clock-o" size={48} color={COLORS.primary} />
        <Text style={styles.emptyTitle}>No Timeline Yet</Text>
        <Text style={styles.emptyText}>Connect with your partner to build your shared timeline ❤️</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Our Journey ⏳</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => Alert.alert('Coming Soon', 'Manual event creation is coming in the next update!')}
        >
          <FontAwesome name="plus" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          renderItem={renderEvent}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.centered}>
              <FontAwesome name="calendar-o" size={48} color={COLORS.border} />
              <Text style={styles.emptyTitle}>The Beginning...</Text>
              <Text style={styles.emptyText}>Your journey is just starting. Memories and milestones will appear here!</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  eventContainer: {
    flexDirection: 'row',
  },
  lineColumn: {
    width: 20,
    alignItems: 'center',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
    zIndex: 1,
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: '#333',
    marginVertical: 2,
  },
  contentColumn: {
    flex: 1,
    paddingLeft: 20,
    paddingBottom: 30,
  },
  eventDate: {
    color: COLORS.subtext,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 15,
    padding: 15,
    borderWidth: 1,
    borderColor: '#222',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  eventTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  eventDesc: {
    color: COLORS.subtext,
    fontSize: 14,
    lineHeight: 20,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    color: COLORS.subtext,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
});
