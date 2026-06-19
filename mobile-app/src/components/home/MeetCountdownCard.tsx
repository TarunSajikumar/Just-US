import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../theme/colors';
import { FontAwesome } from '@expo/vector-icons';

interface MeetCountdownCardProps {
  nextMeetDate: string | null;
}

export default function MeetCountdownCard({ nextMeetDate }: MeetCountdownCardProps) {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; passed: boolean } | null>(null);

  useEffect(() => {
    if (!nextMeetDate) {
      setTimeLeft(null);
      return;
    }

    const updateCountdown = () => {
      const target = new Date(nextMeetDate);
      const now = new Date();

      const diffMs = target.getTime() - now.getTime();
      if (diffMs <= 0) {
        setTimeLeft({ days: 0, hours: 0, passed: true });
        return;
      }

      const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
      const days = Math.floor(totalHours / 24);
      const hours = totalHours % 24;

      setTimeLeft({ days, hours, passed: false });
    };

    updateCountdown();

    // Check/refresh every 60 seconds
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, [nextMeetDate]);

  if (!nextMeetDate || !timeLeft) return null;
  if (timeLeft.passed) return null; // Hide or show "Enjoy your date!" if passed

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <FontAwesome name="calendar-check-o" size={16} color={COLORS.secondary} style={{ marginRight: 8 }} />
        <Text style={styles.title}>Meet In</Text>
      </View>
      <View style={styles.timeRow}>
        <View style={styles.timeUnit}>
          <Text style={styles.timeVal}>{timeLeft.days}</Text>
          <Text style={styles.timeLabel}>Days</Text>
        </View>
        <Text style={styles.separator}>:</Text>
        <View style={styles.timeUnit}>
          <Text style={styles.timeVal}>{timeLeft.hours}</Text>
          <Text style={styles.timeLabel}>Hours</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeUnit: {
    alignItems: 'center',
    minWidth: 44,
    backgroundColor: 'rgba(255, 61, 87, 0.12)',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 61, 87, 0.25)',
  },
  timeVal: {
    color: COLORS.secondary,
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 26,
  },
  timeLabel: {
    color: COLORS.subtext,
    fontSize: 9,
    textTransform: 'uppercase',
    fontWeight: '600',
    marginTop: 2,
  },
  separator: {
    color: COLORS.border,
    fontSize: 20,
    fontWeight: '700',
    marginHorizontal: 8,
    marginTop: -8,
  },
});
