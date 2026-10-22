import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import type { IconRef } from '@/data/reference';
import { useTheme } from '@/hooks/use-theme';

import { Glass } from './glass';
import { Icon } from './icon';
import { Tap } from './tap';

export interface IconButtonProps {
  icon: IconRef;
  onPress: () => void;
  label: string;
  size?: number;
  color?: string;
  /** Sur photo : verre clair et icône blanche. */
  overMedia?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Bouton rond en verre (retour, favori, partage…). */
export function IconButton({ icon, onPress, label, size = 42, color, overMedia, style }: IconButtonProps) {
  const { colors } = useTheme();
  return (
    <Tap onPress={onPress} accessibilityLabel={label} hitSlop={8} scaleTo={0.9} style={style}>
      <Glass interactive style={[styles.btn, { width: size, height: size, borderRadius: size / 2 }]}>
        <Icon icon={icon} size={size * 0.48} color={color ?? (overMedia ? '#fff' : colors.text)} />
      </Glass>
    </Tap>
  );
}

const styles = StyleSheet.create({
  btn: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
});
