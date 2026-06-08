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
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeUnit: {
    alignItems: 'center',
    minWidth: 38,
  },
  timeVal: {
    color: COLORS.secondary,
    fontSize: 20,
    fontWeight: 'bold',
  },
  timeLabel: {
    color: COLORS.subtext,
    fontSize: 8,
    textTransform: 'uppercase',
    fontWeight: '700',
    marginTop: 1,
  },
  separator: {
    color: COLORS.border,
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 6,
    marginTop: -8,
  },
});
