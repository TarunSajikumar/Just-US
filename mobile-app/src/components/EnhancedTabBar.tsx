/**
 * EnhancedTabBar — Curved Notch Style (Transparent Glass Dark Theme)
 *
 * Design: Floating pill-shaped transparent glass tab bar with a smooth
 * curved notch at the top-center that elevates the Home FAB button.
 * Matches the reference image but in a dark transparent aesthetic.
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Pressable,
  Platform,
} from 'react-native';
import Svg, { Path, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  MessageSquare,
  Clock,
  Image as ImageIcon,
  Settings,
  Heart,
} from 'lucide-react-native';
import { COLORS } from '../theme/colors';

// ─── Constants ────────────────────────────────────────────────────────────────
const { width: W } = Dimensions.get('window');
const BAR_H = 64;           // flat bar height
const NOTCH_H = 30;         // how high the notch peak rises above bar top
const NOTCH_W = W * 0.30;   // width of the curved notch area
const CORNER_R = 24;        // pill corner radius
const FAB_SIZE = 54;        // center home FAB diameter
const TAB_W = W / 5;        // each tab width
const SVG_H = BAR_H + NOTCH_H; // total height of the SVG shape

// ─── Build SVG Path ───────────────────────────────────────────────────────────
// Creates a pill shape with a smooth upward curved bump at the top center.
// Coordinates: y=0 is at the PEAK of the bump, y=NOTCH_H is the flat bar top.
function buildNotchPath(): string {
  const cx = W / 2;
  const nw2 = NOTCH_W / 2;          // half notch width
  const ctrl = nw2 * 0.52;          // cubic bezier control magnitude
  const topY = NOTCH_H;             // bar's flat top y-coordinate
  const botY = NOTCH_H + BAR_H;     // bar's bottom y-coordinate

  return [
    // Start bottom-left after corner arc
    `M ${CORNER_R} ${botY}`,
    // Bottom-left rounded corner
    `Q 0 ${botY} 0 ${botY - CORNER_R}`,
    // Left side up
    `L 0 ${topY + CORNER_R}`,
    // Top-left rounded corner
    `Q 0 ${topY} ${CORNER_R} ${topY}`,
    // Top-left flat edge going toward notch
    `L ${cx - nw2 - ctrl} ${topY}`,
    // Smooth cubic bezier up into the notch (left side of bump)
    `C ${cx - nw2} ${topY} ${cx - ctrl * 0.4} 0 ${cx} 0`,
    // Smooth cubic bezier back down (right side of bump)
    `C ${cx + ctrl * 0.4} 0 ${cx + nw2} ${topY} ${cx + nw2 + ctrl} ${topY}`,
    // Top-right flat edge
    `L ${W - CORNER_R} ${topY}`,
    // Top-right rounded corner
    `Q ${W} ${topY} ${W} ${topY + CORNER_R}`,
    // Right side down
    `L ${W} ${botY - CORNER_R}`,
    // Bottom-right rounded corner
    `Q ${W} ${botY} ${W - CORNER_R} ${botY}`,
    // Close
    `Z`,
  ].join(' ');
}

const NOTCH_PATH = buildNotchPath();

// ─── Icon helper ─────────────────────────────────────────────────────────────
function TabIcon({
  name,
  color,
  size,
  isFocused,
}: {
  name: string;
  color: string;
  size: number;
  isFocused: boolean;
}) {
  const w = isFocused ? 2.3 : 1.8;
  switch (name) {
    case 'Gallery':  return <ImageIcon   color={color} size={size} strokeWidth={w} />;
    case 'Chat':     return <MessageSquare color={color} size={size} strokeWidth={w} />;
    case 'Timeline': return <Clock        color={color} size={size} strokeWidth={w} />;
    case 'Settings': return <Settings     color={color} size={size} strokeWidth={w} />;
    default:         return <Heart        color={color} size={size} strokeWidth={w} fill={isFocused ? color : 'transparent'} />;
  }
}

// ─── Regular Tab Button ───────────────────────────────────────────────────────
function TabButton({
  route,
  isFocused,
  navigation,
  label,
}: {
  route: any;
  isFocused: boolean;
  navigation: any;
  label: string;
}) {
  const iconScale  = useSharedValue(isFocused ? 1.1 : 0.95);
  const iconShift  = useSharedValue(isFocused ? -3 : 0);
  const dotOpacity = useSharedValue(isFocused ? 1 : 0);
  const dotScale   = useSharedValue(isFocused ? 1 : 0);

  useEffect(() => {
    iconScale.value  = withSpring(isFocused ? 1.1 : 0.95, { damping: 14, stiffness: 140 });
    iconShift.value  = withSpring(isFocused ? -3 : 0,     { damping: 14, stiffness: 140 });
    dotOpacity.value = withTiming(isFocused ? 1 : 0,      { duration: 200 });
    dotScale.value   = withSpring(isFocused ? 1 : 0,      { damping: 12, stiffness: 150 });
  }, [isFocused]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }, { translateY: iconShift.value }],
  }));
  const dotStyle = useAnimatedStyle(() => ({
    opacity: dotOpacity.value,
    transform: [{ scale: dotScale.value }],
  }));

  const handlePress = () => {
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
  };

  const color = isFocused ? '#FF4F8B' : 'rgba(255,255,255,0.42)';

  return (
    <Pressable
      onPress={handlePress}
      style={[styles.tabButton, { width: TAB_W }]}
      android_ripple={{ color: 'rgba(255,79,139,0.15)', borderless: true, radius: 28 }}
    >
      <Animated.View style={[styles.iconBox, iconStyle]}>
        <TabIcon name={route.name} color={color} size={23} isFocused={isFocused} />
      </Animated.View>

      {/* Active dot indicator */}
      <Animated.View style={[styles.activeDot, dotStyle]} />

      <Text style={[styles.tabLabel, { color }]}>{label}</Text>
    </Pressable>
  );
}

