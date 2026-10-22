import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { alpha } from '@/constants/theme';
import { MAJOR_RANKS, RANKS } from '@/data/reference';
import type { TaxonNode } from '@/data/types';
import { useTheme } from '@/hooks/use-theme';
import { capitalize } from '@/lib/format';

import { Icon, mci } from '../ui/icon';
import { Tap } from '../ui/tap';
import { Txt } from '../ui/text';

/**
 * Classification complète, du règne à l’espèce. Les rangs principaux sont mis
 * en avant ; chaque niveau ouvre l’arbre du vivant à cet endroit.
 */
export function TaxonomyLadder({ taxonomy, color }: { taxonomy: TaxonNode[]; color: string }) {
  const router = useRouter();
  const { colors } = useTheme();
  return (
    <View>
      {taxonomy.map((t, i) => {
        const major = MAJOR_RANKS.has(t.rank);
        const last = i === taxonomy.length - 1;
        return (
          <Tap
            key={t.id}
            onPress={() => router.push(`/taxon/${t.id}`)}
            scaleTo={0.99}
            haptic="select"
            style={styles.row}
            accessibilityLabel={`${RANKS[t.rank] ?? t.rank} : ${t.fr ?? t.name}`}>
            <View style={styles.rail}>
              <View style={[styles.line, { backgroundColor: i === 0 ? 'transparent' : alpha(color, 0.35) }]} />
              <View
                style={[
                  major ? styles.nodeMajor : styles.node,
                  { backgroundColor: last ? color : major ? alpha(color, 0.25) : colors.surfaceRaised, borderColor: alpha(color, 0.6) },
                ]}
              />
              <View style={[styles.line, { backgroundColor: last ? 'transparent' : alpha(color, 0.35) }]} />
            </View>
            <View style={[styles.text, !major && styles.minor]}>
              <Txt variant="label" color={major ? color : colors.textMuted}>
                {RANKS[t.rank] ?? t.rank}
              </Txt>
              <View style={styles.names}>
                <Txt variant={major ? 'subtitle' : 'small'} style={styles.flexShrink}>
                  {t.fr ? capitalize(t.fr) : t.name}
                </Txt>
                {t.fr && t.fr.toLowerCase() !== t.name.toLowerCase() && (
                  <Txt variant="sci" tone="muted" style={[styles.sci, styles.flexShrink]} numberOfLines={1}>
                    {t.name}
                  </Txt>
                )}
              </View>
            </View>
            <Icon icon={mci('chevron-right')} size={16} color={colors.textMuted} />
          </Tap>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'stretch', gap: 12, paddingRight: 4 },
  rail: { width: 16, alignItems: 'center' },
  line: { width: 2, flex: 1 },
  node: { width: 8, height: 8, borderRadius: 4, borderWidth: 1 },
  nodeMajor: { width: 14, height: 14, borderRadius: 7, borderWidth: 1.5 },
  text: { flex: 1, paddingVertical: 9, gap: 1 },
  minor: { paddingVertical: 6 },
  names: { flexDirection: 'row', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' },
  sci: { fontSize: 13.5 },
  flexShrink: { flexShrink: 1 },
});
