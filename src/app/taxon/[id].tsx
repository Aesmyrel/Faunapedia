import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { DistributionMap } from '@/components/species/distribution-map';
import { SoundSection } from '@/components/species/sound-player';
import { WikiReader } from '@/components/species/wiki-reader';
import { TaxonRow } from '@/components/taxon/taxon-row';
import { Chip } from '@/components/ui/chip';
import { Icon, mci } from '@/components/ui/icon';
import { Section } from '@/components/ui/section';
import { StackScreen } from '@/components/ui/stack-screen';
import { EmptyState, Loading, Skeleton } from '@/components/ui/states';
import { StatusBadge } from '@/components/ui/status-badge';
import { Tap } from '@/components/ui/tap';
import { Txt } from '@/components/ui/text';
import { alpha, Gutter, MaxContentWidth, Radius } from '@/constants/theme';
import { getSpeciesByInatId } from '@/data';
import { IUCN, RANKS } from '@/data/reference';
import type { IucnStatus } from '@/data/types';
import { useRemote } from '@/hooks/use-remote';
import { useTheme } from '@/hooks/use-theme';
import { fetchJson, getChildren, getTaxon, getWikiSummary, type INatTaxon, inatPhoto, inatTaxonUrl } from '@/lib/api';
import { capitalize, formatCompact, formatCredit } from '@/lib/format';
import { useStore } from '@/store';

type ChildSort = 'popular' | 'alpha' | 'diverse';

const IUCN_BY_NUMBER: Record<number, IucnStatus> = { 10: 'LC', 20: 'NT', 30: 'VU', 40: 'EN', 50: 'CR', 60: 'EW', 70: 'EX' };

