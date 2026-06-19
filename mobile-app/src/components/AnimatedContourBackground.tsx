import React from 'react';
import { StyleSheet, View } from 'react-native';

interface AnimatedContourBackgroundProps {
  isCouplePlus?: boolean;
}

export default function AnimatedContourBackground({ isCouplePlus = false }: AnimatedContourBackgroundProps) {
  return <View style={styles.container} pointerEvents="none" />;
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#000',
  },
});
