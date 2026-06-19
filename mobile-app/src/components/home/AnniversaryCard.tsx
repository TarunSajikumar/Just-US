import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../theme/colors';
import { FontAwesome } from '@expo/vector-icons';

interface AnniversaryCardProps {
  anniversaryDate: string | null;
}

export default function AnniversaryCard({ anniversaryDate }: AnniversaryCardProps) {
  if (!anniversaryDate) return null;

  const getCountdown = () => {
    const anniversary = new Date(anniversaryDate);
    const now = new Date();

    // Set target anniversary to this year
    const target = new Date(anniversary);
    target.setFullYear(now.getFullYear());
    target.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // If anniversary has already passed this year, look at next year
    if (target.getTime() < today.getTime()) {
      target.setFullYear(now.getFullYear() + 1);
    }

    const diffMs = target.getTime() - today.getTime();
    const daysLeft = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

    const formattedTarget = target.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    return { daysLeft, formattedTarget };
  };

  const { daysLeft, formattedTarget } = getCountdown();

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <FontAwesome name="heart" size={16} color={COLORS.primary} style={{ marginRight: 8 }} />
          <Text style={styles.title}>Anniversary</Text>
        </View>
        <Text style={styles.date}>{formattedTarget}</Text>
      </View>
      <View style={styles.countdownContainer}>
        <Text style={styles.daysValue}>{daysLeft}</Text>
        <Text style={styles.daysLabel}>Days Left</Text>
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
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  title: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  date: {
    color: COLORS.subtext,
    fontSize: 12,
    fontWeight: '500',
  },
  countdownContainer: {
    alignItems: 'flex-end',
    backgroundColor: 'rgba(255, 77, 109, 0.12)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 77, 109, 0.25)',
    shadowColor: '#FF4D8D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  daysValue: {
    color: COLORS.primary,
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 28,
  },
  daysLabel: {
    color: COLORS.subtext,
    fontSize: 9,
    fontWeight: '600',
    marginTop: 2,
    textTransform: 'uppercase',
  },
});