export default function TaxonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const taxonId = Number(id);
  const router = useRouter();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const bump = useStore((s) => s.bump);
  const [sort, setSort] = useState<ChildSort>('popular');

  const taxon = useRemote(`taxon-${taxonId}`, () => getTaxon(taxonId));
  const t = taxon.data;
  const isSpecies = t ? t.rank_level <= 10 : false;
  const children = useRemote(t && !isSpecies ? `children-${taxonId}` : null, () => getChildren(taxonId));
  // Nom extrait avant les closures : le compilateur React lit leurs dépendances au rendu.
  const sciName = t?.name ?? '';
  const summary = useRemote(sciName ? `wiki-sum-${sciName}` : null, () => getWikiSummary(sciName));
  const gbif = useRemote(sciName && isSpecies ? `gbif-match-${sciName}` : null, () =>
    fetchJson<{ usageKey?: number; acceptedUsageKey?: number; matchType?: string }>(
      `https://api.gbif.org/v1/species/match?kingdom=Animalia&name=${encodeURIComponent(sciName)}`,
    ),
  );

  useEffect(() => {
    if (Number.isFinite(taxonId)) bump('taxa');
  }, [taxonId, bump]);

  const curated = t && isSpecies ? getSpeciesByInatId(t.id) : undefined;
  const sortedChildren = useMemo(() => {
    const list = [...(children.data ?? [])];
    if (sort === 'alpha') list.sort((a, b) => (a.preferred_common_name ?? a.name).localeCompare(b.preferred_common_name ?? b.name, 'fr'));
    if (sort === 'diverse') list.sort((a, b) => (b.complete_species_count ?? 0) - (a.complete_species_count ?? 0));
    return list;
  }, [children.data, sort]);

  if (!Number.isFinite(taxonId)) {
    return (
      <StackScreen>
        <EmptyState title="Taxon introuvable" />
      </StackScreen>
    );
  }

  if (taxon.loading && !t) {
    return (
      <StackScreen>
        <View style={styles.pad}>
          <Skeleton style={{ height: 200, borderRadius: Radius.xl }} />
          <Skeleton style={{ height: 36, width: '70%' }} />
          <Skeleton style={{ height: 18, width: '40%' }} />
        </View>
      </StackScreen>
    );
  }

  if (taxon.error || !t) {
    return (
      <StackScreen>
        <EmptyState
          icon={mci('wifi-off')}
          title="Connexion nécessaire"
          message="L’arbre du vivant est chargé en direct depuis iNaturalist."
          action={{ label: 'Réessayer', onPress: taxon.reload }}
        />
      </StackScreen>
    );
  }

  const ancestors = (t.ancestors ?? []).filter((a) => a.rank !== 'stateofmatter');
  const title = t.preferred_common_name ? capitalize(t.preferred_common_name) : t.name;
  const photo = inatPhoto(t.default_photo, 'large');
  const cs = t.conservation_status;
  const status = cs && !cs.place && /iucn/i.test(cs.authority ?? '') && cs.iucn ? IUCN_BY_NUMBER[cs.iucn] : undefined;
  const gbifKey = gbif.data?.matchType && gbif.data.matchType !== 'NONE' ? (gbif.data.acceptedUsageKey ?? gbif.data.usageKey) : undefined;
  const photos = (t.taxon_photos ?? []).filter((p) => p.photo.license_code).slice(0, 8);
  const contentW = Math.min(width, MaxContentWidth);

  return (
    <StackScreen>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.crumbs}>
        {ancestors.map((a) => (
          <Tap key={a.id} onPress={() => router.push(`/taxon/${a.id}`)} style={styles.crumb} haptic="select" scaleTo={0.95}>
            <Txt variant="caption" tone="muted">
              {a.preferred_common_name ? capitalize(a.preferred_common_name) : a.name}
            </Txt>
            <Icon icon={mci('chevron-right')} size={14} color={colors.textMuted} />
          </Tap>
        ))}
        <Txt variant="caption" tone="accent">
          {title}
        </Txt>
      </ScrollView>

      <Animated.View entering={FadeIn} style={styles.pad}>
        {photo && (
          <View style={[styles.banner, { width: contentW - Gutter * 2 }]}>
            <Image source={{ uri: photo }} style={StyleSheet.absoluteFill} contentFit="cover" transition={250} />
            <LinearGradient colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.6)']} style={StyleSheet.absoluteFill} />
            {t.default_photo?.attribution && (
              <Txt variant="caption" color="rgba(255,255,255,0.75)" style={styles.credit} numberOfLines={1}>
                {formatCredit(t.default_photo.attribution)}
              </Txt>
            )}
          </View>
        )}
        <Txt variant="label" tone="accent">
          {RANKS[t.rank] ?? t.rank}
          {t.extinct ? ' · éteint' : ''}
        </Txt>
        <Txt variant="display">{title}</Txt>
        {t.preferred_common_name && (
          <Txt variant="sci" tone="secondary" style={styles.sci}>
            {t.name}
          </Txt>
        )}
        <View style={styles.stats}>
          {!isSpecies && t.complete_species_count ? (
            <Stat label="Espèces" value={formatCompact(t.complete_species_count)} />
          ) : null}
          {t.observations_count ? <Stat label="Observations" value={formatCompact(t.observations_count)} /> : null}
          {status && <StatusBadge status={status} label />}
        </View>
        {curated && (
          <Tap
            onPress={() => router.push(`/species/${curated.id}`)}
            style={[styles.curated, { backgroundColor: colors.accentSoft, borderColor: alpha(colors.accent, 0.4) }]}>
            <Icon icon={mci('book-open-variant')} size={22} color={colors.accent} />
            <View style={styles.flex}>
              <Txt variant="subtitle">Fiche Faunapedia disponible</Txt>
              <Txt variant="caption" tone="secondary">
                Mensurations, anecdotes, quiz…
              </Txt>
            </View>
            <Icon icon={mci('chevron-right')} size={20} color={colors.accent} />
          </Tap>
        )}
        {summary.data?.extract ? (
          <Txt variant="body" tone="secondary" style={styles.summary}>
            {summary.data.extract}
          </Txt>
        ) : null}
      </Animated.View>

      {isSpecies ? (
        <>
          {photos.length > 1 && (
            <Section title="Galerie" bleed>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gallery}>
                {photos.map((p) => (
                  <Image key={p.photo.id} source={{ uri: inatPhoto(p.photo, 'medium') }} style={styles.galleryImg} contentFit="cover" transition={200} />
                ))}
              </ScrollView>
            </Section>
          )}
          {status && (
            <Section title="Conservation">
              <Txt variant="body" tone="secondary">
                {IUCN[status].label} — {IUCN[status].description}
              </Txt>
            </Section>
          )}
          {gbifKey && (
            <Section title="Répartition">
              <DistributionMap taxonKey={gbifKey} name={title} />
            </Section>
          )}
          <Section title="Écouter">
            <SoundSection taxonId={t.id} color={colors.accent} eager={false} />
          </Section>
          {summary.data?.title && (
            <Section title="Encyclopédie">
              <WikiReader title={summary.data.title} />
            </Section>
          )}
        </>
      ) : (
        <Section
          title={childrenTitle(t)}
          eyebrow={children.data ? `${children.data.length} branche${children.data.length > 1 ? 's' : ''}` : undefined}>
          <View style={styles.sortRow}>
            <Chip label="Plus observés" size="sm" selected={sort === 'popular'} onPress={() => setSort('popular')} />
            <Chip label="Plus diversifiés" size="sm" selected={sort === 'diverse'} onPress={() => setSort('diverse')} />
            <Chip label="A → Z" size="sm" selected={sort === 'alpha'} onPress={() => setSort('alpha')} />
          </View>
          {children.loading ? (
            <Loading label="Chargement des branches…" />
          ) : children.error ? (
            <EmptyState icon={mci('wifi-off')} title="Branches indisponibles" action={{ label: 'Réessayer', onPress: children.reload }} />
          ) : (
            sortedChildren.map((c) => <TaxonRow key={c.id} taxon={c} />)
          )}
        </Section>
      )}

      <View style={[styles.pad, styles.footer]}>
        <Tap onPress={() => WebBrowser.openBrowserAsync(inatTaxonUrl(t.id))}>
          <Txt variant="caption" tone="accent">
            Voir sur iNaturalist ↗
          </Txt>
        </Tap>
        <Txt variant="caption" tone="muted">
          Classification et photos : iNaturalist (licences Creative Commons). Résumé : Wikipédia (CC BY-SA).
        </Txt>
      </View>
    </StackScreen>
  );
}

