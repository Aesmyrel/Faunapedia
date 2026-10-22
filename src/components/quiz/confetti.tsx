import { useEffect, useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import { createRng } from '@/lib/random';

const COLORS = ['#E8B04B', '#38BDF8', '#F472B6', '#84CC16', '#C084FC', '#F97316', '#2DD4BF'];

interface Piece {
  x: number;
  delay: number;
  duration: number;
  size: number;
  color: string;
  rotate: number;
  drift: number;
}

/** Pluie de confettis (purement décorative). */
export function Confetti({ count = 46 }: { count?: number }) {
  const { width, height } = useWindowDimensions();
  const pieces = useMemo<Piece[]>(() => {
    // Tirage pseudo-aléatoire déterministe : le rendu reste pur.
    const rng = createRng(count * 7919 + Math.round(width));
    return Array.from({ length: count }, (_, i) => ({
      x: rng() * width,
      delay: rng() * 500,
      duration: 1800 + rng() * 1400,
      size: 6 + rng() * 8,
      color: COLORS[i % COLORS.length],
      rotate: 360 + rng() * 720,
      drift: (rng() - 0.5) * 120,
    }));
  }, [count, width]);
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.map((p, i) => (
        <ConfettiPiece key={i} piece={p} height={height} />
      ))}
    </View>
  );
}

function ConfettiPiece({ piece, height }: { piece: Piece; height: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.set(withDelay(piece.delay, withTiming(1, { duration: piece.duration, easing: Easing.out(Easing.quad) })));
  }, [t, piece]);
  const style = useAnimatedStyle(() => {
    const v = t.get();
    return {
      opacity: v < 0.85 ? 1 : (1 - v) / 0.15,
      transform: [{ translateY: -40 + v * (height + 80) }, { translateX: v * piece.drift }, { rotate: `${v * piece.rotate}deg` }],
    };
  });
  return (
    <Animated.View
      style={[
        styles.piece,
        { left: piece.x, width: piece.size, height: piece.size * 0.45, backgroundColor: piece.color, borderRadius: piece.size / 6 },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  piece: { position: 'absolute', top: 0 },
});
