import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { alpha, Radius } from '@/constants/theme';
import { useHaptics } from '@/hooks/use-haptics';
import { useTheme } from '@/hooks/use-theme';
import { BADGES_BY_ID, levelFromXp, xpForLevel } from '@/lib/progress';
import { useStore } from '@/store';

import { Glass } from './ui/glass';
import { Icon, mci } from './ui/icon';
import { Tap } from './ui/tap';
import { Txt } from './ui/text';

/** Affiche une à une les célébrations (badge débloqué, niveau atteint). */
export function CelebrationHost() {
  const current = useStore((s) => s.celebrations[0]);
  const shift = useStore((s) => s.shiftCelebration);
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const h = useHaptics();

  useEffect(() => {
    if (!current) return;
    h.success();
    const t = setTimeout(shift, 3600);
    return () => clearTimeout(t);
  }, [current, shift, h]);

  if (!current) return null;

  let title: string;
  let subtitle: string;
  let color: string;
  let icon = mci('star-four-points');
  if (current.type === 'badge') {
    const b = BADGES_BY_ID[current.id];
    title = `Badge débloqué : ${b?.title ?? current.id}`;
    subtitle = b?.description ?? '';
    color = b?.color ?? colors.accent;
    if (b) icon = b.icon;
  } else {
    const info = levelFromXp(xpForLevel(current.level));
    title = `Niveau ${current.level} atteint !`;
    subtitle = info.rank.from === current.level ? `Nouveau rang : ${info.rank.title}` : info.rank.title;
    color = colors.accent;
    icon = mci('chevron-triple-up');
  }

  return (
    <View pointerEvents="box-none" style={[StyleSheet.absoluteFill, { paddingTop: insets.top + 8 }]}>
      <Animated.View
        key={current.type === 'badge' ? current.id : `lvl-${current.level}`}
        entering={FadeInUp.springify().damping(16)}
        exiting={FadeOutUp.duration(200)}
        style={styles.wrap}>
        <Tap onPress={shift} accessibilityLabel={title}>
          <Glass style={[styles.toast, { borderColor: alpha(color, 0.5) }]}>
            <View style={[styles.icon, { backgroundColor: alpha(color, 0.2) }]}>
              <Icon icon={icon} size={22} color={color} />
            </View>
            <View style={styles.text}>
              <Txt variant="smallStrong">{title}</Txt>
              {subtitle ? (
                <Txt variant="caption" tone="secondary" numberOfLines={2}>
                  {subtitle}
                </Txt>
              ) : null}
            </View>
          </Glass>
        </Tap>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, alignItems: 'center' },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    paddingRight: 18,
    borderRadius: Radius.xl,
    borderWidth: 1,
    maxWidth: 520,
  },
  icon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  text: { flexShrink: 1, gap: 2 },
});
