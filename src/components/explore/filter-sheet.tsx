import type { ReactNode } from 'react';
import { Modal, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Gutter, Radius } from '@/constants/theme';
import { ACTIVITIES, DIETS, HABITATS, IUCN, REGIONS } from '@/data/reference';
import type { Activity, Diet, Habitat, IucnStatus, Region } from '@/data/types';
import { useTheme } from '@/hooks/use-theme';
import { SORT_LABELS, type SortKey, type SpeciesFilters } from '@/lib/search';

import { Chip } from '../ui/chip';
import { IconButton } from '../ui/icon-button';
import { mci } from '../ui/icon';
import { Tap } from '../ui/tap';
import { Txt } from '../ui/text';

const STATUSES: IucnStatus[] = ['LC', 'NT', 'VU', 'EN', 'CR', 'EX', 'DD', 'NE'];

export interface FilterSheetProps {
  visible: boolean;
  filters: SpeciesFilters;
  sort: SortKey;
  resultCount: number;
  onChange: (f: SpeciesFilters) => void;
  onSort: (s: SortKey) => void;
  onClose: () => void;
}

function toggle<T>(list: T[] | undefined, v: T): T[] {
  const l = list ?? [];
  return l.includes(v) ? l.filter((x) => x !== v) : [...l, v];
}

/** Panneau de filtres avancés et de tri. */
export function FilterSheet({ visible, filters, sort, resultCount, onChange, onSort, onClose }: FilterSheetProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const set = (patch: Partial<SpeciesFilters>) => onChange({ ...filters, ...patch });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'}
      onRequestClose={onClose}>
      <View style={[styles.sheet, { backgroundColor: colors.background, paddingTop: Platform.OS === 'ios' ? 12 : insets.top + 8 }]}>
        <View style={styles.head}>
          <Txt variant="title" style={styles.flex}>
            Filtres
          </Txt>
          <Tap onPress={() => onChange({ groups: filters.groups })} hitSlop={8}>
            <Txt variant="smallStrong" tone="accent">
              Réinitialiser
            </Txt>
          </Tap>
          <IconButton icon={mci('close')} onPress={onClose} label="Fermer" size={38} />
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          <Block title="Trier par">
            {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
              <Chip key={k} label={SORT_LABELS[k]} selected={sort === k} onPress={() => onSort(k)} />
            ))}
          </Block>
          <Block title="Statut de conservation">
            {STATUSES.map((st) => (
              <Chip
                key={st}
                label={IUCN[st].label}
                color={IUCN[st].color}
                selected={filters.statuses?.includes(st)}
                onPress={() => set({ statuses: toggle(filters.statuses, st) })}
              />
            ))}
          </Block>
          <Block title="Milieu de vie">
            {(Object.keys(HABITATS) as Habitat[]).map((hb) => (
              <Chip
                key={hb}
                label={HABITATS[hb].label}
                icon={HABITATS[hb].icon}
                selected={filters.habitats?.includes(hb)}
                onPress={() => set({ habitats: toggle(filters.habitats, hb) })}
              />
            ))}
          </Block>
          <Block title="Région du monde">
            {(Object.keys(REGIONS) as Region[]).map((r) => (
              <Chip key={r} label={REGIONS[r].label} selected={filters.regions?.includes(r)} onPress={() => set({ regions: toggle(filters.regions, r) })} />
            ))}
          </Block>
          <Block title="Régime alimentaire">
            {(Object.keys(DIETS) as Diet[]).map((d) => (
              <Chip
                key={d}
                label={DIETS[d].label}
                icon={DIETS[d].icon}
                selected={filters.diets?.includes(d)}
                onPress={() => set({ diets: toggle(filters.diets, d) })}
              />
            ))}
          </Block>
          <Block title="Rythme d’activité">
            {(Object.keys(ACTIVITIES) as Activity[]).map((a) => (
              <Chip
                key={a}
                label={ACTIVITIES[a].label}
                icon={ACTIVITIES[a].icon}
                selected={filters.activities?.includes(a)}
                onPress={() => set({ activities: toggle(filters.activities, a) })}
              />
            ))}
          </Block>
        </ScrollView>
        <View style={[styles.footer, { paddingBottom: insets.bottom + 12, borderTopColor: colors.border }]}>
          <Tap onPress={onClose} style={[styles.cta, { backgroundColor: colors.accent }]}>
            <Txt variant="subtitle" color={colors.onAccent}>
              Afficher {resultCount} espèce{resultCount > 1 ? 's' : ''}
            </Txt>
          </Tap>
        </View>
      </View>
    </Modal>
  );
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.block}>
      <Txt variant="label" tone="muted">
        {title}
      </Txt>
      <View style={styles.chips}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: Gutter, paddingBottom: 8 },
  flex: { flex: 1 },
  content: { paddingHorizontal: Gutter, paddingBottom: 24, gap: 22 },
  block: { gap: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  footer: { paddingHorizontal: Gutter, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth },
  cta: { alignItems: 'center', paddingVertical: 16, borderRadius: Radius.lg },
});
