import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Pressable,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MessageSquare, Clock, Image, Settings, Heart } from 'lucide-react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const TAB_HEIGHT = 65;
const BOTTOM_PADDING = Platform.OS === 'ios' ? 20 : 12;
const TOTAL_HEIGHT = TAB_HEIGHT + BOTTOM_PADDING;

// Tab Icons Helper
const TabIcon = ({ name, color, size, isFocused }: { name: string; color: string; size: number; isFocused: boolean }) => {
  const iconProps = { color, size, strokeWidth: isFocused ? 2.4 : 2 };
  if (name === 'image') return <Image {...iconProps} />;
  if (name === 'comments') return <MessageSquare {...iconProps} />;
  if (name === 'history') return <Clock {...iconProps} />;
  if (name === 'cog') return <Settings {...iconProps} />;
  return <Heart {...iconProps} fill={isFocused ? color : 'transparent'} />;
};

interface TabButtonProps {
  route: any;
  index: number;
  icon: string;
  label: string;
  isFocused: boolean;
  navigation: any;
  tabWidth: number;
}

const TabButton = ({ route, index, icon, label, isFocused, navigation, tabWidth }: TabButtonProps) => {
  const scale = useSharedValue(isFocused ? 1.12 : 0.92);
  const translateY = useSharedValue(isFocused ? -3 : 0);
  const opacity = useSharedValue(isFocused ? 1 : 0.6);
  const glowScale = useSharedValue(isFocused ? 1 : 0);
  const glowOpacity = useSharedValue(isFocused ? 1 : 0);

  useEffect(() => {
    scale.value = withSpring(isFocused ? 1.12 : 0.92, { damping: 14, stiffness: 110 });
    translateY.value = withSpring(isFocused ? -3 : 0, { damping: 14, stiffness: 110 });
    opacity.value = withTiming(isFocused ? 1 : 0.6, { duration: 200 });
    glowScale.value = withSpring(isFocused ? 1 : 0, { damping: 12, stiffness: 90 });
    glowOpacity.value = withTiming(isFocused ? 1 : 0, { duration: 200 });
  }, [isFocused]);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
    ],
    opacity: opacity.value,
  }));

  const animatedGlowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }],
    opacity: glowOpacity.value,
  }));

  const handlePress = () => {
    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });

    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(route.name);
    }
  };

  return (
    <Pressable onPress={handlePress} style={[styles.tabButton, { width: tabWidth }]}>
      {/* Active Tab Soft Pink Glow Circle Backdrop */}
      <Animated.View style={[styles.activeIconGlow, animatedGlowStyle]} pointerEvents="none" />

      <Animated.View style={[styles.iconContainer, animatedIconStyle]}>
        <TabIcon
          name={icon}
          color={isFocused ? '#FF4F8B' : 'rgba(255, 255, 255, 0.5)'}
          size={22}
          isFocused={isFocused}
        />
      </Animated.View>

      <Text style={[styles.tabLabel, isFocused ? styles.activeLabel : styles.inactiveLabel]}>
        {label}
      </Text>
    </Pressable>
  );
};

