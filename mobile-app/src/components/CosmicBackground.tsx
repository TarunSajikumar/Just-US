/**
 * CosmicBackground.tsx
 * 
 * Pure cosmic background without circles - just nebula glows, stars, and floating icons
 */
import React, { useEffect, useRef, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import Svg, {
  Line,
  Defs,
  RadialGradient,
  Stop,
} from 'react-native-svg';

const { width: W, height: H } = Dimensions.get('window');

// ─── Config ───────────────────────────────────────────────────────────────────
const STAR_COUNT = 70;
const PARTICLE_COUNT = 18;
const PARTICLE_MAX_DIST = 105;
const HEART_ICONS = ['❤️', '💕', '💖', '💗', '✦', '·', '♡', '💝', '❤️', '💕', '💖', '💗', '💓', '💝', '💘', '♥️'];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface Star {
  x: number;
  y: number;
  r: number;
  anim: Animated.Value;
  duration: number;
  delay: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  a: number;
}

interface ActiveHeart {
  id: string;
  char: string;
  left: number;
  fontSize: number;
  anim: Animated.Value;
  duration: number;
}

// ─── Generators ───────────────────────────────────────────────────────────────
function buildStars(): Star[] {
  return Array.from({ length: STAR_COUNT }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    r: rand(0.3, 1.2),
    anim: new Animated.Value(rand(0.1, 0.8)),
    duration: rand(2500, 5500),
    delay: rand(0, 3000),
  }));
}

function buildParticles(): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    vx: (Math.random() - 0.5) * 0.35,
    vy: (Math.random() - 0.5) * 0.35,
    r: rand(0.5, 1.6),
    a: rand(0.15, 0.45),
  }));
}

