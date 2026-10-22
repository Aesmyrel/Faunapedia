import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import type { ReactNode } from 'react';
import { Platform, type StyleProp, View, type ViewStyle } from 'react-native';

import { alpha } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const LIQUID = Platform.OS === 'ios' && isLiquidGlassAvailable();

export interface GlassProps {
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
  intensity?: number;
  interactive?: boolean;
}

/**
 * Surface translucide : Liquid Glass natif sur iOS 26, flou sur iOS plus
 * ancien et le web. Sans flou sur Android, le fond reste presque opaque pour
 * que le texte défilant dessous ne gêne pas la lecture.
 */
export function Glass({ style, children, intensity = 45, interactive }: GlassProps) {
  const { dark, colors } = useTheme();
  if (LIQUID) {
    return (
      <GlassView style={style} colorScheme={dark ? 'dark' : 'light'} isInteractive={interactive}>
        {children}
      </GlassView>
    );
  }
  if (Platform.OS === 'android') {
    return <View style={[{ backgroundColor: alpha(colors.surface, 0.95) }, style]}>{children}</View>;
  }
  return (
    <BlurView
      intensity={intensity}
      tint={dark ? 'dark' : 'light'}
      style={[{ overflow: 'hidden', backgroundColor: dark ? 'rgba(10,12,14,0.35)' : 'rgba(255,255,255,0.4)' }, style]}>
      {children}
    </BlurView>
  );
}