function childrenTitle(t: INatTaxon): string {
  const next: Record<string, string> = {
    kingdom: 'Embranchements',
    phylum: 'Classes et sous-groupes',
    subphylum: 'Classes',
    class: 'Ordres et sous-groupes',
    order: 'Familles et sous-groupes',
    family: 'Genres et sous-familles',
    genus: 'Espèces',
  };
  return next[t.rank] ?? 'Sous-groupes';
}

function Stat({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.stat, { backgroundColor: colors.surfaceRaised }]}>
      <Txt variant="subtitle">{value}</Txt>
      <Txt variant="caption" tone="muted">
        {label}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  pad: { paddingHorizontal: Gutter, gap: 8 },
  flex: { flex: 1 },
  crumbs: { paddingHorizontal: Gutter, gap: 2, alignItems: 'center', paddingBottom: 14 },
  crumb: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  banner: { height: 210, borderRadius: Radius.xl, overflow: 'hidden', marginBottom: 12, backgroundColor: '#111' },
  credit: { position: 'absolute', left: 12, right: 12, bottom: 10 },
  sci: { fontSize: 18, lineHeight: 24 },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginTop: 8 },
  stat: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radius.md },
  curated: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: Radius.lg, borderWidth: 1, marginTop: 8 },
  summary: { marginTop: 8 },
  sortRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 6 },
  gallery: { paddingHorizontal: Gutter, gap: 10 },
  galleryImg: { width: 220, height: 160, borderRadius: Radius.lg },
  footer: { marginTop: 30 },
});
