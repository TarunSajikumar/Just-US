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
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/auth.service';

export function EditProfileScreen({ navigation }: any) {
  const { user, setUser } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [gender, setGender] = useState(user?.gender || '');
  const [birthday, setBirthday] = useState(user?.birthday ? new Date(user.birthday) : new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setGender(user.gender || '');
      if (user.birthday) {
        setBirthday(new Date(user.birthday));
      }
    }
  }, [user]);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setBirthday(selectedDate);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const updatedUser = await authService.updateProfile({
        name: name.trim(),
        gender: gender || undefined,
        birthday: birthday.toISOString().split('T')[0],
      });

      setUser(updatedUser);
      Alert.alert('Success', 'Profile updated successfully');
      navigation.goBack();
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
      Alert.alert('Error', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Edit Profile</Text>

      {/* Name Input */}
      <View style={styles.section}>
        <Text style={styles.label}>Display Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your name"
          value={name}
          onChangeText={(text) => {
            setName(text);
            setError('');
          }}
          maxLength={50}
          editable={!loading}
        />
      </View>

      {/* Gender Input */}
      <View style={styles.section}>
        <Text style={styles.label}>Gender</Text>
        <View style={styles.genderContainer}>
          {['Male', 'Female', 'Other'].map((genderOption) => (
            <TouchableOpacity
              key={genderOption}
              style={[
                styles.genderButton,
                gender.toLowerCase() === genderOption.toLowerCase() && styles.genderButtonActive,
              ]}
              onPress={() => setGender(genderOption.toLowerCase())}
              disabled={loading}
            >
              <Text
                style={[
                  styles.genderButtonText,
                  gender.toLowerCase() === genderOption.toLowerCase() && styles.genderButtonTextActive,
                ]}
              >
                {genderOption}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Birthday Input */}
      <View style={styles.section}>
        <Text style={styles.label}>Birthday</Text>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}
          disabled={loading}
        >
          <Text style={styles.dateButtonText}>
            {birthday.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </TouchableOpacity>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={birthday}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          maximumDate={new Date()}
        />
      )}

      {/* Error Message */}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {/* Save Button */}
      <TouchableOpacity
        style={[styles.saveButton, loading && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>Save Changes</Text>
        )}
      </TouchableOpacity>

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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
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
    fontSize: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  genderButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e94560',
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
  },
  genderButtonActive: {
    backgroundColor: '#e94560',
    borderColor: '#e94560',
  },
  genderButtonText: {
    color: '#ccc',
    fontSize: 14,
    fontWeight: '600',
  },
  genderButtonTextActive: {
    color: '#fff',
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#e94560',
    borderRadius: 8,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  dateButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#e94560',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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
