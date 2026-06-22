import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Switch,
  TextInput,
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { appLockService, AppLockSettings } from '../services/applock.service';

export function AppLockSetupScreen({ navigation }: any) {
  const [settings, setSettings] = useState<AppLockSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lockType, setLockType] = useState<'pin' | 'biometric'>('pin');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [error, setError] = useState('');
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    loadSettings();
    checkBiometricAvailability();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await appLockService.getSettings();
      setSettings(data);
      setLockType(data.lockType);
      setLocked(data.isLockEnabled);
    } catch (err: any) {
      setError(err.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const checkBiometricAvailability = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricAvailable(compatible && enrolled);
    } catch (err) {
      setBiometricAvailable(false);
    }
  };

  const validatePin = (p: string) => {
    return /^\d{4,6}$/.test(p);
  };

  const handleSetupPin = async () => {
    if (!validatePin(pin)) {
      Alert.alert('Invalid PIN', 'PIN must be 4-6 digits');
      return;
    }

    if (pin !== confirmPin) {
      Alert.alert('Mismatch', 'PINs do not match');
      return;
    }

    setSaving(true);
    try {
      const data = await appLockService.setupLock('pin', pin, undefined, true, true);
      setSettings(data.settings);
      setLocked(data.settings.isLockEnabled);
      Alert.alert('Success', 'PIN lock set up');
      setPin('');
      setConfirmPin('');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to setup PIN');
    } finally {
      setSaving(false);
    }
  };

  const handleSetupBiometric = async () => {
    if (!biometricAvailable) {
      Alert.alert('Not Available', 'Biometric authentication not available');
      return;
    }

    setSaving(true);
    try {
      const data = await appLockService.setupLock('biometric', undefined, 'fingerprint', true, true);
      setSettings(data.settings);
      setLocked(data.settings.isLockEnabled);
      Alert.alert('Success', 'Biometric lock set up');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to setup biometric');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleLock = async () => {
    setSaving(true);
    try {
      const data = await appLockService.toggleLock(!locked);
      setLocked(data.isLockEnabled);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to toggle lock');
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
      <Text style={styles.title}>App Lock</Text>

      <View style={styles.statusCard}>
        <View style={styles.statusContent}>
          <Text style={styles.statusLabel}>Lock Status</Text>
          <Text style={[styles.statusValue, locked ? styles.statusEnabled : styles.statusDisabled]}>
            {locked ? '🔒 Enabled' : '🔓 Disabled'}
          </Text>
        </View>
        <Switch
          value={locked}
          onValueChange={handleToggleLock}
          disabled={saving}
          trackColor={{ false: '#555', true: '#4caf50' }}
          thumbColor={locked ? '#fff' : '#e94560'}
        />
      </View>

      {!locked ? (
        <>
          <Text style={styles.sectionTitle}>Setup Security</Text>

          {/* PIN Setup */}
          <View style={styles.setupCard}>
            <Text style={styles.setupTitle}>4-6 Digit PIN</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Enter PIN</Text>
              <View style={styles.pinInput}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter 4-6 digits"
                  value={pin}
                  onChangeText={setPin}
                  secureTextEntry={!showPin}
                  keyboardType="number-pad"
                  maxLength={6}
                  editable={!saving}
                />
                <TouchableOpacity onPress={() => setShowPin(!showPin)}>
                  <Text style={styles.showText}>{showPin ? 'Hide' : 'Show'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm PIN</Text>
              <TextInput
                style={styles.input}
                placeholder="Re-enter PIN"
                value={confirmPin}
                onChangeText={setConfirmPin}
                secureTextEntry={true}
                keyboardType="number-pad"
                maxLength={6}
                editable={!saving}
              />
            </View>

            <TouchableOpacity
              style={[styles.button, saving && styles.buttonDisabled]}
              onPress={handleSetupPin}
              disabled={saving || !pin || !confirmPin}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Setup PIN Lock</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Biometric Setup */}
          {biometricAvailable && (
            <View style={styles.setupCard}>
              <Text style={styles.setupTitle}>Biometric (Fingerprint/Face)</Text>
              <Text style={styles.setupDescription}>
                Use your fingerprint or face to unlock the app
              </Text>
              <TouchableOpacity
                style={[styles.bioButton, saving && styles.buttonDisabled]}
                onPress={handleSetupBiometric}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Setup Biometric</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {!biometricAvailable && (
            <View style={styles.infoCard}>
              <Text style={styles.infoText}>
                📱 Biometric authentication not available on your device
              </Text>
            </View>
          )}
        </>
      ) : (
        <View style={styles.enabledCard}>
          <Text style={styles.enabledTitle}>✅ App Protected</Text>
          <Text style={styles.enabledText}>
            Your app is now locked. You'll need to unlock it when:
          </Text>
          <Text style={styles.bulletPoint}>• App starts</Text>
          <Text style={styles.bulletPoint}>• App returns from background</Text>
          <TouchableOpacity
            style={[styles.settingsButton, saving && styles.buttonDisabled]}
            onPress={() => {
              // Navigate to app lock settings
              Alert.alert('Settings', 'App lock is configured');
            }}
            disabled={saving}
          >
            <Text style={styles.settingsButtonText}>⚙️ Lock Settings</Text>
          </TouchableOpacity>
        </View>
      )}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

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
  statusCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusContent: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusEnabled: {
    color: '#4caf50',
  },
  statusDisabled: {
    color: '#e94560',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e94560',
    marginBottom: 16,
  },
  setupCard: {
    backgroundColor: 'rgba(233, 69, 96, 0.1)',
    borderWidth: 1,
    borderColor: '#e94560',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  setupTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e94560',
    marginBottom: 12,
  },
  setupDescription: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ccc',
    marginBottom: 8,
  },
  pinInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e94560',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  showText: {
    color: '#e94560',
    fontSize: 12,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#e94560',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  bioButton: {
    backgroundColor: '#4caf50',
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
  infoCard: {
    backgroundColor: 'rgba(100, 100, 100, 0.2)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  infoText: {
    color: '#aaa',
    fontSize: 14,
  },
  enabledCard: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderWidth: 1,
    borderColor: '#4caf50',
    borderRadius: 12,
    padding: 16,
  },
  enabledTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4caf50',
    marginBottom: 12,
  },
  enabledText: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 12,
  },
  bulletPoint: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 4,
    marginLeft: 12,
  },
  settingsButton: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#4caf50',
  },
  settingsButtonText: {
    color: '#4caf50',
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 14,
    marginTop: 12,
  },
  spacing: {
    height: 24,
  },
});
