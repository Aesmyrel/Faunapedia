import { StyleSheet, View } from 'react-native';

import { alpha, Radius } from '@/constants/theme';
import type { IconRef } from '@/data/reference';
import { useTheme } from '@/hooks/use-theme';

import { Icon } from './icon';
import { Tap } from './tap';
import { Txt } from './text';

export interface ChipProps {
  label: string;
  icon?: IconRef;
  color?: string;
  selected?: boolean;
  onPress?: () => void;
  size?: 'sm' | 'md';
  count?: number;
}

/** Pastille de filtre ou d’information. */
export function Chip({ label, icon, color, selected, onPress, size = 'md', count }: ChipProps) {
  const { colors } = useTheme();
  const tint = color ?? colors.accent;
  const body = (
    <View
      style={[
        styles.chip,
        size === 'sm' && styles.sm,
        {
          backgroundColor: selected ? alpha(tint, 0.22) : colors.surfaceRaised,
          borderColor: selected ? alpha(tint, 0.7) : colors.border,
        },
      ]}>
      {icon && <Icon icon={icon} size={size === 'sm' ? 13 : 15} color={selected ? tint : colors.textSecondary} />}
      <Txt variant={size === 'sm' ? 'caption' : 'smallStrong'} color={selected ? colors.text : colors.textSecondary}>
        {label}
      </Txt>
      {count !== undefined && (
        <Txt variant="caption" tone="muted">
          {count}
        </Txt>
      )}
    </View>
  );
  if (!onPress) return body;
  return (
    <Tap onPress={onPress} haptic="select" scaleTo={0.94} accessibilityState={{ selected }}>
      {body}
    </Tap>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  sm: { paddingHorizontal: 9, paddingVertical: 5, gap: 4 },
});