export default function LiquidGlassTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  const bottomInset = insets.bottom || BOTTOM_PADDING;
  const activeIndex = state.index;

  const tabWidth = SCREEN_WIDTH / 5;
  const indicatorWidth = 28;

  // Center active line indicator relative to the tab button centers
  const indicatorX = useSharedValue(activeIndex * tabWidth + tabWidth / 2 - indicatorWidth / 2);

  useEffect(() => {
    indicatorX.value = withSpring(activeIndex * tabWidth + tabWidth / 2 - indicatorWidth / 2, {
      damping: 16,
      stiffness: 100,
    });
  }, [activeIndex]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
  }));

  // Center Home FAB Component
  const HomeFAB = ({ route, isFocused }: { route: any; isFocused: boolean }) => {
    const scale = useSharedValue(1);
    const glowScale = useSharedValue(1);
    const glowOpacity = useSharedValue(0.3);

    useEffect(() => {
      const pulse = () => {
        scale.value = withSequence(
          withTiming(1.12, { duration: 150 }),
          withTiming(1.04, { duration: 100 }),
          withTiming(1.18, { duration: 150 }),
          withTiming(1, { duration: 400 })
        );
        glowScale.value = withSequence(
          withTiming(1.25, { duration: 250 }),
          withTiming(1, { duration: 500 })
        );
        glowOpacity.value = withSequence(
          withTiming(0.55, { duration: 250 }),
          withTiming(0.25, { duration: 500 })
        );
      };

      pulse();
      const interval = setInterval(pulse, 2200);
      return () => clearInterval(interval);
    }, []);

    const fabStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    const fabGlowStyle = useAnimatedStyle(() => ({
      transform: [{ scale: glowScale.value }],
      opacity: glowOpacity.value,
    }));

    const handlePress = () => {
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });

      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name);
      }
    };

    return (
      <Pressable onPress={handlePress} style={[styles.fabWrapper, { width: tabWidth }]}>
        <Animated.View style={[styles.fabGlow, fabGlowStyle]} />
        <Animated.View style={[styles.fabBody, fabStyle]}>
          <LinearGradient
            colors={['#E54B75', '#C4365D']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.fabInnerRing} />
          <Heart color="#FFFFFF" size={24} fill="#FFFFFF" strokeWidth={1.5} />
        </Animated.View>
        <Text style={[styles.tabLabel, styles.activeLabel, { marginTop: 4, fontWeight: '700' }]}>
          Home
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, { paddingBottom: bottomInset, height: TAB_HEIGHT + bottomInset }]}>
      {/* Glass Background Overlay */}
      <View style={styles.glassBackground}>
        <BlurView intensity={26} style={StyleSheet.absoluteFill} tint="dark">
          <View style={styles.glassLayer} />
        </BlurView>
      </View>

      {/* Symmetrical tab container content */}
      <View style={styles.tabContainer}>
        {/* Sliding indicator top line */}
        <Animated.View style={[styles.indicator, indicatorStyle]} />

        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const label = options.tabBarLabel || options.title || route.name;
          const isFocused = state.index === index;

          let icon = 'heart';
          if (route.name === 'Gallery') icon = 'image';
          else if (route.name === 'Chat') icon = 'comments';
          else if (route.name === 'Timeline') icon = 'history';
          else if (route.name === 'Settings') icon = 'cog';

          if (index === 2) {
            return (
              <HomeFAB
                key={route.key}
                route={route}
                isFocused={isFocused}
              />
            );
          }

          return (
            <TabButton
              key={route.key}
              route={route}
              index={index}
              icon={icon}
              label={label}
              isFocused={isFocused}
              navigation={navigation}
              tabWidth={tabWidth}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    backgroundColor: 'transparent',
    zIndex: 1000,
    position: 'relative',
  },
  glassBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1.2,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  glassLayer: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(13, 13, 15, 0.82)',
  },
  tabContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    position: 'relative',
  },
  tabButton: {
    height: TAB_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    paddingTop: 8,
  },
  activeIconGlow: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(216, 75, 115, 0.11)',
    top: 2,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  activeLabel: {
    color: '#FF4F8B',
  },
  inactiveLabel: {
    color: 'rgba(255, 255, 255, 0.45)',
  },
  indicator: {
    position: 'absolute',
    top: 0,
    width: 28,
    height: 3.5,
    borderRadius: 1.8,
    backgroundColor: '#FF4F8B',
    shadowColor: '#FF4F8B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
    elevation: 5,
  },
  fabWrapper: {
    height: TAB_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginTop: -20,
  },
  fabBody: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF4F8B',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    overflow: 'hidden',
  },
  fabInnerRing: {
    ...StyleSheet.absoluteFill,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 26,
    margin: 2,
  },
  fabGlow: {
    position: 'absolute',
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: 'rgba(216, 75, 115, 0.18)',
  },
});