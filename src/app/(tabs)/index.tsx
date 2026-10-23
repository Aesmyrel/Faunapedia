import { LinearGradient } from 'expo-linear-gradient';
import { useIsFocused, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Platform, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { CollectionCard } from '@/components/home/collection-card';
import { GroupTile } from '@/components/home/group-tile';
import { UpdateBanner } from '@/components/home/update-banner';
import { ShareAppCard } from '@/components/share/share-app-card';
import { SpeciesCard } from '@/components/species/species-card';
import { Carousel } from '@/components/ui/carousel';
import { Icon, mci } from '@/components/ui/icon';
import { ProgressRing } from '@/components/ui/progress-ring';
import { TabScreen } from '@/components/ui/screen';
import { Section } from '@/components/ui/section';
import { Tap } from '@/components/ui/tap';
import { Txt } from '@/components/ui/text';
import { alpha, Gutter, MaxContentWidth, Radius } from '@/constants/theme';
import { hashString, SPECIES, speciesOfTheDay } from '@/data';
import { COLLECTIONS, GROUP_ORDER } from '@/data/reference';
import { useHaptics } from '@/hooks/use-haptics';
import { useShake } from '@/hooks/use-shake';
import { useTheme } from '@/hooks/use-theme';
import { capitalize, todayKey } from '@/lib/format';
import { levelFromXp } from '@/lib/progress';
import { createRng, shuffle } from '@/lib/random';
import { activeStreak, useStore } from '@/store';

function greeting(date: Date): string {
  const h = date.getHours();
  if (h < 5) return 'Bonne nuit';
  if (h < 12) return 'Bonjour';
  if (h < 18) return 'Bon après-midi';
  return 'Bonsoir';
}

export default function DiscoverScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const h = useHaptics();
  const today = todayKey();
  const now = new Date();
  const featured = useMemo(() => speciesOfTheDay(today), [today]);
  const xp = useStore((s) => s.xp);
  const daily = useStore((s) => s.daily);
  const seen = useStore((s) => s.seen);
  const level = levelFromXp(xp);
  const streak = activeStreak(daily, today);
  const dailyDone = daily.last === today;
  const seenCount = Object.keys(seen).length;
  const contentWidth = Math.min(width, MaxContentWidth);

  const toDiscover = useMemo(() => {
    const rng = createRng(hashString(`decouvrir-${today}`));
    return shuffle(rng, SPECIES.filter((s) => s.photos.length && !seen[s.id] && s.id !== featured.id)).slice(0, 10);
  }, [today, seen, featured.id]);

  const surprise = () => {
    h.heavy();
    const pool = SPECIES.filter((s) => !seen[s.id]);
    const list = pool.length ? pool : SPECIES;
    router.push(`/species/${list[Math.floor(Math.random() * list.length)].id}`);
  };
  // L’accéléromètre n’écoute que lorsque l’accueil est affiché.
  useShake(surprise, useIsFocused());

  const dateLabel = capitalize(now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }));

  return (
    <TabScreen>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Txt variant="label" tone="muted">
            {dateLabel}
          </Txt>
          <Txt variant="display">{greeting(now)}</Txt>
        </View>
        {streak > 0 && (
          <View style={[styles.streak, { backgroundColor: alpha('#F97316', 0.16) }]}>
            <Icon icon={mci('fire')} size={18} color="#F97316" />
            <Txt variant="smallStrong" color="#F97316">
              {streak}
            </Txt>
          </View>
        )}
        <Tap onPress={() => router.push('/carnet')} accessibilityLabel={`Niveau ${level.level}, ${level.rank.title}`}>
          <ProgressRing size={48} stroke={4} progress={level.progress} color={colors.accent}>
            <Txt variant="smallStrong">{level.level}</Txt>
          </ProgressRing>
        </Tap>
      </View>

      <UpdateBanner />

      <Animated.View entering={FadeInDown.duration(500)} style={styles.block}>
        <Txt variant="label" tone="accent" style={styles.eyebrow}>
          Espèce du jour
        </Txt>
        <SpeciesCard species={featured} variant="feature" width={contentWidth - Gutter * 2} subtitle={featured.record ?? featured.sci} />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(120).duration(500)} style={[styles.block, styles.row]}>
        <Tap
          onPress={() => router.push('/quiz/daily')}
          style={[styles.dailyCard, { backgroundColor: colors.surface, borderColor: alpha(colors.accent, 0.35) }]}
          accessibilityLabel="Défi du jour">
          <LinearGradient colors={[alpha(colors.accent, 0.22), alpha(colors.accent, 0)]} style={StyleSheet.absoluteFill} />
          <View style={[styles.dailyIcon, { backgroundColor: alpha(colors.accent, 0.2) }]}>
            <Icon icon={mci(dailyDone ? 'check-decagram' : 'calendar-star')} size={26} color={colors.accent} />
          </View>
          <View style={styles.flex}>
            <Txt variant="label" tone="accent">
              Défi du jour
            </Txt>
            <Txt variant="heading">{dailyDone ? `Relevé : ${daily.scores[today] ?? 0}/10` : '10 questions vous attendent'}</Txt>
            <Txt variant="small" tone="secondary">
              {dailyDone
                ? `Série de ${streak} jour${streak > 1 ? 's' : ''} · revenez demain !`
                : streak > 0
                  ? `Prolongez votre série de ${streak} jour${streak > 1 ? 's' : ''}`
                  : 'Les mêmes questions pour tous, chaque jour'}
            </Txt>
          </View>
          <Icon icon={mci('chevron-right')} size={22} color={colors.textMuted} />
        </Tap>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200).duration(500)} style={[styles.block, styles.quickRow]}>
        <Tap onPress={surprise} style={[styles.quick, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Icon icon={mci('shuffle-variant')} size={22} color="#C084FC" />
          <View style={styles.flex}>
            <Txt variant="subtitle">Surprends-moi</Txt>
            <Txt variant="caption" tone="muted">
              {Platform.OS === 'web' ? 'Une espèce au hasard' : 'ou secouez le téléphone'}
            </Txt>
          </View>
        </Tap>
        <Tap onPress={() => router.push('/compare')} style={[styles.quick, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Icon icon={mci('compare-horizontal')} size={22} color="#FB923C" />
          <View style={styles.flex}>
            <Txt variant="subtitle">Comparer</Txt>
            <Txt variant="caption" tone="muted">
              Taille, parenté…
            </Txt>
          </View>
        </Tap>
      </Animated.View>

      <Section title="Le règne animal" eyebrow={`${seenCount}/${SPECIES.length} espèces découvertes`} bleed>
        <Carousel>
          {GROUP_ORDER.map((g) => (
            <GroupTile key={g} id={g} />
          ))}
        </Carousel>
      </Section>

      <Section title="Collections" eyebrow="Voyages thématiques" bleed>
        <Carousel snap={260}>
          {COLLECTIONS.map((c) => (
            <CollectionCard key={c.id} collection={c} />
          ))}
        </Carousel>
      </Section>

      <Section title="Sur le terrain" eyebrow="Données en direct">
        <View style={styles.fieldGrid}>
          <FieldCard
            icon="map-marker-radius"
            color="#22C55E"
            title="Autour de moi"
            text="Les espèces réellement observées près de vous par la communauté iNaturalist."
            onPress={() => router.push('/nearby')}
          />
          <FieldCard
            icon="family-tree"
            color="#84CC16"
            title="Arbre du vivant"
            text="Plus d’un million d’espèces animales, de l’embranchement à l’espèce."
            onPress={() => router.push('/taxon/1')}
          />
        </View>
      </Section>

      {toDiscover.length > 0 && (
        <Section title="À découvrir" eyebrow="Sélection du jour" bleed action={{ label: 'Explorer', onPress: () => router.push('/explorer') }}>
          <Carousel snap={200}>
            {toDiscover.map((s) => (
              <SpeciesCard key={s.id} species={s} variant="wide" width={200} />
            ))}
          </Carousel>
        </Section>
      )}

      <View style={styles.share}>
        <ShareAppCard />
      </View>

      <Txt variant="caption" tone="muted" align="center" style={styles.footer}>
        Photos et observations : contributeurs iNaturalist (licences Creative Commons) · Textes : Wikipédia · Cartes : GBIF ·
        Silhouettes : PhyloPic
      </Txt>
    </TabScreen>
  );
}

function FieldCard({ icon, color, title, text, onPress }: { icon: string; color: string; title: string; text: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Tap onPress={onPress} style={[styles.field, { backgroundColor: colors.surface, borderColor: alpha(color, 0.3) }]}>
      <LinearGradient colors={[alpha(color, 0.18), alpha(color, 0)]} style={StyleSheet.absoluteFill} />
      <View style={[styles.fieldIcon, { backgroundColor: alpha(color, 0.18) }]}>
        <Icon icon={mci(icon)} size={22} color={color} />
      </View>
      <Txt variant="heading">{title}</Txt>
      <Txt variant="small" tone="secondary">
        {text}
      </Txt>
    </Tap>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: Gutter, marginBottom: 18 },
  headerText: { flex: 1, gap: 2 },
  streak: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: Radius.pill },
  block: { paddingHorizontal: Gutter, marginTop: 12 },
  eyebrow: { marginBottom: 10 },
  row: { flexDirection: 'row' },
  flex: { flex: 1, gap: 2 },
  dailyCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: Radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  dailyIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  quickRow: { flexDirection: 'row', gap: 12 },
  quick: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  fieldGrid: { gap: 12 },
  field: { padding: 16, gap: 8, borderRadius: Radius.xl, borderWidth: 1, overflow: 'hidden' },
  fieldIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  share: { paddingHorizontal: Gutter, marginTop: 36 },
  footer: { paddingHorizontal: 32, marginTop: 28, marginBottom: 8, lineHeight: 17 },
});
