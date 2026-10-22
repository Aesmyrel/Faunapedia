import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { useTheme } from '@/hooks/use-theme';

export interface ProgressRingProps {
  size: number;
  stroke?: number;
  progress: number;
  color: string;
  track?: string;
  children?: ReactNode;
}

/** Anneau de progression (0–1) avec contenu centré. */
export function ProgressRing({ size, stroke = 6, progress, color, track, children }: ProgressRingProps) {
  const { colors } = useTheme();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(1, progress));
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={track ?? colors.border} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={c * (1 - p)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.center]}>{children}</View>
    </View>
  );
}

/** Barre de progression horizontale. */
export function ProgressBar({ progress, color, height = 6, track }: { progress: number; color: string; height?: number; track?: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ height, borderRadius: height / 2, backgroundColor: track ?? colors.border, overflow: 'hidden' }}>
      <View
        style={{
          width: `${Math.max(0, Math.min(1, progress)) * 100}%`,
          height: '100%',
          borderRadius: height / 2,
          backgroundColor: color,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
});
