import * as Haptics from 'expo-haptics';
import { useMemo } from 'react';
import { Platform } from 'react-native';

import { useStore } from '@/store';

const noop = () => {};

/** Retours haptiques, désactivables dans les réglages (et absents sur le web). */
export function useHaptics() {
  const enabled = useStore((s) => s.settings.haptics) && Platform.OS !== 'web';
  return useMemo(() => {
    if (!enabled) return { tap: noop, select: noop, success: noop, error: noop, heavy: noop };
    const safe = (fn: () => Promise<void>) => () => {
      fn().catch(noop);
    };
    return {
      tap: safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
      select: safe(() => Haptics.selectionAsync()),
      success: safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
      error: safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
      heavy: safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)),
    };
  }, [enabled]);
}
