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
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    color: COLORS.secondary,
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  seeAll: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  photoRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  photoWrapper: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  emptyPhoto: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  countText: {
    color: COLORS.subtext,
    fontSize: 11,
    textAlign: 'center',
  },
});

export default MemorySnapshotCard;
