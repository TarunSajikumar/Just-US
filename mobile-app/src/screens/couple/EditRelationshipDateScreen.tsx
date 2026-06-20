import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  ScrollView,
} from 'react-native';
import { COLORS } from '../../theme/colors';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/authService';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import {
  getDaysTogether,
  getNextAnniversary,
  getDaysUntilAnniversary,
  formatRelationshipDate,
} from '../../utils/relationshipUtils';

export default function EditRelationshipDateScreen({ navigation }: any) {
  const {
    relationshipStartDate,
    setRelationshipStartDate,
    partner,
  } = useAuthStore();

  const [selectedSince, setSelectedSince] = useState<Date>(
    relationshipStartDate ? new Date(relationshipStartDate) : new Date()
  );
  const [showPicker, setShowPicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // ─── Derived values (re-calculated whenever selectedSince changes) ─────────
  const daysTogether = useMemo(() => getDaysTogether(selectedSince), [selectedSince]);
  const nextAnniversary = useMemo(() => getNextAnniversary(selectedSince), [selectedSince]);
  const daysUntilAnniversary = useMemo(
    () => getDaysUntilAnniversary(selectedSince),
    [selectedSince]
  );
  const nextAnniversaryFormatted = useMemo(
    () => (nextAnniversary ? formatRelationshipDate(nextAnniversary) : ''),
    [nextAnniversary]
  );

  // ─── Date Picker ──────────────────────────────────────────────────────────

  const onDateChange = (_event: any, date?: Date) => {
    setShowPicker(Platform.OS === 'ios');
    if (date) {
      setSelectedSince(date);
    }
  };

  // ─── Save ─────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const sinceStr = selectedSince.toISOString().split('T')[0];

      await authService.updateRelationshipDate({ relationshipStartDate: sinceStr });

      // Update Zustand so the home screen refreshes immediately
      setRelationshipStartDate(sinceStr);

      Alert.alert(
        '❤️ Relationship Date Updated',
        'Your anniversary countdown and days together have been recalculated! ❤️',
        [{ text: 'Awesome!', onPress: () => navigation.goBack() }]
      );
    } catch {
      Alert.alert('Error', 'Failed to update the relationship date. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <FontAwesome name="chevron-left" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Relationship Dates</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Love header */}
        <View style={styles.loveHeader}>
          <Text style={styles.emoji}>💕</Text>
          <Text style={styles.loveTitle}>Your Love Story</Text>
          <Text style={styles.partnerContext}>
            Connected with {partner?.name || 'Partner'} ❤️
          </Text>
        </View>

        <View style={styles.divider} />

        <Text style={styles.subLabel}>Tap the card below to change your relationship start date:</Text>

        {/* ── Editable: Relationship Since ─────────────────────────────── */}
        <TouchableOpacity
          style={[styles.previewCard, showPicker && styles.activeCard]}
          onPress={() => setShowPicker(true)}
          activeOpacity={0.85}
        >
          <View style={styles.cardLabelRow}>
            <FontAwesome name="heart" size={14} color={COLORS.primary} style={{ marginRight: 6 }} />
            <Text style={styles.cardLabel}>Relationship Started</Text>
          </View>
          <Text style={styles.cardDate}>{formatRelationshipDate(selectedSince)}</Text>
          <LinearGradient
            colors={['rgba(255, 77, 109, 0.12)', 'rgba(255, 77, 109, 0.04)']}
            style={styles.daysBadge}
          >
            <Text style={styles.daysText}>{daysTogether} Days Together ❤️</Text>
          </LinearGradient>
          <Text style={styles.tapHint}>Tap to change date</Text>
        </TouchableOpacity>

        {showPicker && (
          <DateTimePicker
            value={selectedSince}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onDateChange}
            maximumDate={new Date()}
            textColor="#fff"
            themeVariant="dark"
          />
        )}

        {/* ── Read-only: Next Anniversary (auto-calculated) ─────────────── */}
        <View style={[styles.previewCard, styles.readOnlyCard]}>
          <View style={styles.cardLabelRow}>
            <Text style={styles.cardLabelAnniversary}>🎉 Next Anniversary</Text>
            <View style={styles.autoTag}>
              <Ionicons name="lock-closed" size={10} color={COLORS.subtext} />
              <Text style={styles.autoTagText}>Auto</Text>
            </View>
          </View>
          <Text style={styles.cardDate}>{nextAnniversaryFormatted}</Text>
          <LinearGradient
            colors={['rgba(255, 196, 0, 0.12)', 'rgba(255, 196, 0, 0.04)']}
            style={[styles.daysBadge, { borderColor: 'rgba(255, 196, 0, 0.25)' }]}
          >
            <Text style={[styles.daysText, { color: '#FFC400' }]}>
              {daysUntilAnniversary === 0
                ? '🎉 Happy Anniversary!'
                : `${daysUntilAnniversary} Days Remaining ❤️`}
            </Text>
          </LinearGradient>
          <Text style={styles.readOnlyNote}>
            Automatically calculated from your start date. Cannot be edited manually.
          </Text>
        </View>

        {/* Save button */}
        <TouchableOpacity
          style={[styles.saveBtn, isSaving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={isSaving}
        >
          <Text style={styles.saveBtnText}>
            {isSaving ? 'Saving…' : 'Save Relationship Date'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  backBtn: { padding: 10 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 60,
    alignItems: 'center',
  },
  loveHeader: { alignItems: 'center', marginVertical: 10 },
  emoji: { fontSize: 40, marginBottom: 5 },
  loveTitle: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  partnerContext: {
    color: COLORS.primary,
    fontSize: 16,
    marginTop: 4,
    fontWeight: '600',
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 20,
  },
  subLabel: {
    color: COLORS.subtext,
    fontSize: 13,
    marginBottom: 20,
    fontStyle: 'italic',
    alignSelf: 'flex-start',
    lineHeight: 18,
  },
  previewCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  activeCard: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(255, 77, 109, 0.04)',
  },
  readOnlyCard: {
    borderColor: 'rgba(255, 196, 0, 0.3)',
    backgroundColor: 'rgba(255, 196, 0, 0.03)',
  },
  cardLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardLabel: {
    color: COLORS.subtext,
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cardLabelAnniversary: {
    color: '#FFC400',
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    marginRight: 8,
  },
  autoTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 3,
  },
  autoTagText: {
    color: COLORS.subtext,
    fontSize: 10,
    fontWeight: '600',
  },
  cardDate: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 14,
    textAlign: 'center',
  },
  daysBadge: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 109, 0.3)',
    marginBottom: 10,
  },
  daysText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  tapHint: {
    color: COLORS.subtext,
    fontSize: 11,
    marginTop: 4,
    fontStyle: 'italic',
  },
  readOnlyNote: {
    color: COLORS.subtext,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 16,
    paddingHorizontal: 10,
    fontStyle: 'italic',
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 18,
    borderRadius: 18,
    width: '100%',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
    marginTop: 10,
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
});
