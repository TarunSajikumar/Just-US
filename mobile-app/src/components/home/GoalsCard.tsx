import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../../theme/colors';
import { Goal } from '../../services/goalService';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface GoalsCardProps {
  goals: Goal[];
  onUpdateProgress: (goalId: string, increment?: number) => void;
  onAddGoal: () => void;
  onDeleteGoal: (goalId: string, title: string) => void;
}

const GoalsCard: React.FC<GoalsCardProps> = ({ goals, onUpdateProgress, onAddGoal, onDeleteGoal }) => {
  const activeGoals = goals.filter((g) => !g.completed);
  const completedGoals = goals.filter((g) => g.completed);

  if (goals.length === 0) {
    return (
      <View style={styles.card}>
        <View style={styles.emptyStateContainer}>
          <View style={styles.iconCircle}>
            <FontAwesome name="compass" size={32} color={COLORS.primary} />
          </View>
          <Text style={styles.emptyTitle}>Our Future Wishes</Text>
          <Text style={styles.emptyText}>Add things you wish to do together in the future!</Text>
          <TouchableOpacity style={styles.gradientBtn} onPress={onAddGoal}>
            <LinearGradient
              colors={[COLORS.primary, '#C23576']}
              style={styles.btnGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <FontAwesome name="plus" size={14} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.btnText}>Add First Wish</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const handleCompleteGoal = (goal: Goal) => {
    // If it's an old goal with a target > 1, send the required increment to complete it instantly
    const requiredIncrement = goal.target - goal.current;
    onUpdateProgress(goal._id, Math.max(1, requiredIncrement));
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.activeTitle}>💫 What We Wish to Do</Text>
        <TouchableOpacity style={styles.addChallengeLink} onPress={onAddGoal}>
          <FontAwesome name="plus-circle" size={14} color={COLORS.primary} style={{ marginRight: 4 }} />
          <Text style={styles.addLinkText}>Add Wish</Text>
        </TouchableOpacity>
      </View>

      {activeGoals.length === 0 ? (
        <View style={styles.emptyActiveContainer}>
          <Text style={styles.emptyActiveText}>All wishes fulfilled! What should we do next? 🌍</Text>
        </View>
      ) : (
        activeGoals.map((goal) => (
          <TouchableOpacity
            key={goal._id}
            style={styles.goalItem}
            onLongPress={() => onDeleteGoal(goal._id, goal.title)}
            activeOpacity={0.9}
          >
            <View style={styles.bucketRow}>
              <View style={styles.leftContainer}>
                <View style={styles.emojiContainer}>
                  <Text style={styles.goalEmoji}>{goal.emoji || '✨'}</Text>
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.goalTitle} numberOfLines={2}>
                    {goal.title}
                  </Text>
                  <Text style={styles.badgeTextLabel}>Wish List Item ⏳</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.checkButton}
                onPress={() => handleCompleteGoal(goal)}
                activeOpacity={0.7}
              >
                <Ionicons name="ellipse-outline" size={24} color={COLORS.subtext} />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))
      )}

      {completedGoals.length > 0 && (
        <View style={styles.completedSection}>
          <Text style={styles.completedLabel}>🏆 Completed Plans & Adventures</Text>
          {completedGoals.slice(0, 4).map((goal) => (
            <TouchableOpacity
              key={goal._id}
              style={styles.completedItem}
              onLongPress={() => onDeleteGoal(goal._id, goal.title)}
              activeOpacity={0.9}
            >
              <View style={styles.completedEmojiContainer}>
                <Text style={styles.completedEmoji}>{goal.emoji || '✨'}</Text>
              </View>
              <Text style={styles.completedTitle} numberOfLines={2}>
                {goal.title}
              </Text>
              <View style={styles.completedBadge}>
                <FontAwesome name="check-circle" size={12} color="#2ECC71" />
                <Text style={styles.completedBadgeText}>Completed</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {(activeGoals.length > 0 || completedGoals.length > 0) && (
        <Text style={styles.hintText}>Long-press a wish or goal to remove it</Text>
      )}
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
    letterSpacing: 0.4,
  },
  addChallengeLink: {
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
  emptyTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  emptyText: {
    color: COLORS.subtext,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 18,
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
  emptyActiveContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  emptyActiveText: {
    color: COLORS.subtext,
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  goalItem: {
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
  bucketRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  emojiContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  goalEmoji: {
    fontSize: 22,
  },
  textContainer: {
    flex: 1,
  },
  goalTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    letterSpacing: 0.2,
  },
  badgeTextLabel: {
    color: COLORS.subtext,
    fontSize: 11,
    marginTop: 3,
    fontWeight: '500',
  },
  checkButton: {
    padding: 4,
  },
  completedSection: {
    marginTop: 12,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  completedLabel: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.6,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  completedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: 'rgba(46,204,113,0.08)',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(46, 204, 113, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
  },
  completedEmojiContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  completedEmoji: {
    fontSize: 16,
  },
  completedTitle: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
    textDecorationLine: 'line-through',
    letterSpacing: 0.1,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(46, 204, 113, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(46, 204, 113, 0.3)',
    gap: 4,
  },
  completedBadgeText: {
    color: '#2ECC71',
    fontSize: 11,
    fontWeight: '600',
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

export default GoalsCard;
