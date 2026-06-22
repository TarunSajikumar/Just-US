import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
} from 'react-native';
import { heartService } from '../services/heart.service';

interface HeartButtonProps {
  messageId: string;
  onHeartAdded?: (heartType: string) => void;
  onHeartRemoved?: () => void;
  initialHeartType?: string | null;
  disabled?: boolean;
}

export function HeartButton({
  messageId,
  onHeartAdded,
  onHeartRemoved,
  initialHeartType,
  disabled,
}: HeartButtonProps) {
  const [heartType, setHeartType] = useState<string | null>(initialHeartType || null);
  const [loading, setLoading] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const heartTypes = [
    { type: 'heart', emoji: '❤️', label: 'Love' },
    { type: 'loved', emoji: '😍', label: 'Loved' },
    { type: 'laughed', emoji: '😂', label: 'Laughed' },
    { type: 'surprised', emoji: '😲', label: 'Surprised' },
    { type: 'sad', emoji: '😢', label: 'Sad' },
    { type: 'angry', emoji: '😠', label: 'Angry' },
  ];

  const handleHeartPress = async (type: string) => {
    setLoading(true);
    try {
      const result = await heartService.addHeart(messageId, type);
      if (result.added) {
        setHeartType(type);
        onHeartAdded?.(type);
      } else {
        setHeartType(null);
        onHeartRemoved?.();
      }
      setShowOptions(false);
    } catch (error) {
      console.error('Failed to add heart:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveHeart = async () => {
    setLoading(true);
    try {
      await heartService.removeHeart(messageId);
      setHeartType(null);
      onHeartRemoved?.();
      setShowOptions(false);
    } catch (error) {
      console.error('Failed to remove heart:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentHeart = heartTypes.find((h) => h.type === heartType);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#e94560" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {showOptions && (
        <View style={styles.optionsContainer}>
          {heartTypes.map((h) => (
            <TouchableOpacity
              key={h.type}
              style={styles.optionButton}
              onPress={() => handleHeartPress(h.type)}
              disabled={disabled}
            >
              <Text style={styles.optionEmoji}>{h.emoji}</Text>
            </TouchableOpacity>
          ))}
          {heartType && (
            <TouchableOpacity
              style={[styles.optionButton, styles.removeButton]}
              onPress={handleRemoveHeart}
              disabled={disabled}
            >
              <Text style={styles.removeEmoji}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.button,
          heartType && styles.buttonActive,
          disabled && styles.buttonDisabled,
        ]}
        onPress={() => setShowOptions(!showOptions)}
        disabled={disabled}
      >
        <Text style={styles.emoji}>{currentHeart?.emoji || '🤍'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  loadingContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(233, 69, 96, 0.3)',
  },
  buttonActive: {
    backgroundColor: 'rgba(233, 69, 96, 0.2)',
    borderColor: '#e94560',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  emoji: {
    fontSize: 20,
  },
  optionsContainer: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    backgroundColor: '#1a1f3a',
    borderWidth: 1,
    borderColor: '#e94560',
    borderRadius: 12,
    padding: 8,
    flexDirection: 'row',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  optionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionEmoji: {
    fontSize: 20,
  },
  removeButton: {
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
    borderWidth: 1,
    borderColor: '#f44336',
  },
  removeEmoji: {
    fontSize: 16,
    color: '#f44336',
    fontWeight: 'bold',
  },
});
