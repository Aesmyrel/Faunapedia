import * as WebBrowser from 'expo-web-browser';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  FadeIn,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { APP_URL, shareContent } from '@/components/share/share';
import { DistributionMap } from '@/components/species/distribution-map';
import { PhotoHero } from '@/components/species/photo-hero';
import { ScaleView } from '@/components/species/scale-view';
import { SoundSection } from '@/components/species/sound-player';
import { SpeciesCard } from '@/components/species/species-card';
import { StatGrid } from '@/components/species/stat-grid';
import { TaxonomyLadder } from '@/components/species/taxonomy-ladder';
import { WikiReader } from '@/components/species/wiki-reader';
import { Carousel } from '@/components/ui/carousel';
import { Chip } from '@/components/ui/chip';
import { Glass } from '@/components/ui/glass';
import { Icon, mci } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { Section } from '@/components/ui/section';
import { EmptyState } from '@/components/ui/states';
import { IucnScale, StatusBadge } from '@/components/ui/status-badge';
import { Tap } from '@/components/ui/tap';
import { Txt } from '@/components/ui/text';
import { alpha, Gutter, MaxContentWidth, Radius } from '@/constants/theme';
import { getSpecies, relatedSpecies } from '@/data';
import { ACTIVITIES, COLLECTIONS, DIETS, GROUPS, HABITATS, type IconRef, IUCN, REGIONS, SOCIALS } from '@/data/reference';
import { useHaptics } from '@/hooks/use-haptics';
import { useTheme } from '@/hooks/use-theme';
import { gbifSpeciesUrl, inatTaxonUrl, wikiPageUrl } from '@/lib/api';
import { formatCompact, formatCredit } from '@/lib/format';
import { SOUND_IDS } from '@/lib/quiz';
import { useStore } from '@/store';