// ─── Twinkling Star ───────────────────────────────────────────────────────────
const TwinkleStar = React.memo(({ star }: { star: Star }) => {
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(star.anim, {
          toValue: rand(0.05, 0.3),
          duration: star.duration * 0.5,
          delay: star.delay,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(star.anim, {
          toValue: rand(0.4, 0.95),
          duration: star.duration * 0.5,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.View
      style={[
        styles.star,
        {
          left: star.x,
          top: star.y,
          width: star.r * 2,
          height: star.r * 2,
          opacity: star.anim,
        },
      ]}
    />
  );
});

// ─── Main Component ────────────────────────────────────────────────────────────
interface CosmicBackgroundProps {
  opacity?: number;
  isCouplePlus?: boolean;
}

export default function CosmicBackground({ opacity = 1 }: CosmicBackgroundProps) {
  const stars = useMemo(() => buildStars(), []);
  const particlesRef = useRef<Particle[]>(buildParticles());
  const [tick, setTick] = useState(0);

  // Aurora drift animation values
  const auroraX = useRef(new Animated.Value(0)).current;
  const auroraY = useRef(new Animated.Value(0)).current;

  // Floating Hearts State
  const [hearts, setHearts] = useState<ActiveHeart[]>([]);
  const heartIdCounter = useRef(0);

  // Particle positions loop
  useEffect(() => {
    let animId: number;
    const update = () => {
      particlesRef.current.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
      });
      setTick(t => t + 1);
      animId = requestAnimationFrame(update);
    };
    animId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Aurora slow-drift ellipse path
  useEffect(() => {
    const loopX = Animated.loop(
      Animated.sequence([
        Animated.timing(auroraX, {
          toValue: W * 0.18,
          duration: 10000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(auroraX, {
          toValue: -W * 0.12,
          duration: 10000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(auroraX, {
          toValue: 0,
          duration: 8000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    const loopY = Animated.loop(
      Animated.sequence([
        Animated.timing(auroraY, {
          toValue: H * 0.12,
          duration: 12000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(auroraY, {
          toValue: -H * 0.08,
          duration: 12000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(auroraY, {
          toValue: 0,
          duration: 10000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    loopX.start();
    loopY.start();
    return () => {
      loopX.stop();
      loopY.stop();
    };
  }, []);

  // Spawn floating hearts loop
  useEffect(() => {
    const spawnHeart = () => {
      const id = `heart-${heartIdCounter.current++}`;
      const char = HEART_ICONS[Math.floor(Math.random() * HEART_ICONS.length)];
      const left = Math.random() * W;
      const fontSize = rand(10, 24);
      const duration = rand(12000, 25000);
      const anim = new Animated.Value(0);

      const newHeart: ActiveHeart = { id, char, left, fontSize, anim, duration };

      setHearts(prev => [...prev.slice(-15), newHeart]);

      Animated.timing(anim, {
        toValue: -H - 100,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start(() => {
        setHearts(prev => prev.filter(h => h.id !== id));
      });
    };

    // Pre-populate some hearts
    for (let i = 0; i < 6; i++) {
      const id = `heart-pre-${i}`;
      const char = HEART_ICONS[Math.floor(Math.random() * HEART_ICONS.length)];
      const left = Math.random() * W;
      const fontSize = rand(10, 24);
      const duration = rand(12000, 25000);
      const initialY = rand(-H * 0.1, -H * 0.85);
      const anim = new Animated.Value(initialY);

      const newHeart: ActiveHeart = { id, char, left, fontSize, anim, duration };
      setHearts(prev => [...prev, newHeart]);

      Animated.timing(anim, {
        toValue: -H - 100,
        duration: duration * (1 - Math.abs(initialY) / H),
        easing: Easing.linear,
        useNativeDriver: true,
      }).start(() => {
        setHearts(prev => prev.filter(h => h.id !== id));
      });
    }

    const interval = setInterval(spawnHeart, 3200);
    return () => clearInterval(interval);
  }, []);

  // Compute connections
  const connections = useMemo(() => {
    const list: { id: string; x1: number; y1: number; x2: number; y2: number; alpha: number }[] = [];
    const pts = particlesRef.current;
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const dx = pts[i].x - pts[j].x;
        const dy = pts[i].y - pts[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < PARTICLE_MAX_DIST) {
          list.push({
            id: `${i}-${j}`,
            x1: pts[i].x,
            y1: pts[i].y,
            x2: pts[j].x,
            y2: pts[j].y,
            alpha: (1 - dist / PARTICLE_MAX_DIST) * 0.065,
          });
        }
      }
    }
    return list;
  }, [tick]);

  return (
    <View style={[styles.root, { opacity }]} pointerEvents="none">
      {/* Base black background */}
      <View style={styles.base} />

      {/* Top-Left Nebula Glow */}
      <View style={styles.nebula1} />

      {/* Bottom-Right Nebula Glow */}
      <View style={styles.nebula2} />

      {/* Slow Aurora center bloom */}
      <Animated.View
        style={[
          styles.aurora,
          {
            transform: [
              { translateX: auroraX },
              { translateY: auroraY },
            ],
          },
        ]}
      />

      {/* Star Field */}
      {stars.map((s, i) => (
        <TwinkleStar key={`star-${i}`} star={s} />
      ))}

      {/* Drifting Connected Particle Network - Lines only */}
      <Svg width={W} height={H} style={StyleSheet.absoluteFill} pointerEvents="none">
        {connections.map(c => (
          <Line
            key={c.id}
            x1={c.x1}
            y1={c.y1}
            x2={c.x2}
            y2={c.y2}
            stroke={`rgba(255,79,139,${c.alpha.toFixed(3)})`}
            strokeWidth={0.5}
          />
        ))}
      </Svg>

      {/* Rising Floating Hearts System */}
      {hearts.map(h => (
        <Animated.Text
          key={h.id}
          style={[
            styles.floatingHeart,
            {
              left: h.left,
              fontSize: h.fontSize,
              opacity: h.anim.interpolate({
                inputRange: [-H - 100, -H * 0.9, -H * 0.1, 0],
                outputRange: [0, 0.08, 0.3, 0],
                extrapolate: 'clamp',
              }),
              transform: [
                { translateY: h.anim },
                {
                  scale: h.anim.interpolate({
                    inputRange: [-H - 100, 0],
                    outputRange: [1.2, 0.5],
                    extrapolate: 'clamp',
                  }),
                },
              ],
            },
          ]}
        >
          {h.char}
        </Animated.Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  base: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
  },
  nebula1: {
    position: 'absolute',
    top: -H * 0.25,
    left: -W * 0.45,
    width: W * 1.2,
    height: W * 1.2,
  },
  nebula2: {
    position: 'absolute',
    bottom: -H * 0.3,
    right: -W * 0.4,
    width: W * 1.1,
    height: W * 1.1,
  },
  aurora: {
    position: 'absolute',
    top: H * 0.1,
    left: -W * 0.05,
    width: W * 1.1,
    height: W * 1.1,
  },
  star: {
    position: 'absolute',
    backgroundColor: '#F8F6F2',
    borderRadius: 999, // Makes stars circular but we keep it for star shapes
  },
  floatingHeart: {
    position: 'absolute',
    bottom: -50,
    color: '#FF4F8B',
  }
});