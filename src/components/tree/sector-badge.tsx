import { StyleSheet } from 'react-native';
import Animated, { Extrapolation, interpolate, type SharedValue, useAnimatedStyle } from 'react-native-reanimated';

import { alpha } from '@/constants/theme';
import { GROUPS } from '@/data/reference';
import type { GroupId } from '@/data/types';

import { Icon } from '../ui/icon';
import { Tap } from '../ui/tap';

import { BADGE_ZOOM } from './tree-data';

const SIZE = 30;

/** Pastille d’un groupe sur le pourtour de l’arbre ; la toucher zoome sur le groupe. */
export function SectorBadge({
  group,
  angle,
  distance,
  cx,
  cy,
  rim,
  s,
  tx,
  ty,
  dimmed,
  onPress,
}: {
  group: GroupId;
  angle: number;
  /** Distance au pourtour, en points. */
  distance: number;
  cx: number;
  cy: number;
  /** Rayon du pourtour au zoom 1, en points. */
  rim: number;
  s: SharedValue<number>;
  tx: SharedValue<number>;
  ty: SharedValue<number>;
  dimmed: boolean;
  onPress: (group: GroupId) => void;
}) {
  const info = GROUPS[group];
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const style = useAnimatedStyle(() => {
    const r = s.get() * rim + distance;
    return {
      opacity: interpolate(s.get(), [BADGE_ZOOM - 0.3, BADGE_ZOOM], [1, 0], Extrapolation.CLAMP) * (dimmed ? 0.35 : 1),
      transform: [{ translateX: cx + tx.get() + r * cos - SIZE / 2 }, { translateY: cy + ty.get() + r * sin - SIZE / 2 }],
    };
  });
  return (
    <Animated.View style={[styles.wrap, style]}>
      <Tap
        onPress={() => onPress(group)}
        hitSlop={6}
        scaleTo={0.88}
        haptic="select"
        accessibilityLabel={`Zoomer sur : ${info.label}`}
        style={[styles.badge, { backgroundColor: alpha(info.color, 0.2), borderColor: alpha(info.color, 0.6) }]}>
        <Icon icon={info.icon} size={15} color={info.color} />
      </Tap>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, top: 0 },
  badge: { width: SIZE, height: SIZE, borderRadius: SIZE / 2, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
