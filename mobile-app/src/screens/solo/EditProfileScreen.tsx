import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, Text, StyleSheet, Alert } from 'react-native';
import { authService } from '../../services/authService';
import { socketService } from '../../services/socket';
import { useAuthStore } from '../../store/authStore';

const EditProfileScreen = ({ navigation }: any) => {
  const user = useAuthStore((s: any) => s.user);
  const [name, setName] = useState(user?.name || '');
  const [gender, setGender] = useState(user?.gender || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(user?.name || '');
    setGender(user?.gender || '');
  }, [user]);

  const handleSave = async () => {
    if (!name || name.trim().length < 2) return Alert.alert('Name required', 'Please enter a valid name');
    setSaving(true);
    try {
      const res = await authService.updateProfile({ name: name.trim(), gender });
      if (res && res.user) {
        // update store
        const { setUser } = useAuthStore.getState();
        setUser(res.user);
        // emit profile update via socket for partner
        const sock = await socketService.connect();
        sock && sock.emit('profile_updated', { userId: res.user._id || res.user.id, name: res.user.name, gender: res.user.gender });
        Alert.alert('Saved', 'Profile updated');
        navigation.goBack();
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Display Name</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Your name" />
      <Text style={styles.label}>Gender</Text>
      <TextInput style={styles.input} value={gender} onChangeText={setGender} placeholder="Male / Female / Other" />
      <Button title={saving ? 'Saving...' : 'Save'} onPress={handleSave} disabled={saving} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  label: { marginTop: 12, marginBottom: 6, fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 10, borderRadius: 8 },
});

export default EditProfileScreen;
