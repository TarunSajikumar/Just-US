import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import { periodService, PeriodTracker, PeriodDates } from '../services/period.service';
import { useAuthStore } from '../store/authStore';

export function PeriodTrackerScreen({ navigation }: any) {
  const { user, partner } = useAuthStore();
  const [tracker, setTracker] = useState<PeriodTracker | null>(null);
  const [dates, setDates] = useState<PeriodDates | null>(null);
  const [lastPeriodDate, setLastPeriodDate] = useState('');
  const [cycleLengthDays, setCycleLengthDays] = useState('28');
  const [periodDurationDays, setPeriodDurationDays] = useState('5');
  const [isPrivate, setIsPrivate] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPeriodInfo();
  }, []);

  const loadPeriodInfo = async () => {
    try {
      setLoading(true);
      const data = await periodService.getPeriodTracker();
      setTracker(data.tracker);
      setDates(data.dates);
      setLastPeriodDate(data.tracker.lastPeriodDate.split('T')[0]);
      setCycleLengthDays(String(data.tracker.cycleLengthDays));
      setPeriodDurationDays(String(data.tracker.periodDurationDays));
      setIsPrivate(data.tracker.isPrivate);
    } catch (err: any) {
      if (err.response?.status !== 404) {
        setError(err.message || 'Failed to load period info');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSavePeriodInfo = async () => {
    if (!lastPeriodDate) {
      Alert.alert('Error', 'Please enter your last period date');
      return;
    }

    setSaving(true);
    try {
      const data = await periodService.trackPeriod(
        lastPeriodDate,
        parseInt(cycleLengthDays) || 28,
        parseInt(periodDurationDays) || 5,
        isPrivate
      );
      setTracker(data.tracker);
      setDates(data.dates);
      Alert.alert('Success', 'Period information saved');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save period info');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#e94560" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Period Tracker ❤️</Text>

      {dates && (
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Predictions</Text>
          <View style={styles.infoPrediction}>
            <Text style={styles.predictionLabel}>Next Period:</Text>
            <Text style={styles.predictionValue}>
              {new Date(dates.nextPeriodDate).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.infoPrediction}>
            <Text style={styles.predictionLabel}>Ovulation:</Text>
            <Text style={styles.predictionValue}>
              {new Date(dates.ovulationDay).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.infoPrediction}>
            <Text style={styles.predictionLabel}>Fertile Window:</Text>
            <Text style={styles.predictionValue}>
              {new Date(dates.fertileWindowStart).toLocaleDateString()} -{' '}
              {new Date(dates.fertileWindowEnd).toLocaleDateString()}
            </Text>
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Edit Information</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Last Period Date</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            value={lastPeriodDate}
            onChangeText={setLastPeriodDate}
            editable={!saving}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Cycle Length (days)</Text>
          <TextInput
            style={styles.input}
            placeholder="21-35"
            value={cycleLengthDays}
            onChangeText={setCycleLengthDays}
            keyboardType="number-pad"
            editable={!saving}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Period Duration (days)</Text>
          <TextInput
            style={styles.input}
            placeholder="2-7"
            value={periodDurationDays}
            onChangeText={setPeriodDurationDays}
            keyboardType="number-pad"
            editable={!saving}
          />
        </View>

        <View style={styles.privacySection}>
          <View>
            <Text style={styles.label}>Private from Partner</Text>
            <Text style={styles.privacyDescription}>
              Keep your period tracker private or share with {partner?.name}
            </Text>
          </View>
          <Switch
            value={isPrivate}
            onValueChange={setIsPrivate}
            disabled={saving}
            trackColor={{ false: '#e94560', true: '#555' }}
            thumbColor={isPrivate ? '#fff' : '#e94560'}
          />
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.button, saving && styles.buttonDisabled]}
          onPress={handleSavePeriodInfo}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Save Period Info</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.spacing} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e27',
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#0a0e27',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  infoCard: {
    backgroundColor: 'rgba(233, 69, 96, 0.1)',
    borderWidth: 1,
    borderColor: '#e94560',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e94560',
    marginBottom: 12,
  },
  infoPrediction: {
    marginBottom: 12,
  },
  predictionLabel: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 4,
  },
  predictionValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e94560',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ccc',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e94560',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  privacySection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  privacyDescription: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  button: {
    backgroundColor: '#e94560',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 14,
    marginBottom: 12,
  },
  spacing: {
    height: 24,
  },
});
