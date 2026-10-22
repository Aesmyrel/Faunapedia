import { StyleSheet, View } from 'react-native';

import { alpha, Radius } from '@/constants/theme';
import type { IconRef } from '@/data/reference';
import type { Stats } from '@/data/types';
import { useTheme } from '@/hooks/use-theme';
import { formatLength, formatLifespan, formatSpeed, formatWeight } from '@/lib/format';

import { Icon, mci } from '../ui/icon';
import { Txt } from '../ui/text';

interface StatItem {
  label: string;
  value: string;
  icon: IconRef;
  color: string;
}

export function statItems(stats: Stats): StatItem[] {
  const items: StatItem[] = [];
  if (stats.length) items.push({ label: 'Longueur', value: formatLength(stats.length), icon: mci('ruler'), color: '#38BDF8' });
  if (stats.height) items.push({ label: 'Hauteur', value: formatLength(stats.height), icon: mci('human-male-height'), color: '#2DD4BF' });
  if (stats.wingspan) items.push({ label: 'Envergure', value: formatLength(stats.wingspan), icon: mci('arrow-expand-horizontal'), color: '#A78BFA' });
  if (stats.weight) items.push({ label: 'Poids', value: formatWeight(stats.weight), icon: mci('weight'), color: '#F5A524' });
  if (stats.lifespan) items.push({ label: 'Longévité', value: formatLifespan(stats.lifespan), icon: mci('timer-sand'), color: '#F472B6' });
  if (stats.speed) items.push({ label: 'Vitesse max.', value: formatSpeed(stats.speed), icon: mci('speedometer'), color: '#F97316' });
  return items;
}

/** Grille des mensurations clés. */
export function StatGrid({ stats }: { stats: Stats }) {
  const { colors } = useTheme();
  const items = statItems(stats);
  if (!items.length) return null;
  return (
    <View style={styles.grid}>
      {items.map((it) => (
        <View key={it.label} style={[styles.tile, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.icon, { backgroundColor: alpha(it.color, 0.16) }]}>
            <Icon icon={it.icon} size={18} color={it.color} />
          </View>
          <Txt variant="label" tone="muted">
            {it.label}
          </Txt>
          <Txt variant="subtitle" adjustsFontSizeToFit numberOfLines={1}>
            {it.value}
          </Txt>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: { flexGrow: 1, flexBasis: '30%', minWidth: 100, padding: 12, gap: 6, borderRadius: Radius.lg, borderWidth: StyleSheet.hairlineWidth },
  icon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
});
