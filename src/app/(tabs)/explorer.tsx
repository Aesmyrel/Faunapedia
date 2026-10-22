import { useRouter } from 'expo-router';
import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { FlatList, Platform, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FilterSheet } from '@/components/explore/filter-sheet';
import { SpeciesCard } from '@/components/species/species-card';
import { TaxonRow } from '@/components/taxon/taxon-row';
import { Chip } from '@/components/ui/chip';
import { Icon, mci } from '@/components/ui/icon';
import { SearchField } from '@/components/ui/search-field';
import { EmptyState, Loading } from '@/components/ui/states';
import { Tap } from '@/components/ui/tap';
import { Txt } from '@/components/ui/text';
import { alpha, Gutter, MaxContentWidth, Radius, TabBarInset } from '@/constants/theme';
import { getSpeciesByInatId, SPECIES } from '@/data';
import { GROUP_ORDER, GROUPS } from '@/data/reference';
import type { GroupId, Species } from '@/data/types';
import { useRemote } from '@/hooks/use-remote';
import { useTheme } from '@/hooks/use-theme';
import { searchAnimals } from '@/lib/api';
import { countActiveFilters, createSearch, SORT_LABELS, type SortKey, type SpeciesFilters } from '@/lib/search';

const search = createSearch(SPECIES);

