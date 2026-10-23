import { StyleSheet, View } from 'react-native';

import { alpha, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { Icon, mci } from './ui/icon';
import { Tap } from './ui/tap';
import { Txt } from './ui/text';

/**
 * Question du mode arachnophobie, posée à l’accueil et une fois sur l’écran
 * d’accueil pour les installations existantes. Sans icône d’araignée, exprès.
 */
export function SpiderQuestion({ value, onChange }: { value?: boolean; onChange: (hide: boolean) => void }) {
  const { colors } = useTheme();
  const option = (hide: boolean, label: string) => {
    const selected = value === hide;
    return (
      <Tap
        onPress={() => onChange(hide)}
        haptic="select"
        style={[
          styles.option,
          { backgroundColor: selected ? colors.accent : colors.surfaceRaised, borderColor: selected ? colors.accent : colors.border },
        ]}
        accessibilityRole="button"
        accessibilityState={{ selected }}>
        <Txt variant="smallStrong" color={selected ? colors.onAccent : colors.text} align="center">
          {label}
        </Txt>
      </Tap>
    );
  };
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.head}>
        <View style={[styles.icon, { backgroundColor: alpha('#F9A8D4', 0.2) }]}>
          <Icon icon={mci('eye-off-outline')} size={22} color="#F9A8D4" />
        </View>
        <View style={styles.flex}>
          <Txt variant="subtitle">Les araignées vous mettent mal à l’aise ?</Txt>
          <Txt variant="small" tone="secondary">
            Faunapedia peut masquer leurs photos et les remplacer par de jolies images toutes douces. Modifiable à tout moment dans le Carnet.
          </Txt>
        </View>
      </View>
      <View style={styles.options}>
        {option(true, 'Oui, les masquer')}
        {option(false, 'Non, ça va')}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, gap: 14, borderRadius: Radius.xl, borderWidth: StyleSheet.hairlineWidth },
  head: { flexDirection: 'row', gap: 14 },
  icon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1, gap: 3 },
  options: { flexDirection: 'row', gap: 10 },
  option: { flex: 1, paddingVertical: 12, borderRadius: Radius.lg, borderWidth: 1 },
});
