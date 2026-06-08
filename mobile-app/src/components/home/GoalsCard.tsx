import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { COLORS } from '../../theme/colors';
import { Goal } from '../../services/goalService';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface GoalsCardProps {
  goals: Goal[];
  onUpdateProgress: (goalId: string) => void;
  onAddGoal: () => void;
}

const GoalsCard: React.FC<GoalsCardProps> = ({ goals, onUpdateProgress, onAddGoal }) => {
  const activeGoals = goals.filter((g) => !g.completed);
  const completedGoals = goals.filter((g) => g.completed);

  if (goals.length === 0) {
    return (
      <View style={styles.card}>
        <View style={styles.emptyStateContainer}>
          <View style={styles.iconCircle}>
            <FontAwesome name="bullseye" size={32} color={COLORS.primary} />
          </View>
          <Text style={styles.emptyText}>No active goals. Start a challenge together!</Text>
          <TouchableOpacity style={styles.gradientBtn} onPress={onAddGoal}>
            <LinearGradient
              colors={[COLORS.primary, '#C23576']}
              style={styles.btnGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <FontAwesome name="plus" size={14} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.btnText}>Create First Goal</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.activeTitle}>Active Challenges</Text>
        <TouchableOpacity style={styles.addChallengeLink} onPress={onAddGoal}>
          <FontAwesome name="plus-circle" size={14} color={COLORS.primary} style={{ marginRight: 4 }} />
          <Text style={styles.addLinkText}>Add New</Text>
        </TouchableOpacity>
      </View>

      {activeGoals.length === 0 ? (
        <View style={styles.emptyActiveContainer}>
          <Text style={styles.emptyActiveText}>All current goals completed! 🏆</Text>
        </View>
      ) : (
        activeGoals.slice(0, 3).map((goal) => {
          const progress = Math.min((goal.current / goal.target) * 100, 100);
          const progressColor =
            progress >= 80 ? '#FFD700' : progress >= 50 ? '#FF9F43' : COLORS.primary;

          return (
            <View key={goal._id} style={styles.goalItem}>
              <View style={styles.goalHeader}>
                <View style={styles.emojiContainer}>
                  <Text style={styles.goalEmoji}>{goal.emoji || '🎯'}</Text>
                </View>
                <View style={styles.goalTitleContainer}>
                  <Text style={styles.goalTitle} numberOfLines={1}>{goal.title}</Text>
                  <Text style={styles.goalProgressLabel}>
                    Progress: <Text style={[styles.progressBold, { color: progressColor }]}>{goal.current}</Text> / {goal.target}
                  </Text>
                </View>
              </View>
              <View style={styles.progressContainer}>
                <View style={styles.progressBarBg}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${progress}%`, backgroundColor: progressColor },
                    ]}
                  />
                </View>
                <TouchableOpacity
                  style={[styles.plusButton, { shadowColor: progressColor }]}
                  onPress={() => onUpdateProgress(goal._id)}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={[progressColor, `${progressColor}CC`]}
                    style={styles.plusButtonGradient}
                  >
                    <Text style={styles.plusButtonText}>+1</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      )}

      {completedGoals.length > 0 && (
        <View style={styles.completedSection}>
          <Text style={styles.completedLabel}>🏆 Completed Milestone Goals</Text>
          {completedGoals.slice(0, 2).map((goal) => (
            <View key={goal._id} style={styles.completedItem}>
              <View style={styles.completedEmojiContainer}>
                <Text style={styles.completedEmoji}>{goal.emoji || '🎯'}</Text>
              </View>
              <Text style={styles.completedTitle} numberOfLines={1}>{goal.title}</Text>
              <View style={styles.completedBadge}>
                <FontAwesome name="trophy" size={11} color="#FFD700" />
                <Text style={styles.completedBadgeText}>Completed</Text>
              </View>
            </View>
          ))}
        </View>
      )}
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
  addChallengeLink: {
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
  emptyActiveContainer: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  emptyActiveText: {
    color: '#2ECC71',
    fontSize: 13,
    fontWeight: '600',
  },
  goalItem: {
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  emojiContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  goalEmoji: {
    fontSize: 18,
  },
  goalTitleContainer: {
    flex: 1,
  },
  goalTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  goalProgressLabel: {
    color: COLORS.subtext,
    fontSize: 11,
    marginTop: 2,
  },
  progressBold: {
    fontWeight: 'bold',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  plusButton: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  plusButtonGradient: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  completedSection: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  completedLabel: {
    color: '#FFD700',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  completedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: 'rgba(255,215,0,0.03)',
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.05)',
  },
  completedEmojiContainer: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: 'rgba(255,215,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  completedEmoji: {
    fontSize: 14,
  },
  completedTitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    flex: 1,
    textDecorationLine: 'line-through',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
    gap: 3,
  },
  completedBadgeText: {
    color: '#FFD700',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default GoalsCard;
