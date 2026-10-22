import { StyleSheet, View } from 'react-native';

import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { Tap } from './tap';
import { Txt } from './text';

/** Sélecteur segmenté (choix exclusif). */
export function Segmented<T extends string>({ options, value, onChange }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.wrap, { backgroundColor: colors.surfaceRaised }]}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Tap
            key={o.value}
            onPress={() => onChange(o.value)}
            haptic="select"
            scaleTo={0.96}
            style={[styles.item, active && { backgroundColor: colors.surface, borderColor: colors.borderStrong }]}
            accessibilityState={{ selected: active }}>
            <Txt variant="smallStrong" color={active ? colors.text : colors.textMuted}>
              {o.label}
            </Txt>
          </Tap>
        );
      })}
    </View>
  );
}

/** Interrupteur simple et accessible. */
export function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  const { colors } = useTheme();
  return (
    <Tap
      onPress={() => onChange(!value)}
      haptic="select"
      scaleTo={0.95}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={label}
      style={[styles.track, { backgroundColor: value ? colors.accent : colors.borderStrong }]}>
      <View style={[styles.thumb, { transform: [{ translateX: value ? 20 : 0 }] }]} />
    </Tap>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', padding: 3, borderRadius: Radius.md, gap: 3 },
  item: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: Radius.sm, borderWidth: StyleSheet.hairlineWidth, borderColor: 'transparent' },
  track: { width: 48, height: 28, borderRadius: 14, padding: 3, justifyContent: 'center' },
  thumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff' },
});
