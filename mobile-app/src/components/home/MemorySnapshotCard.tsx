import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { COLORS } from '../../theme/colors';
import { FontAwesome } from '@expo/vector-icons';
import { memoryService, Memory } from '../../services/memoryService';
import { useAuthStore } from '../../store/authStore';

interface MemorySnapshotCardProps {
  onViewAll: () => void;
}

const MemorySnapshotCard: React.FC<MemorySnapshotCardProps> = ({ onViewAll }) => {
  const { user } = useAuthStore();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    // Use couple_id if available, otherwise skip
    const coupleId = (user as any).couple_id;
    if (!coupleId) {
      setLoading(false);
      return;
    }
    memoryService
      .getMemories(coupleId)
      .then((data) => setMemories(data.slice(0, 3)))
      .catch(() => setMemories([]))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return null;
  if (memories.length === 0) return null;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <FontAwesome name="camera" size={14} color={COLORS.secondary} style={{ marginRight: 8 }} />
          <Text style={styles.title}>Our Memories</Text>
        </View>
        <TouchableOpacity onPress={onViewAll}>
          <Text style={styles.seeAll}>See All</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.photoRow}>
        {memories.map((memory, index) => (
          <TouchableOpacity key={memory.id || index} style={styles.photoWrapper} onPress={onViewAll}>
            <Image
              source={{ uri: memory.image_url }}
              style={styles.photo}
              resizeMode="cover"
            />
            {index === 2 && memories.length > 3 && (
              <View style={styles.overlay}>
                <Text style={styles.overlayText}>+more</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
        {memories.length < 3 &&
          Array(3 - memories.length)
            .fill(null)
            .map((_, i) => <View key={`empty-${i}`} style={[styles.photoWrapper, styles.emptyPhoto]} />)}
      </View>

      <Text style={styles.countText}>
        {memories.length} {memories.length === 1 ? 'memory' : 'memories'} captured together ❤️
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 16,
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
    color: COLORS.secondary,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  seeAll: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  photoRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  photoWrapper: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  emptyPhoto: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  countText: {
    color: COLORS.subtext,
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
});

export default MemorySnapshotCard;
