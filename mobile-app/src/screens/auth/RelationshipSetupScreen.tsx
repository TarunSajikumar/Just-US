import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Clipboard,
} from 'react-native';
import { COLORS } from '../../theme/colors';
import { inviteService } from '../../services/inviteService';
import { useAuthStore } from '../../store/authStore';
import { FontAwesome } from '@expo/vector-icons';

export default function RelationshipSetupScreen({ navigation }: any) {
  const [inviteCode, setInviteCode] = useState('');
  const [myInviteCode, setMyInviteCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { user, refreshUser } = useAuthStore();

  const handleJoin = async () => {
    if (!inviteCode.trim()) {
      Alert.alert('Error', 'Please enter an invite code');
      return;
    }
    setIsJoining(true);
    try {
      // Join invite and refresh user state to sync couple connection
      await inviteService.joinInvite(inviteCode.trim().toUpperCase());
      
      // 🔥 CRITICAL FIX: Wait for store to fully refresh before showing alert
      // This ensures RootNavigator sees the updated relationship_status
      await refreshUser();

      // Verification log
      const { user: updatedUser } = useAuthStore.getState();
      console.log('Successfully joined! Relationship status:', updatedUser?.relationship_status);

      Alert.alert(
        'Connected! 💑',
        'You are now linked with your partner!',
        [
          {
            text: 'Continue',
            onPress: () => {
              // Navigation will happen automatically because RootNavigator now sees relationship_status === 'couple'
            },
          },
        ]
      );
    } catch (err: any) {
      console.error('Join error', err);
      Alert.alert('Error', err?.response?.data?.message || 'Failed to join. Please check the code.');
    } finally {
      setIsJoining(false);
    }
  };

  const handleGenerateCode = async () => {
    setIsGenerating(true);
    try {
      const code = await inviteService.createInvite();
      setMyInviteCode(code);
    } catch (err: any) {
      console.error('Generate code error', err);
      Alert.alert('Error', 'Failed to generate invite code');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    Clipboard.setString(myInviteCode);
    Alert.alert('Copied!', 'Invite code copied to clipboard 📋');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Connect with Partner ❤️</Text>
        <Text style={styles.subtitle}>
          To start your shared journey, connect with your partner using an invite code.
        </Text>

        {/* Section 1: Join with partner's code */}
        <View style={styles.section}>
          <Text style={styles.label}>Enter Partner's Code</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={inviteCode}
              onChangeText={setInviteCode}
              placeholder="e.g. AB12CD"
              placeholderTextColor="#777"
              autoCapitalize="characters"
              maxLength={6}
            />
            <TouchableOpacity
              style={[styles.joinButton, (!inviteCode.trim() || isJoining) && styles.disabledButton]}
              onPress={handleJoin}
              disabled={isJoining || !inviteCode.trim()}
            >
              {isJoining ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.buttonText}>Join</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.divider}>
          <View style={styles.line} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.line} />
        </View>

        {/* Section 2: Generate your own code */}
        <View style={styles.section}>
          <Text style={styles.label}>Share Your Code</Text>
          <Text style={styles.description}>
            Give this code to your partner so they can connect with you.
          </Text>

          {!myInviteCode ? (
            <TouchableOpacity
              style={[styles.generateButton, isGenerating && styles.disabledButton]}
              onPress={handleGenerateCode}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.buttonText}>Generate My Code</Text>
              )}
            </TouchableOpacity>
          ) : (
            <View style={styles.codeDisplay}>
              <Text style={styles.codeText}>{myInviteCode}</Text>
              <TouchableOpacity onPress={copyToClipboard} style={styles.copyButton}>
                <FontAwesome name="copy" size={20} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Solo mode escape hatch */}
        <TouchableOpacity
          style={styles.soloButton}
          onPress={() => navigation.replace('SoloTabs')}
        >
          <Text style={styles.soloButtonText}>Continue in Solo Mode for now</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { padding: 24, justifyContent: 'center', flexGrow: 1 },
  title: { color: '#fff', fontSize: 28, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
  subtitle: { color: COLORS.subtext, fontSize: 16, textAlign: 'center', marginBottom: 40 },
  section: {
    backgroundColor: COLORS.card,
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  label: { color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 15 },
  description: { color: COLORS.subtext, fontSize: 14, marginBottom: 20 },
  inputContainer: { flexDirection: 'row', alignItems: 'center' },
  input: {
    flex: 1,
    backgroundColor: '#111',
    color: '#fff',
    padding: 15,
    borderRadius: 12,
    marginRight: 10,
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 4,
    textAlign: 'center',
  },
  joinButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 12,
  },
  generateButton: {
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  disabledButton: { opacity: 0.5 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 30 },
  line: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: { color: COLORS.subtext, marginHorizontal: 15, fontWeight: 'bold' },
  codeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111',
    padding: 20,
    borderRadius: 12,
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  codeText: {
    color: COLORS.primary,
    fontSize: 36,
    fontWeight: 'bold',
    letterSpacing: 8,
    marginRight: 20,
  },
  copyButton: { padding: 10 },
  soloButton: { marginTop: 30, alignItems: 'center' },
  soloButtonText: { color: COLORS.subtext, fontSize: 14, textDecorationLine: 'underline' },
});
