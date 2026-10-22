import { ActivityIndicator, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { useEffect } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import { Radius } from '@/constants/theme';
import type { IconRef } from '@/data/reference';
import { useTheme } from '@/hooks/use-theme';

import { Icon, mci } from './icon';
import { Tap } from './tap';
import { Txt } from './text';

/** Message vide ou d’erreur, avec action facultative. */
export function EmptyState({
  icon = mci('magnify-close'),
  title,
  message,
  action,
}: {
  icon?: IconRef;
  title: string;
  message?: string;
  action?: { label: string; onPress: () => void };
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.empty}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.surfaceRaised }]}>
        <Icon icon={icon} size={30} color={colors.textMuted} />
      </View>
      <Txt variant="heading" align="center">
        {title}
      </Txt>
      {message && (
        <Txt variant="small" tone="secondary" align="center">
          {message}
        </Txt>
      )}
      {action && (
        <Tap onPress={action.onPress} style={[styles.button, { backgroundColor: colors.accentSoft }]}>
          <Txt variant="smallStrong" tone="accent">
            {action.label}
          </Txt>
        </Tap>
      )}
    </View>
  );
}

export function Loading({ label }: { label?: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.loading}>
      <ActivityIndicator color={colors.accent} />
      {label && (
        <Txt variant="small" tone="muted">
          {label}
        </Txt>
      )}
    </View>
  );
}

/** Bloc animé affiché pendant un chargement. */
export function Skeleton({ style }: { style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  const o = useSharedValue(0.5);
  useEffect(() => {
    o.set(withRepeat(withTiming(1, { duration: 800 }), -1, true));
  }, [o]);
  const animated = useAnimatedStyle(() => ({ opacity: o.get() }));
  return <Animated.View style={[{ backgroundColor: colors.surfaceRaised, borderRadius: Radius.md }, style, animated]} />;
}

const styles = StyleSheet.create({
  empty: { alignItems: 'center', gap: 10, paddingVertical: 40, paddingHorizontal: 24 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  button: { marginTop: 8, paddingHorizontal: 18, paddingVertical: 10, borderRadius: Radius.pill },
  loading: { alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 40 },
});
