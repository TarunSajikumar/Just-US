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
  title: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 14,
    letterSpacing: 0.3,
  },
  moodGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  moodBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginHorizontal: 3,
  },
  moodEmoji: {
    fontSize: 24,
    marginBottom: 5,
  },
  moodLabel: {
    color: COLORS.subtext,
    fontSize: 10,
    fontWeight: '500',
  },
  partnerMoodContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  partnerMoodText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
});