// ─── Center Home FAB ──────────────────────────────────────────────────────────
function HomeFAB({
  route,
  isFocused,
  navigation,
}: {
  route: any;
  isFocused: boolean;
  navigation: any;
}) {
  // Heartbeat pulse
  const fabScale  = useSharedValue(1);
  const ringScale = useSharedValue(1);
  const ringAlpha = useSharedValue(0);

  useEffect(() => {
    const beat = () => {
      fabScale.value = withSequence(
        withSpring(1.13, { damping: 5, stiffness: 220 }),
        withSpring(1.0,  { damping: 5, stiffness: 220 }),
        withSpring(1.07, { damping: 5, stiffness: 220 }),
        withSpring(1.0,  { damping: 7, stiffness: 180 }),
      );
      ringScale.value = withSequence(
        withTiming(1,    { duration: 0 }),
        withTiming(1.65, { duration: 700 }),
      );
      ringAlpha.value = withSequence(
        withTiming(0.6, { duration: 80 }),
        withTiming(0,   { duration: 620 }),
      );
    };
    beat();
    const id = setInterval(beat, 2500);
    return () => clearInterval(id);
  }, []);

  const fabStyle  = useAnimatedStyle(() => ({ transform: [{ scale: fabScale.value }] }));
  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringAlpha.value,
  }));

  const handlePress = () => {
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
  };

  return (
    <Pressable
      onPress={handlePress}
      style={[styles.fabWrapper, { width: TAB_W }]}
    >
      {/* Expanding pulse ring */}
      <Animated.View style={[styles.fabRing, ringStyle]} />

      {/* The FAB button */}
      <Animated.View style={[styles.fabBodyWrap, fabStyle]}>
        <LinearGradient
          colors={['#FF6BAE', '#FF1A5E', '#C21050']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabBody}
        >
          {/* Inner border shimmer */}
          <View style={styles.fabInnerBorder} />
          <Heart color="#fff" size={25} fill="#fff" strokeWidth={1.5} />
        </LinearGradient>
      </Animated.View>

      {/* Label */}
      <Text style={[styles.tabLabel, { color: isFocused ? '#FF4F8B' : 'rgba(255,255,255,0.42)', marginTop: 5 }]}>
        Home
      </Text>
    </Pressable>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function EnhancedTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  const bottomPad = insets.bottom > 0 ? insets.bottom : (Platform.OS === 'ios' ? 20 : 10);

  return (
    <View style={[styles.outerWrap, { paddingBottom: bottomPad }]}>
      {/* ── SVG background shape (curved notch pill) ── */}
      <View style={styles.svgWrap} pointerEvents="none">
        <Svg width={W} height={SVG_H}>
          <Defs>
            {/* Subtle top-edge glow stroke gradient */}
            <SvgLinearGradient id="borderGrad" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0"   stopColor="#FF4F8B" stopOpacity="0.05" />
              <Stop offset="0.4" stopColor="#FF4F8B" stopOpacity="0.35" />
              <Stop offset="0.5" stopColor="#FF6BB0" stopOpacity="0.55" />
              <Stop offset="0.6" stopColor="#FF4F8B" stopOpacity="0.35" />
              <Stop offset="1"   stopColor="#FF4F8B" stopOpacity="0.05" />
            </SvgLinearGradient>
            <SvgLinearGradient id="fillGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0"   stopColor="#0F0F14" stopOpacity="0.42" />
              <Stop offset="1"   stopColor="#090910" stopOpacity="0.52" />
            </SvgLinearGradient>
          </Defs>

          {/* Fill — dark transparent glass */}
          <Path d={NOTCH_PATH} fill="url(#fillGrad)" />
          {/* Border stroke — glowing pink */}
          <Path
            d={NOTCH_PATH}
            fill="none"
            stroke="url(#borderGrad)"
            strokeWidth={1.2}
          />
        </Svg>
      </View>

      {/* ── Tab content row ── */}
      <View style={styles.tabRow}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const label: string = options.tabBarLabel ?? options.title ?? route.name;
          const isFocused = state.index === index;

          if (route.name === 'Home') {
            return (
              <HomeFAB
                key={route.key}
                route={route}
                isFocused={isFocused}
                navigation={navigation}
              />
            );
          }

          return (
            <TabButton
              key={route.key}
              route={route}
              isFocused={isFocused}
              navigation={navigation}
              label={label}
            />
          );
        })}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  outerWrap: {
    width: W,
    position: 'relative',
    backgroundColor: 'transparent',
    // Horizontal margin so the pill "floats" slightly inset
    // We account for this in svgWrap / tabRow
  },
  svgWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: W,
    height: SVG_H,
  },

  // Tab row sits inside the SVG shape; the top portion (NOTCH_H px) is for the FAB
  tabRow: {
    width: W,
    height: SVG_H,
    flexDirection: 'row',
    alignItems: 'flex-end',   // align regular tabs to bar bottom region
    justifyContent: 'space-around',
    overflow: 'visible',
  },

  // Regular tab button sits in the BAR_H zone
  tabButton: {
    height: BAR_H,
    width: TAB_W,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 8,
  },
  iconBox: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginTop: 2,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FF4F8B',
    marginTop: 3,
    shadowColor: '#FF4F8B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 4,
  },

  // ── Home FAB lives in the NOTCH zone ──
  fabWrapper: {
    width: TAB_W,
    height: SVG_H,                   // full height of SVG
    justifyContent: 'flex-start',     // push FAB to the top (notch peak area)
    alignItems: 'center',
    paddingTop: 0,                    // FAB body top-aligned with SVG top = notch peak
    overflow: 'visible',
  },
  fabRing: {
    position: 'absolute',
    top: (SVG_H - FAB_SIZE) / 2 - (FAB_SIZE * 0.65 - FAB_SIZE) / 2 - NOTCH_H,
    width: FAB_SIZE + 22,
    height: FAB_SIZE + 22,
    borderRadius: (FAB_SIZE + 22) / 2,
    borderWidth: 1.5,
    borderColor: 'rgba(255,79,139,0.55)',
    left: (TAB_W - FAB_SIZE - 22) / 2,
  },
  fabBodyWrap: {
    marginTop: 2,           // slight offset from peak of notch
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    shadowColor: '#FF1A5E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.65,
    shadowRadius: 14,
    elevation: 14,
    overflow: 'visible',
  },
  fabBody: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  fabInnerBorder: {
    position: 'absolute',
    top: 3,
    left: 3,
    right: 3,
    bottom: 3,
    borderRadius: (FAB_SIZE - 6) / 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
});
