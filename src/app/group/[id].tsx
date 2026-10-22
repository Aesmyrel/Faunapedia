import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { SpeciesGrid } from '@/components/species/species-grid';
import { Chip } from '@/components/ui/chip';
import { HeroHeader } from '@/components/ui/hero-header';
import { ProgressBar } from '@/components/ui/progress-ring';
import { StackScreen } from '@/components/ui/stack-screen';
import { EmptyState } from '@/components/ui/states';
import { Tap } from '@/components/ui/tap';
import { Txt } from '@/components/ui/text';
import { alpha, Gutter, Radius } from '@/constants/theme';
import { SPECIES_BY_GROUP, taxonAt } from '@/data';
import { GROUPS } from '@/data/reference';
import type { GroupId } from '@/data/types';
import { useTheme } from '@/hooks/use-theme';
import { capitalize } from '@/lib/format';
import { useStore } from '@/store';

export default function GroupScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const group = GROUPS[id as GroupId];
  const species = useMemo(() => (group ? SPECIES_BY_GROUP[group.id] : []), [group]);
  const seenCount = useStore((s) => species.filter((sp) => s.seen[sp.id]).length);
  const [order, setOrder] = useState<string | null>(null);

  // Ordres représentés, pour filtrer finement au sein du groupe.
  const orders = useMemo(() => {
    const map = new Map<string, { label: string; count: number }>();
    for (const s of species) {
      const o = taxonAt(s, 'order');
      if (!o) continue;
      const cur = map.get(o.name) ?? { label: o.fr ? capitalize(o.fr) : o.name, count: 0 };
      cur.count++;
      map.set(o.name, cur);
    }
    return [...map.entries()].sort((a, b) => b[1].count - a[1].count);
  }, [species]);

  if (!group) {
    return (
      <StackScreen>
        <EmptyState title="Groupe introuvable" />
      </StackScreen>
    );
  }

  const shown = order ? species.filter((s) => taxonAt(s, 'order')?.name === order) : species;

  return (
    <StackScreen>
      <HeroHeader icon={group.icon} color={group.color} eyebrow={`${group.described} espèces décrites`} title={group.label} description={group.blurb}>
        <View style={styles.progress}>
          <Txt variant="smallStrong" tone="secondary">
            {seenCount} / {species.length} fiches découvertes
          </Txt>
          <ProgressBar progress={seenCount / species.length} color={group.color} />
        </View>
        <Tap
          onPress={() => router.push(`/taxon/${group.inatId}`)}
          style={[styles.tree, { borderColor: alpha(group.color, 0.4), backgroundColor: alpha(group.color, 0.1) }]}>
          <Txt variant="smallStrong" color={group.color}>
            Explorer {group.latin.split(',')[0]} dans l’arbre du vivant →
          </Txt>
        </Tap>
      </HeroHeader>
      {orders.length > 1 && (
        <View style={styles.orders}>
          <Chip label="Tous les ordres" selected={!order} onPress={() => setOrder(null)} size="sm" />
          {orders.map(([name, o]) => (
            <Chip key={name} label={o.label} count={o.count} selected={order === name} color={group.color} size="sm" onPress={() => setOrder(order === name ? null : name)} />
          ))}
        </View>
      )}
      <SpeciesGrid species={shown} />
      <View style={[styles.note, { borderColor: colors.border }]}>
        <Txt variant="caption" tone="muted" align="center">
          {species.length} espèces sélectionnées par Faunapedia sur {group.described} décrites. Retrouvez toutes les autres dans l’arbre du
          vivant.
        </Txt>
      </View>
    </StackScreen>
  );
}

const styles = StyleSheet.create({
  progress: { gap: 8, marginTop: 10 },
  tree: { alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 9, borderRadius: Radius.pill, borderWidth: 1, marginTop: 8 },
  orders: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: Gutter, marginBottom: 16 },
  note: { marginTop: 24, marginHorizontal: Gutter, paddingTop: 16, borderTopWidth: StyleSheet.hairlineWidth },
});
