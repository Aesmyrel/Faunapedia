import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Gutter } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { Icon, mci } from './icon';
import { Tap } from './tap';
import { Txt } from './text';

export interface SectionProps {
  title: string;
  eyebrow?: string;
  action?: { label: string; onPress: () => void };
  children?: ReactNode;
  /** Contenu pleine largeur (carrousels) : pas de marge latérale. */
  bleed?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Bloc de contenu avec titre éditorial et action « Tout voir ». */
export function Section({ title, eyebrow, action, children, bleed, style }: SectionProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.section, style]}>
      <View style={styles.header}>
        <View style={styles.titles}>
          {eyebrow && (
            <Txt variant="label" tone="accent">
              {eyebrow}
            </Txt>
          )}
          <Txt variant="title">{title}</Txt>
        </View>
        {action && (
          <Tap onPress={action.onPress} style={styles.action} hitSlop={10} accessibilityLabel={action.label}>
            <Txt variant="smallStrong" tone="accent">
              {action.label}
            </Txt>
            <Icon icon={mci('chevron-right')} size={16} color={colors.accent} />
          </Tap>
        )}
      </View>
      <View style={!bleed && styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 14, marginTop: 30 },
  header: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: Gutter, gap: 12 },
  titles: { flex: 1, gap: 2 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingBottom: 4 },
  body: { paddingHorizontal: Gutter },
});
