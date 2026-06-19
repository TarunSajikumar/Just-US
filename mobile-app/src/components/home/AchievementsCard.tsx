import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../../theme/colors';
import { FontAwesome } from '@expo/vector-icons';

interface AchievementsCardProps {
  unlockedCodes: string[];
  onSeeAllPress: () => void;
}

const CORE_ACHIEVEMENTS = [
  { code: 'FIRST_CONNECTION', title: 'First Connection', icon: '🔗', description: 'Connected with your partner' },
  { code: 'FIRST_MEMORY', title: 'First Memory', icon: '📸', description: 'Shared your first photo' },
  { code: '100_DAYS', title: '100 Days Together', icon: '💯', description: 'Reached 100 days in love' },
  { code: 'FIRST_GOAL', title: 'Goal Setters', icon: '🎯', description: 'Created your first shared goal' },
  { code: 'FIRST_GOAL_COMPLETE', title: 'Goal Crushers', icon: '🏆', description: 'Completed a shared goal' },
  { code: 'LOVE_NOTE_10', title: 'Love Letters', icon: '💌', description: 'Sent 10 love notes' },
  { code: 'MOOD_STREAK_7', title: '7-Day Mood Streak', icon: '🌈', description: 'Shared mood 7 days in a row' },
  { code: 'FIRST_POLL', title: 'Decision Makers', icon: '🗳️', description: 'Completed your first poll' },
];

export default function AchievementsCard({ unlockedCodes, onSeeAllPress }: AchievementsCardProps) {
  const unlockedCount = CORE_ACHIEVEMENTS.filter((a) => unlockedCodes.includes(a.code)).length;
  const progressPct = (unlockedCount / CORE_ACHIEVEMENTS.length) * 100;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <FontAwesome name="trophy" size={18} color="#FFD700" style={{ marginRight: 8 }} />
          <Text style={styles.title}>Achievements</Text>
        </View>
        <TouchableOpacity onPress={onSeeAllPress}>
          <Text style={styles.seeAllText}>See All</Text>
        </TouchableOpacity>
      </View>

      {/* Overall progress */}
      <View style={styles.overallProgress}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progressPct}%` as any }]} />
        </View>
        <Text style={styles.progressLabel}>{unlockedCount}/{CORE_ACHIEVEMENTS.length}</Text>
      </View>

      <View style={styles.grid}>
        {CORE_ACHIEVEMENTS.slice(0, 6).map((item) => {
          const isUnlocked = unlockedCodes.includes(item.code);
          return (
            <View
              key={item.code}
              style={[styles.achievementChip, isUnlocked ? styles.unlockedChip : styles.lockedChip]}
            >
              <Text style={[styles.chipIcon, !isUnlocked && styles.lockedIcon]}>{item.icon}</Text>
              <Text style={[styles.chipTitle, !isUnlocked && styles.lockedText]} numberOfLines={2}>
                {item.title}
              </Text>
              {isUnlocked && (
                <View style={styles.checkBadge}>
                  <FontAwesome name="check" size={8} color="#fff" />
                </View>
              )}
            </View>
          );
        })}
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
    marginBottom: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  seeAllText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  overallProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 3,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 3,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  progressLabel: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '700',
    minWidth: 35,
    textAlign: 'right',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  achievementChip: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  unlockedChip: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 215, 0, 0.35)',
  },
  lockedChip: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  chipIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  lockedIcon: {
    opacity: 0.4,
  },
  chipTitle: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 12,
    letterSpacing: 0.1,
  },
  lockedText: {
    color: COLORS.subtext,
    opacity: 0.65,
  },
  checkBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 16,
    height: 18,
    borderRadius: 8,
    backgroundColor: COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.success,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
});
