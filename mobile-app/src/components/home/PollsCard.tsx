import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { COLORS } from '../../theme/colors';
import { Poll } from '../../services/pollService';
import { useAuthStore } from '../../store/authStore';
import { FontAwesome } from '@expo/vector-icons';

interface PollsCardProps {
  polls: Poll[];
  onVote: (pollId: string, optionIndex: number) => void;
  onAddPoll: () => void;
  onDeletePoll: (pollId: string, question: string) => void;
}

function getTimeLeft(endsAt: string): string {
  const end = new Date(endsAt).getTime();
  const now = Date.now();
  const diff = end - now;
  if (diff <= 0) return 'Ended';
  const h = Math.floor(diff / (1000 * 60 * 60));
  const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (h > 24) {
    const d = Math.floor(h / 24);
    return `${d}d left`;
  }
  if (h > 0) return `${h}h ${m}m left`;
  return `${m}m left`;
}

const PollsCard: React.FC<PollsCardProps> = ({ polls, onVote, onAddPoll, onDeletePoll }) => {
  const { user } = useAuthStore();

  const handleDeletePoll = (pollId: string, question: string) => {
    Alert.alert('Remove Poll', `Remove "${question}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          onDeletePoll(pollId, question);
        },
      },
    ]);
  };

  if (polls.length === 0) {
    return (
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.activeTitle}>Active Polls</Text>
          <TouchableOpacity style={styles.addPollLink} onPress={onAddPoll}>
            <FontAwesome name="plus-circle" size={14} color={COLORS.primary} style={{ marginRight: 4 }} />
            <Text style={styles.addLinkText}>Create New</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.emptyStateContainer}>
          <View style={styles.iconCircle}>
            <FontAwesome name="bar-chart" size={32} color={COLORS.primary} />
          </View>
          <Text style={styles.emptyText}>No active polls. Start one to decide something together!</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.activeTitle}>Active Polls</Text>
        <TouchableOpacity style={styles.addPollLink} onPress={onAddPoll}>
          <FontAwesome name="plus-circle" size={14} color={COLORS.primary} style={{ marginRight: 4 }} />
          <Text style={styles.addLinkText}>Create New</Text>
        </TouchableOpacity>
      </View>

      {polls.map((poll) => {
        const votes = poll.votes || {};
        const userVote = votes[user?._id || ''];
        const totalVotes = Object.keys(votes).length;
        const timeLeft = getTimeLeft(poll.endsAt);

        return (
          <TouchableOpacity
            key={poll._id}
            style={styles.pollItem}
            onLongPress={() => handleDeletePoll(poll._id, poll.question)}
            activeOpacity={0.9}
          >
            <Text style={styles.question}>{poll.question}</Text>
            {poll.options.map((option, index) => {
              const optionVotes = Object.values(votes).filter((v) => v === index).length;
              const percentage = totalVotes > 0 ? (optionVotes / totalVotes) * 100 : 0;
              const isSelected = userVote === index;

              return (
                <TouchableOpacity
                  key={index}
                  style={[styles.optionBtn, isSelected && styles.selectedOption]}
                  onPress={() => onVote(poll._id, index)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.progressBg, { width: `${percentage}%` }]} />
                  <View style={styles.optionContent}>
                    <Text style={[styles.optionText, isSelected && styles.selectedOptionText]}>
                      {isSelected && '✓ '}{option}
                    </Text>
                    {totalVotes > 0 && (
                      <Text style={styles.percentageText}>{Math.round(percentage)}%</Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
            <View style={styles.pollFooter}>
              <Text style={styles.pollTimer}>⏱ {timeLeft}</Text>
              <Text style={styles.pollVoteCount}>{totalVotes} vote{totalVotes !== 1 ? 's' : ''}</Text>
            </View>
          </TouchableOpacity>
        );
      })}

      {polls.length > 0 && (
        <Text style={styles.hintText}>Long-press a poll to remove it</Text>
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
    letterSpacing: 0.5,
  },
  addPollLink: {
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
    marginBottom: 8,
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  pollItem: {
    marginBottom: 20,
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
  question: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 14,
    lineHeight: 22,
    letterSpacing: 0.2,
  },
  optionBtn: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    marginBottom: 10,
    height: 48,
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  selectedOption: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(255, 77, 109, 0.12)',
  },
  progressBg: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 77, 109, 0.2)',
  },
  optionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  optionText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '500',
  },
  selectedOptionText: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  percentageText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  pollFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  pollTimer: {
    color: COLORS.subtext,
    fontSize: 12,
    fontWeight: '500',
  },
  pollVoteCount: {
    color: COLORS.subtext,
    fontSize: 12,
    fontWeight: '500',
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

export default PollsCard;
