import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { COLORS } from '../../theme/colors';
import { moodService } from '../../services/moodService';
import Toast from 'react-native-toast-message';

const MOODS = [
  { key: 'happy', emoji: '😊', label: 'Happy', color: '#6BCB77' },
  { key: 'loved', emoji: '🥰', label: 'Loved', color: '#FF4D8D' },
  { key: 'sad', emoji: '😔', label: 'Sad', color: '#4D96FF' },
  { key: 'angry', emoji: '😡', label: 'Angry', color: '#EF4444' },
  { key: 'tired', emoji: '😴', label: 'Tired', color: '#9B5DE5' },
];

interface MoodCardProps {
  partnerName: string;
  onMoodSaved?: () => void;
  partnerMoodData?: { mood: string } | null;
}

export default function MoodCard({ partnerName, onMoodSaved, partnerMoodData }: MoodCardProps) {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSelectMood = async (moodKey: string) => {
    if (loading) return;
    setLoading(true);
    try {
      await moodService.saveMood(moodKey);
      setSelectedMood(moodKey);
      Toast.show({
        type: 'success',
        text1: 'Mood Updated 😊',
        text2: `You shared that you are feeling ${moodKey} today!`,
      });
      if (onMoodSaved) onMoodSaved();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Failed to save mood',
        text2: 'Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const getPartnerMoodDisplay = () => {
    if (!partnerMoodData || !partnerMoodData.mood) {
      return `${partnerName} hasn't shared their mood yet today 💭`;
    }
    const moodObj = MOODS.find((m) => m.key === partnerMoodData.mood);
    if (!moodObj) return `${partnerName} feels ${partnerMoodData.mood} today`;
    return `${partnerName} feels ${moodObj.emoji} ${moodObj.label} today`;
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>How are you feeling today?</Text>
      
      <View style={styles.moodGrid}>
        {MOODS.map((mood) => {
          const isSelected = selectedMood === mood.key;
          return (
            <TouchableOpacity
              key={mood.key}
              style={[
                styles.moodBtn,
                isSelected && {
                  borderColor: mood.color,
                  backgroundColor: `${mood.color}15`,
                },
              ]}
              onPress={() => handleSelectMood(mood.key)}
              disabled={loading}
            >
              <Text style={styles.moodEmoji}>{mood.emoji}</Text>
              <Text style={[styles.moodLabel, isSelected && { color: mood.color, fontWeight: 'bold' }]}>
                {mood.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.partnerMoodContainer}>
        {loading ? (
          <ActivityIndicator color={COLORS.primary} size="small" />
        ) : (
          <Text style={styles.partnerMoodText}>{getPartnerMoodDisplay()}</Text>
        )}
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
  },
  title: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  moodGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  moodBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    marginHorizontal: 2,
  },
  moodEmoji: {
    fontSize: 22,
    marginBottom: 4,
  },
  moodLabel: {
    color: COLORS.subtext,
    fontSize: 9,
  },
  partnerMoodContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  partnerMoodText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});
