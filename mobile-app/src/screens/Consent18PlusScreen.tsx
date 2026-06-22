import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { eighteenPlusService } from '../services/eighteenplus.service';
import { useAuthStore } from '../store/authStore';

export function Consent18PlusScreen({ navigation }: any) {
  const { user, partner } = useAuthStore();
  const [status, setStatus] = useState<'not_requested' | 'pending' | 'accepted' | 'rejected' | 'revoked'>('not_requested');
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [consent, setConsent] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      setLoading(true);
      const data = await eighteenPlusService.getStatus();
      setStatus(data.status as any);
      setConsent(data.consent);
    } catch (err: any) {
      setError(err.message || 'Failed to load status');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestMode = async () => {
    setActing(true);
    try {
      const data = await eighteenPlusService.requestMode('');
      setConsent(data.consent);
      setStatus('pending');
      Alert.alert('Success', 'Request sent to your partner');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to send request');
    } finally {
      setActing(false);
    }
  };

  const handleAccept = async () => {
    setActing(true);
    try {
      const data = await eighteenPlusService.acceptMode();
      setConsent(data.consent);
      setStatus('accepted');
      Alert.alert('Success', '18+ mode is now active');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to accept');
    } finally {
      setActing(false);
    }
  };

  const handleReject = async () => {
    Alert.alert('Confirm', 'Reject 18+ mode request?', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Reject',
        onPress: async () => {
          setActing(true);
          try {
            const data = await eighteenPlusService.rejectMode('');
            setConsent(data.consent);
            setStatus('rejected');
            Alert.alert('Done', 'Request rejected');
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to reject');
          } finally {
            setActing(false);
          }
        },
        style: 'destructive',
      },
    ]);
  };

  const handleRevoke = async () => {
    Alert.alert('Confirm', 'Revoke 18+ mode for both partners?', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Revoke',
        onPress: async () => {
          setActing(true);
          try {
            const data = await eighteenPlusService.revokeMode('');
            setConsent(data.consent);
            setStatus('revoked');
            Alert.alert('Done', '18+ mode revoked');
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to revoke');
          } finally {
            setActing(false);
          }
        },
        style: 'destructive',
      },
    ]);
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
      <Text style={styles.title}>18+ Content Mode</Text>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>How It Works</Text>
        <Text style={styles.infoText}>
          Both partners must agree to enable 18+ content mode. Once enabled, both of you can access intimate features like positions, ideas, and challenges.
        </Text>
        <Text style={styles.infoText} style={{ marginTop: 8 }}>
          Either partner can revoke access at any time.
        </Text>
      </View>

      <View style={styles.statusCard}>
        <Text style={styles.statusLabel}>Current Status:</Text>
        <View style={[styles.statusBadge, styles[`status_${status}` as any]]}>
          <Text style={styles.statusText}>
            {status === 'not_requested' && '⏳ Not Requested'}
            {status === 'pending' && '⏳ Pending'}
            {status === 'accepted' && '✅ Active'}
            {status === 'rejected' && '❌ Rejected'}
            {status === 'revoked' && '🔒 Revoked'}
          </Text>
        </View>
      </View>

      {status === 'not_requested' && (
        <TouchableOpacity
          style={[styles.button, acting && styles.buttonDisabled]}
          onPress={handleRequestMode}
          disabled={acting}
        >
          {acting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Request from {partner?.name}</Text>
          )}
        </TouchableOpacity>
      )}

      {status === 'pending' && consent?.responder?.userId === user?._id && (
        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={[styles.acceptButton, acting && styles.buttonDisabled]}
            onPress={handleAccept}
            disabled={acting}
          >
            {acting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>✅ Accept</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.rejectButton, acting && styles.buttonDisabled]}
            onPress={handleReject}
            disabled={acting}
          >
            {acting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.rejectButtonText}>❌ Reject</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {status === 'pending' && consent?.requester?.userId === user?._id && (
        <View style={styles.pendingCard}>
          <Text style={styles.pendingText}>
            Waiting for {partner?.name} to respond...
          </Text>
        </View>
      )}

      {status === 'accepted' && (
        <View>
          <View style={styles.successCard}>
            <Text style={styles.successText}>🎉 18+ mode is active!</Text>
            <Text style={styles.successSubText}>
              Both you and {partner?.name} can access intimate features.
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.revokeButton, acting && styles.buttonDisabled]}
            onPress={handleRevoke}
            disabled={acting}
          >
            {acting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.revokeButtonText}>Revoke Access</Text>
            )}
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
  infoCard: {
    backgroundColor: 'rgba(233, 69, 96, 0.1)',
    borderWidth: 1,
    borderColor: '#e94560',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e94560',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
  },
  statusCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  statusLabel: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 8,
  },
  statusBadge: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  status_not_requested: {
    backgroundColor: 'rgba(100, 100, 100, 0.3)',
  },
  status_pending: {
    backgroundColor: 'rgba(255, 193, 7, 0.3)',
  },
  status_accepted: {
    backgroundColor: 'rgba(76, 175, 80, 0.3)',
  },
  status_rejected: {
    backgroundColor: 'rgba(244, 67, 54, 0.3)',
  },
  status_revoked: {
    backgroundColor: 'rgba(63, 81, 181, 0.3)',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  button: {
    backgroundColor: '#e94560',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: '#4caf50',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  rejectButton: {
    flex: 1,
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f44336',
  },
  rejectButtonText: {
    color: '#f44336',
    fontSize: 16,
    fontWeight: '600',
  },
  pendingCard: {
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    borderWidth: 1,
    borderColor: '#ffc107',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  pendingText: {
    color: '#ffc107',
    fontSize: 16,
    fontWeight: '600',
  },
  successCard: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderWidth: 1,
    borderColor: '#4caf50',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  successText: {
    color: '#4caf50',
    fontSize: 16,
    fontWeight: 'bold',
  },
  successSubText: {
    color: '#aaa',
    fontSize: 14,
    marginTop: 8,
  },
  revokeButton: {
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f44336',
    marginBottom: 16,
  },
  revokeButtonText: {
    color: '#f44336',
    fontSize: 16,
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
