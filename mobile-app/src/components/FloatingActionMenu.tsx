import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Dimensions,
  Animated,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../theme/colors';

const { width, height } = Dimensions.get('window');

interface FloatingActionMenuProps {
  onAddGoal?: () => void;
  onAddPoll?: () => void;
  onAddNote?: () => void;
  onAddEvent?: () => void;
  onAddMood?: () => void;
  onAddWishlist?: () => void;
  onAddDateIdea?: () => void;
  onAddQuestion?: () => void;
  isCouplePlus?: boolean;
}

export default function FloatingActionMenu({
  onAddGoal,
  onAddPoll,
  onAddNote,
  onAddEvent,
  onAddMood,
  onAddWishlist,
  onAddDateIdea,
  onAddQuestion,
  isCouplePlus = false,
}: FloatingActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const navigation = useNavigation<any>();
  const animation = useRef(new Animated.Value(0)).current;

  // ===== BASE ACTIONS (All Couples) =====
  const baseActions = [
    {
      icon: 'pencil',
      label: 'Love Note',
      onPress: onAddNote,
      color: '#FF4D8D',
    },
    {
      icon: 'camera',
      label: 'Memory',
      route: 'Gallery',
      color: COLORS.primary,
    },
    {
      icon: 'smile-o',
      label: 'Mood',
      onPress: onAddMood,
      color: '#FFD700',
    },
    {
      icon: 'bullseye',
      label: 'Goal',
      onPress: onAddGoal,
      color: '#FF9F43',
    },
    {
      icon: 'list-ul',
      label: 'Poll',
      onPress: onAddPoll,
      color: '#4D96FF',
    },
    {
      icon: 'calendar',
      label: 'Event',
      onPress: onAddEvent,
      color: '#9B5DE5',
    },
  ];

  // ===== COUPLE+ ACTIONS =====
  const couplePlusActions = [
    {
      icon: 'lock',
      label: 'Private Wishlist',
      onPress: onAddWishlist,
      color: '#6BCB77',
    },
    {
      icon: 'star',
      label: 'Date Idea',
      onPress: onAddDateIdea,
      color: '#FFD700',
    },
    {
      icon: 'question-circle',
      label: 'Couple Question',
      onPress: onAddQuestion,
      color: '#FF1744',
    },
  ];

  // ===== COMBINED ACTIONS =====
  const actions = [
    ...baseActions,
    ...(isCouplePlus ? couplePlusActions : []),
  ];

  const toggleMenu = () => {
    const toValue = isOpen ? 0 : 1;

    Animated.spring(animation, {
      toValue,
      friction: 5,
      tension: 40,
      useNativeDriver: true,
    }).start();

    setIsOpen(!isOpen);
  };

  const handleAction = (action: any) => {
    toggleMenu();
    if (action.onPress) {
      action.onPress();
    } else if (action.route) {
      navigation.navigate(action.route);
    }
  };

  const rotation = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  const overlayOpacity = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <>
      {/* Background Overlay */}
      {isOpen && (
        <TouchableWithoutFeedback onPress={toggleMenu}>
          <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]} />
        </TouchableWithoutFeedback>
      )}

      <View style={styles.container} pointerEvents="box-none">
        {/* Action Items */}
        {actions.map((action, index) => {
          const translateY = animation.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -65 * (index + 1)],
          });

          const scale = animation.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1],
          });

          const opacity = animation.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0, 0, 1],
          });

          return (
            <Animated.View
              key={action.label}
              style={[
                styles.actionContainer,
                {
                  opacity,
                  transform: [{ translateY }, { scale }],
                },
              ]}
            >
              <Text style={styles.actionLabel}>{action.label}</Text>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: action.color }]}
                onPress={() => handleAction(action)}
              >
                <FontAwesome name={action.icon as any} size={18} color="#fff" />
              </TouchableOpacity>
            </Animated.View>
          );
        })}

        {/* Main FAB */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={toggleMenu}
          style={styles.fabContainer}
        >
          <Animated.View style={[styles.fab, { transform: [{ rotate: rotation }] }]}>
            <FontAwesome name="plus" size={24} color="#fff" />
          </Animated.View>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 24,
    bottom: 100,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width,
    height,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  fabContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ff4f93',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#ff4f93',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  fab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionContainer: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: 220,
    right: 0,
    bottom: 0,
    paddingBottom: 7,
  },
  actionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  actionLabel: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginRight: 15,
    backgroundColor: 'rgba(17,17,17,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    overflow: 'hidden',
  },
});