export default function ExploreScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SpeciesFilters>({});
  const [sort, setSort] = useState<SortKey>('relevance');
  const [grid, setGrid] = useState(true);
  const [sheet, setSheet] = useState(false);
  const deferred = useDeferredValue(query);

  const results = useMemo(() => search(deferred, filters, sort), [deferred, filters, sort]);
  const activeFilters = countActiveFilters(filters);
  const selectedGroup = filters.groups?.[0];

  // Recherche mondiale (iNaturalist) avec un léger délai de frappe.
  const [worldQuery, setWorldQuery] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setWorldQuery(query.trim()), 450);
    return () => clearTimeout(t);
  }, [query]);
  const world = useRemote(worldQuery.length >= 3 ? `world-${worldQuery}` : null, () => searchAnimals(worldQuery));
  const worldResults = (world.data ?? []).filter((t) => !getSpeciesByInatId(t.id)).slice(0, 8);

  const columns = grid ? (width >= 700 ? 3 : 2) : 1;
  const contentW = Math.min(width, MaxContentWidth);
  const cardW = (contentW - Gutter * 2 - 12 * (columns - 1)) / columns;
  const top = Platform.OS === 'ios' ? 8 : insets.top + 12;

  const setGroup = (g?: GroupId) => setFilters((f) => ({ ...f, groups: g ? [g] : undefined }));

  const header = (
    <View style={styles.header}>
      <View style={styles.titleRow}>
        <View style={styles.flex}>
          <Txt variant="label" tone="muted">
            {SPECIES.length} fiches · 12 groupes
          </Txt>
          <Txt variant="display">Explorer</Txt>
        </View>
        <Tap
          onPress={() => router.push('/taxon/1')}
          style={[styles.treeBtn, { backgroundColor: alpha('#84CC16', 0.14), borderColor: alpha('#84CC16', 0.4) }]}
          accessibilityLabel="Arbre du vivant">
          <Icon icon={mci('family-tree')} size={18} color="#84CC16" />
          <Txt variant="smallStrong" color="#84CC16">
            Arbre du vivant
          </Txt>
        </Tap>
      </View>
      <SearchField value={query} onChange={setQuery} placeholder="Nom français, latin, famille…" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.groups} style={styles.groupsScroll}>
        <Chip label="Tous" selected={!selectedGroup} onPress={() => setGroup(undefined)} />
        {GROUP_ORDER.map((g) => (
          <Chip
            key={g}
            label={GROUPS[g].label}
            icon={GROUPS[g].icon}
            color={GROUPS[g].color}
            selected={selectedGroup === g}
            onPress={() => setGroup(selectedGroup === g ? undefined : g)}
          />
        ))}
      </ScrollView>
      <View style={styles.toolbar}>
        <Txt variant="smallStrong" tone="secondary" style={styles.flex}>
          {results.length} espèce{results.length > 1 ? 's' : ''}
          {sort !== 'relevance' ? ` · ${SORT_LABELS[sort]}` : ''}
        </Txt>
        <Tap onPress={() => setSheet(true)} style={[styles.tool, { backgroundColor: activeFilters ? colors.accentSoft : colors.surfaceRaised }]} haptic="select">
          <Icon icon={mci('tune-variant')} size={18} color={activeFilters ? colors.accent : colors.textSecondary} />
          <Txt variant="smallStrong" color={activeFilters ? colors.accent : colors.textSecondary}>
            Filtres{activeFilters ? ` (${activeFilters})` : ''}
          </Txt>
        </Tap>
        <Tap onPress={() => setGrid((g) => !g)} style={[styles.tool, { backgroundColor: colors.surfaceRaised }]} haptic="select" accessibilityLabel="Changer l’affichage">
          <Icon icon={mci(grid ? 'view-list' : 'view-grid')} size={18} color={colors.textSecondary} />
        </Tap>
      </View>
    </View>
  );

  const footer = (
    <View style={styles.footer}>
      {worldQuery.length >= 3 && (
        <View style={styles.world}>
          <View style={styles.worldHead}>
            <Icon icon={mci('earth')} size={18} color={colors.accent} />
            <Txt variant="heading">Dans toute la faune mondiale</Txt>
          </View>
          <Txt variant="small" tone="muted">
            Résultats iNaturalist au-delà des fiches Faunapedia.
          </Txt>
          {world.loading ? (
            <Loading />
          ) : worldResults.length ? (
            worldResults.map((t) => <TaxonRow key={t.id} taxon={t} />)
          ) : (
            <Txt variant="small" tone="muted" style={styles.worldEmpty}>
              {world.error ? 'Recherche mondiale indisponible hors connexion.' : 'Aucun autre résultat.'}
            </Txt>
          )}
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.fill, { backgroundColor: colors.background }]}>
      <FlatList<Species>
        key={`cols-${columns}`}
        data={results}
        numColumns={columns}
        keyExtractor={(s) => s.id}
        renderItem={({ item }) =>
          grid ? (
            <SpeciesCard species={item} variant="tile" width={cardW} />
          ) : (
            <View style={styles.listItem}>
              <SpeciesCard species={item} variant="row" />
            </View>
          )
        }
        columnWrapperStyle={columns > 1 ? styles.columns : undefined}
        ListHeaderComponent={header}
        ListFooterComponent={footer}
        ListEmptyComponent={
          <EmptyState
            title="Aucune espèce trouvée"
            message={activeFilters ? 'Essayez d’assouplir les filtres.' : 'Essayez un autre nom, ou consultez les résultats mondiaux ci-dessous.'}
            action={activeFilters ? { label: 'Effacer les filtres', onPress: () => setFilters({ groups: filters.groups }) } : undefined}
          />
        }
        contentContainerStyle={[styles.content, { paddingTop: top, paddingBottom: TabBarInset }]}
        contentInsetAdjustmentBehavior="automatic"
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        initialNumToRender={10}
        windowSize={7}
        removeClippedSubviews={Platform.OS === 'android'}
      />
      <FilterSheet
        visible={sheet}
        filters={filters}
        sort={sort}
        resultCount={results.length}
        onChange={setFilters}
        onSort={setSort}
        onClose={() => setSheet(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  flex: { flex: 1 },
  content: { width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' },
  header: { paddingHorizontal: Gutter, gap: 14, marginBottom: 14 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  treeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: Radius.pill,
    borderWidth: 1,
    marginBottom: 4,
  },
  groupsScroll: { marginHorizontal: -Gutter },
  groups: { paddingHorizontal: Gutter, gap: 8 },
  toolbar: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tool: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radius.pill },
  columns: { gap: 12, paddingHorizontal: Gutter, marginBottom: 12 },
  listItem: { paddingHorizontal: Gutter },
  footer: { paddingHorizontal: Gutter },
  world: { marginTop: 24, gap: 6 },
  worldHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  worldEmpty: { paddingVertical: 12 },
});
