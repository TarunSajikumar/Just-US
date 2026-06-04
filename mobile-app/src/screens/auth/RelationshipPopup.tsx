import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet
} from "react-native";
import { FontAwesome } from '@expo/vector-icons';
import { COLORS } from "../../theme/colors";
import { useAuthStore } from '../../store/authStore';

export default function RelationshipPopup({ navigation }: any) {
  const { setRelationshipMode } = useAuthStore();

  const handleSolo = () => {
    setRelationshipMode('SOLO');
    navigation.navigate('SoloTabs');
  };

  const handleCouple = () => {
    // RelationshipSetupScreen will set mode to COUPLE
    navigation.navigate('RelationshipSetup');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Are you in a relationship?</Text>

      <View style={{ height: 20 }} />

      <TouchableOpacity
        style={styles.card}
        onPress={handleCouple}
      >
        <FontAwesome name="heart" size={36} color={COLORS.primary} />
        <Text style={styles.cardTitle}>❤️ YES</Text>
        <Text style={styles.cardSub}>Share memories and moments together.</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.card}
        onPress={handleSolo}
      >
        <FontAwesome name="smile-o" size={36} color={COLORS.secondary} />
        <Text style={styles.cardTitle}>🙂 NO</Text>
        <Text style={styles.cardSub}>Use JUSTUS for personal growth.</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 24,
    justifyContent: 'center'
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12
  },
  card: {
    backgroundColor: COLORS.card,
    padding: 18,
    borderRadius: 14,
    marginVertical: 10,
    alignItems: 'center'
  },
  cardTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8
  },
  cardSub: {
    color: COLORS.subtext,
    marginTop: 6,
    textAlign: 'center'
  },
});