export default function SpeciesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const species = getSpecies(id);
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width, height: screenH } = useWindowDimensions();
  const h = useHaptics();
  const markSeen = useStore((s) => s.markSeen);
  const toggleFavorite = useStore((s) => s.toggleFavorite);
  const favorite = useStore((s) => (species ? s.favorites.includes(species.id) : false));
  const autoSounds = useStore((s) => s.settings.sounds);
  const scrollY = useSharedValue(0);
  const heroH = Math.min(Math.round(screenH * 0.58), 620);

  useEffect(() => {
    if (species) markSeen(species.id);
  }, [species, markSeen]);

  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.set(e.contentOffset.y);
  });
  const barStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.get(), [heroH - 160, heroH - 90], [0, 1], 'clamp'),
  }));

  if (!species) {
    return (
      <View style={[styles.fill, { backgroundColor: colors.background, paddingTop: insets.top + 60 }]}>
        <EmptyState title="Espèce introuvable" action={{ label: 'Retour', onPress: () => router.back() }} />
      </View>
    );
  }

  const s = species;
  const group = GROUPS[s.group];
  const color = group.color;
  const iucn = IUCN[s.status];
  const related = relatedSpecies(s, 10);
  const collections = COLLECTIONS.filter((c) => c.filter(s));
  const contentW = Math.min(width, MaxContentWidth);

  const share = () => {
    shareContent({
      message: `${s.name} (${s.sci}) — ${s.record ?? s.facts[0]}\n\nDécouvert sur Faunapedia.`,
      url: APP_URL,
      title: s.name,
    });
  };

  return (
    <View style={[styles.fill, { backgroundColor: colors.background }]}>
      <Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16} showsVerticalScrollIndicator={false}>
        <PhotoHero species={s} height={heroH} scrollY={scrollY} />

        <View style={[styles.body, { marginTop: -110 }]}>
          <Animated.View entering={FadeIn.duration(400)} style={styles.titleBlock}>
            <View style={styles.chips}>
              <Chip label={group.singular} icon={group.icon} color={color} selected size="sm" onPress={() => router.push(`/group/${s.group}`)} />
              <StatusBadge status={s.status} label small />
            </View>
            <Txt variant={s.name.length > 20 ? 'display' : 'hero'}>{s.name}</Txt>
            <Txt variant="sci" tone="secondary" style={styles.sci}>
              {s.sci}
              {s.authority ? <Txt variant="small" tone="muted">{`  ${s.authority}`}</Txt> : null}
            </Txt>
            {s.aka?.length ? (
              <Txt variant="small" tone="muted">
                Aussi appelé : {s.aka.join(', ')}
              </Txt>
            ) : null}
          </Animated.View>

          {s.record && (
            <View style={[styles.record, { backgroundColor: alpha('#F5A524', 0.12), borderColor: alpha('#F5A524', 0.35) }]}>
              <Icon icon={mci('trophy')} size={22} color="#F5A524" />
              <Txt variant="bodyStrong" style={styles.flex}>
                {s.record}
              </Txt>
            </View>
          )}

          {s.summary ? <Summary text={s.summary} /> : null}

          <StatGrid stats={s.stats} />
        </View>

        <Section title="À l’échelle" eyebrow="Comparaison de taille">
          <ScaleView species={s} />
        </Section>

        <Section title="Conservation" eyebrow="Liste rouge de l’UICN">
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.statusHead}>
              <View style={[styles.statusCode, { backgroundColor: iucn.color }]}>
                <Txt variant="subtitle" color="#0B0B0B">
                  {s.status}
                </Txt>
              </View>
              <View style={styles.flex}>
                <Txt variant="heading">{iucn.label}</Txt>
                <Txt variant="small" tone="secondary">
                  {iucn.description}
                </Txt>
              </View>
            </View>
            <IucnScale status={s.status} />
            <Txt variant="caption" tone="muted">
              {s.statusSource === 'iucn'
                ? 'Statut mondial officiel de l’UICN (via iNaturalist).'
                : s.statusNote
                  ? s.statusNote
                  : s.status === 'NE'
                    ? 'Cette espèce n’a pas encore été évaluée à l’échelle mondiale.'
                    : 'Statut renseigné par Faunapedia d’après la Liste rouge de l’UICN.'}
            </Txt>
          </View>
        </Section>

        <Section title="Mode de vie" eyebrow="Écologie">
          <View style={styles.lifeGrid}>
            <LifeRow label="Régime" items={s.diet.map((d) => ({ label: DIETS[d].label, icon: DIETS[d].icon }))} color={color} />
            <LifeRow
              label="Rythme"
              items={[{ label: ACTIVITIES[s.activity].label, icon: ACTIVITIES[s.activity].icon }]}
              color={color}
            />
            <LifeRow label="Vie sociale" items={[{ label: SOCIALS[s.social].label, icon: SOCIALS[s.social].icon }]} color={color} />
            <LifeRow label="Habitats" items={s.habitats.map((x) => ({ label: HABITATS[x].label, icon: HABITATS[x].icon }))} color={color} />
            <LifeRow label="Répartition" items={s.regions.map((r) => ({ label: REGIONS[r].label, icon: mci('earth') }))} color={color} />
          </View>
        </Section>

        <Section title="Le saviez-vous ?" eyebrow="Anecdotes">
          <View style={styles.facts}>
            {s.facts.map((f, i) => (
              <View key={f} style={[styles.fact, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Txt variant="number" color={alpha(color, 0.9)} style={styles.factNum}>
                  {String(i + 1).padStart(2, '0')}
                </Txt>
                <Txt variant="body" style={styles.flex}>
                  {f}
                </Txt>
              </View>
            ))}
            {s.etymology && (
              <View style={[styles.fact, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Icon icon={mci('format-letter-case')} size={24} color={color} />
                <View style={styles.flex}>
                  <Txt variant="label" tone="muted">
                    Étymologie
                  </Txt>
                  <Txt variant="body">{s.etymology}</Txt>
                </View>
              </View>
            )}
          </View>
        </Section>

        {s.gbifKey && (
          <Section title="Répartition" eyebrow="Observations mondiales">
            <DistributionMap taxonKey={s.gbifKey} name={s.name} historical={s.status === 'EX'} />
          </Section>
        )}

        {s.taxonomy.length > 0 && (
          <Section title="Classification" eyebrow="Place dans l’arbre du vivant">
            <TaxonomyLadder taxonomy={s.taxonomy} color={color} />
          </Section>
        )}

        {s.inatId && (
          <Section title="Écouter" eyebrow="Enregistrements de terrain">
            <SoundSection taxonId={s.inatId} color={color} eager={autoSounds && (s.group === 'birds' || SOUND_IDS.has(s.id))} />
          </Section>
        )}

        {s.wikiTitle && (
          <Section title="Encyclopédie" eyebrow="Pour aller plus loin">
            <WikiReader title={s.wikiTitle} />
          </Section>
        )}

        <View style={[styles.actions, { paddingHorizontal: Gutter }]}>
          <ActionButton
            icon="target"
            label="Me tester"
            sub="5 questions"
            color={colors.accent}
            onPress={() => router.push({ pathname: '/quiz/[mode]', params: { mode: 'species', species: s.id } })}
          />
          <ActionButton
            icon="compare-horizontal"
            label="Comparer"
            sub="avec une autre espèce"
            color="#FB923C"
            onPress={() => router.push({ pathname: '/compare', params: { a: s.id } })}
          />
        </View>

        {related.length > 0 && (
          <Section title="Espèces apparentées" eyebrow="Proches dans la classification" bleed>
            <Carousel snap={170}>
              {related.map((r) => (
                <SpeciesCard key={r.id} species={r} variant="tile" width={170} />
              ))}
            </Carousel>
          </Section>
        )}

        {collections.length > 0 && (
          <Section title="Dans les collections">
            <View style={styles.chipsWrap}>
              {collections.map((c) => (
                <Chip key={c.id} label={c.title} icon={c.icon} color={c.color} onPress={() => router.push(`/collection/${c.id}`)} />
              ))}
            </View>
          </Section>
        )}

        <Section title="Sources & crédits">
          <View style={styles.credits}>
            {s.inatId && <SourceLink label={`iNaturalist · ${formatCompact(s.observations ?? 0)} observations`} url={inatTaxonUrl(s.inatId)} />}
            {s.gbifKey && <SourceLink label="GBIF · données d’occurrence" url={gbifSpeciesUrl(s.gbifKey)} />}
            {s.wikiTitle && <SourceLink label={`Wikipédia · « ${s.wikiTitle} »`} url={wikiPageUrl(s.wikiTitle)} />}
            {s.photos.map((p, i) => (
              <Txt key={p.url} variant="caption" tone="muted">
                Photo {i + 1} : {formatCredit(p.attribution, p.license)}
              </Txt>
            ))}
            {s.silhouette && (
              <Txt variant="caption" tone="muted">
                Silhouette : {s.silhouette.attribution ?? 'PhyloPic'} ({s.silhouette.license ?? 'PhyloPic'})
              </Txt>
            )}
          </View>
        </Section>
        <View style={{ height: insets.bottom + 40 }} />
      </Animated.ScrollView>

      <Animated.View pointerEvents="none" style={[styles.bar, { paddingTop: insets.top, height: insets.top + 56 }, barStyle]}>
        <Glass style={StyleSheet.absoluteFill} />
        <View style={[styles.barTitle, { maxWidth: contentW - 230 }]}>
          <Txt variant="subtitle" numberOfLines={1} style={{ maxWidth: contentW - 230 }}>
            {s.name}
          </Txt>
        </View>
      </Animated.View>
      <View style={[styles.topButtons, { top: insets.top + 6 }]} pointerEvents="box-none">
        <IconButton icon={mci('chevron-left')} onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} label="Retour" overMedia />
        <View style={styles.rightButtons}>
          <IconButton icon={mci('share-variant')} onPress={share} label="Partager" overMedia />
          <IconButton
            icon={mci(favorite ? 'heart' : 'heart-outline')}
            onPress={() => {
              h.success();
              toggleFavorite(s.id);
            }}
            label={favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            color={favorite ? '#FF6B81' : undefined}
            overMedia
          />
        </View>
      </View>
    </View>
  );
}

/** Résumé encyclopédique repliable. */
function Summary({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const long = text.length > 320;
  return (
    <View style={styles.summaryWrap}>
      <Txt variant="body" tone="secondary" style={styles.summary} numberOfLines={open || !long ? undefined : 5} selectable>
        {text}
      </Txt>
      {long && (
        <Tap onPress={() => setOpen((o) => !o)} haptic="select" scaleTo={0.98} style={styles.more}>
          <Txt variant="smallStrong" tone="accent">
            {open ? 'Réduire' : 'Lire la suite'}
          </Txt>
        </Tap>
      )}
    </View>
  );
}

function LifeRow({ label, items, color }: { label: string; items: { label: string; icon: IconRef }[]; color: string }) {
  return (
    <View style={styles.lifeRow}>
      <Txt variant="label" tone="muted" style={styles.lifeLabel}>
        {label}
      </Txt>
      <View style={[styles.chipsWrap, styles.flex]}>
        {items.map((it) => (
          <Chip key={it.label} label={it.label} icon={it.icon} color={color} size="sm" />
        ))}
      </View>
    </View>
  );
}

function ActionButton({ icon, label, sub, color, onPress }: { icon: string; label: string; sub: string; color: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Tap onPress={onPress} style={[styles.action, { backgroundColor: alpha(color, 0.12), borderColor: alpha(color, 0.35) }]}>
      <Icon icon={mci(icon)} size={24} color={color} />
      <View style={styles.flex}>
        <Txt variant="subtitle">{label}</Txt>
        <Txt variant="caption" color={colors.textSecondary}>
          {sub}
        </Txt>
      </View>
    </Tap>
  );
}

function SourceLink({ label, url }: { label: string; url: string }) {
  return (
    <Tap onPress={() => WebBrowser.openBrowserAsync(url)} scaleTo={0.99} style={styles.sourceLink}>
      <Txt variant="smallStrong" tone="accent">
        {label} ↗
      </Txt>
    </Tap>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  flex: { flex: 1 },
  body: { paddingHorizontal: Gutter, gap: 18, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' },
  titleBlock: { gap: 6 },
  chips: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 4 },
  sci: { fontSize: 18, lineHeight: 24 },
  record: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: Radius.lg, borderWidth: 1 },
  summary: { fontSize: 16, lineHeight: 26 },
  card: { padding: 16, gap: 16, borderRadius: Radius.xl, borderWidth: StyleSheet.hairlineWidth },
  statusHead: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  statusCode: { width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  lifeGrid: { gap: 12 },
  lifeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  lifeLabel: { width: 92, paddingTop: 7 },
  summaryWrap: { gap: 6 },
  more: { alignSelf: 'flex-start', paddingVertical: 4 },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  facts: { gap: 10 },
  fact: { flexDirection: 'row', gap: 14, padding: 16, borderRadius: Radius.lg, borderWidth: StyleSheet.hairlineWidth, alignItems: 'flex-start' },
  factNum: { fontSize: 22, lineHeight: 26, minWidth: 30 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 30, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' },
  action: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: Radius.lg, borderWidth: 1 },
  credits: { gap: 8 },
  sourceLink: { alignSelf: 'flex-start' },
  bar: { position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center', justifyContent: 'center' },
  barTitle: { flex: 1, justifyContent: 'center' },
  topButtons: { position: 'absolute', left: 14, right: 14, flexDirection: 'row', justifyContent: 'space-between' },
  rightButtons: { flexDirection: 'row', gap: 10 },
});
