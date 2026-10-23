import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { SpeciesImage } from '@/components/species/species-image';
import { HeroHeader } from '@/components/ui/hero-header';
import { Icon, mci } from '@/components/ui/icon';
import { StackScreen } from '@/components/ui/stack-screen';
import { Tap } from '@/components/ui/tap';
import { Txt } from '@/components/ui/text';
import { alpha, Gutter, Radius } from '@/constants/theme';
import { getSpecies } from '@/data';
import { EVO_START, type EvoEvent, type EvoKind, PERIODS } from '@/data/evolution';
import type { Species } from '@/data/types';
import { useHideSpiders } from '@/hooks/use-hide-spiders';
import { useTheme } from '@/hooks/use-theme';
import { clockTime, durationLabel, eventsByPeriod, formatAge } from '@/lib/evolution';
import { formatNumber } from '@/lib/format';
import { isArachnid } from '@/lib/phobia';

const KIND_ICONS: Record<EvoKind, string> = {
  apparition: 'sprout',
  extinction: 'skull-outline',
  jalon: 'flag-variant-outline',
  humain: 'human-handsdown',
};

const GROUPED = eventsByPeriod();
const ERAS = ['Paléozoïque', 'Mésozoïque', 'Cénozoïque'] as const;

/** 540 millions d’années de vie animale, période par période. */
export default function TimelineScreen() {
  const { colors } = useTheme();

  return (
    <StackScreen>
      <HeroHeader
        icon={mci('timeline-clock-outline')}
        color="#7FC64E"
        eyebrow="540 millions d’années"
        title="La frise de l’évolution"
        description="De l’explosion cambrienne à aujourd’hui : les grandes étapes de la vie animale, et les espèces de Faunapedia héritières de lignées très anciennes."
      />

      <View style={styles.overview}>
        <View style={styles.bar}>
          {PERIODS.map((p) => (
            <View key={p.id} style={{ flex: p.start - p.end, backgroundColor: p.color }} />
          ))}
        </View>
        <View style={styles.eras}>
          {ERAS.map((era) => {
            const ps = PERIODS.filter((p) => p.era === era);
            const span = ps[0].start - ps[ps.length - 1].end;
            return (
              <View key={era} style={{ flex: span }}>
                <Txt variant="caption" tone="muted" numberOfLines={1}>
                  {era}
                </Txt>
              </View>
            );
          })}
        </View>
        <Txt variant="caption" tone="muted">
          Chaque couleur correspond à une période, à l’échelle de sa durée.
        </Txt>
      </View>

      {GROUPED.map(({ period, events }) => (
        <View key={period.id} style={styles.period}>
          <View style={[styles.rail, { backgroundColor: alpha(period.color, 0.55) }]} />
          <View style={styles.periodHead}>
            <View style={[styles.periodDot, { backgroundColor: period.color }]} />
            <View style={styles.flex}>
              <Txt variant="label" tone="muted">
                {period.era} · {formatNumber(period.start, 1)} – {formatNumber(period.end, 1)} Ma · {durationLabel(period)}
              </Txt>
              <Txt variant="title">{period.name}</Txt>
              <Txt variant="small" tone="secondary">
                {period.summary}
              </Txt>
            </View>
          </View>
          {events.map((e) => (
            <EventCard key={`${e.ma}-${e.title}`} event={e} color={period.color} />
          ))}
        </View>
      ))}

      <Animated.View entering={FadeInDown} style={[styles.clock, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Icon icon={mci('clock-outline')} size={26} color={colors.accent} />
        <Txt variant="heading">Et si tout tenait en 24 heures ?</Txt>
        <Txt variant="body" tone="secondary">
          Si les {EVO_START} millions d’années de vie animale tenaient en une journée, les premiers mammifères apparaîtraient à {clockTime(225)}, les
          dinosaures disparaîtraient à {clockTime(66)}… et Homo sapiens n’arriverait qu’à {clockTime(0.3)}.
        </Txt>
      </Animated.View>
    </StackScreen>
  );
}

function EventCard({ event: e, color }: { event: EvoEvent; color: string }) {
  const router = useRouter();
  const { colors } = useTheme();
  const hideSpiders = useHideSpiders();
  const tint = e.kind === 'extinction' ? colors.danger : e.kind === 'humain' ? colors.accent : color;
  const species = (e.speciesIds ?? [])
    .map((id) => getSpecies(id))
    .filter((s): s is Species => s !== undefined && !(hideSpiders && isArachnid(s)));
  return (
    <View style={styles.event}>
      <View style={[styles.eventDot, { backgroundColor: colors.background, borderColor: tint }]} />
      <View style={[styles.eventCard, { backgroundColor: colors.surface, borderColor: e.kind === 'extinction' ? alpha(colors.danger, 0.4) : colors.border }]}>
        <View style={styles.eventHead}>
          <Icon icon={mci(KIND_ICONS[e.kind])} size={16} color={tint} />
          <Txt variant="label" color={tint}>
            {formatAge(e)}
          </Txt>
        </View>
        <Txt variant="subtitle">{e.title}</Txt>
        <Txt variant="small" tone="secondary">
          {e.text}
        </Txt>
        {species.length > 0 && (
          <View style={styles.species}>
            {species.map((s) => (
              <Tap key={s.id} onPress={() => router.push(`/species/${s.id}`)} style={[styles.chip, { backgroundColor: colors.surfaceRaised }]} accessibilityLabel={s.name}>
                <SpeciesImage species={s} size="small" style={styles.chipImg} />
                <Txt variant="caption" numberOfLines={1} style={styles.chipLabel}>
                  {s.name}
                </Txt>
              </Tap>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overview: { paddingHorizontal: Gutter, gap: 6, marginBottom: 20 },
  bar: { flexDirection: 'row', height: 14, borderRadius: 7, overflow: 'hidden' },
  eras: { flexDirection: 'row' },
  period: { paddingHorizontal: Gutter, paddingBottom: 12 },
  rail: { position: 'absolute', left: Gutter + 7, top: 14, bottom: 0, width: 3, borderRadius: 2 },
  periodHead: { flexDirection: 'row', gap: 14, marginBottom: 12, marginTop: 12 },
  periodDot: { width: 17, height: 17, borderRadius: 9, marginTop: 4 },
  flex: { flex: 1, gap: 3 },
  event: { flexDirection: 'row', gap: 14, marginBottom: 10 },
  eventDot: { width: 13, height: 13, borderRadius: 7, borderWidth: 3, marginLeft: 2, marginTop: 16 },
  eventCard: { flex: 1, gap: 4, padding: 14, borderRadius: Radius.lg, borderWidth: StyleSheet.hairlineWidth },
  eventHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  species: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingRight: 12, borderRadius: Radius.pill, overflow: 'hidden', maxWidth: '100%' },
  chipImg: { width: 30, height: 30, borderRadius: 15 },
  chipLabel: { flexShrink: 1 },
  clock: { marginHorizontal: Gutter, marginTop: 12, padding: 18, gap: 8, borderRadius: Radius.xl, borderWidth: StyleSheet.hairlineWidth },
});
