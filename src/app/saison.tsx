import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { SeasonCard } from '@/components/home/season-card';
import { Chip } from '@/components/ui/chip';
import { HeroHeader } from '@/components/ui/hero-header';
import { mci } from '@/components/ui/icon';
import { StackScreen } from '@/components/ui/stack-screen';
import { Txt } from '@/components/ui/text';
import { Gutter } from '@/constants/theme';
import { getSpecies } from '@/data';
import { MONTH_NAMES, SEASONS } from '@/data/seasons';
import { useHideSpiders } from '@/hooks/use-hide-spiders';
import { capitalize } from '@/lib/format';
import { isArachnid } from '@/lib/phobia';

/** Le calendrier naturel de la France, mois par mois. */
export default function SeasonScreen() {
  const params = useLocalSearchParams<{ month?: string }>();
  const hideSpiders = useHideSpiders();
  const current = new Date().getMonth();
  const initial = params.month !== undefined && !Number.isNaN(Number(params.month)) ? Number(params.month) % 12 : current;
  const [month, setMonth] = useState(initial);
  const events = SEASONS[month].filter((e) => {
    const species = getSpecies(e.speciesId);
    return !(hideSpiders && species && isArachnid(species));
  });

  return (
    <StackScreen>
      <HeroHeader
        icon={mci('calendar-month')}
        color="#7FC64E"
        eyebrow="Le calendrier naturel de la France"
        title={month === current ? 'Ce mois-ci dans la nature' : `En ${MONTH_NAMES[month]}`}
        description="Ce qu’il y a à voir, à entendre et à faire dehors, mois après mois : migrations, chants, naissances… et quelques gestes pour aider la faune."
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.months} style={styles.monthsRow}>
        {MONTH_NAMES.map((name, i) => (
          <Chip key={name} label={capitalize(name)} selected={i === month} onPress={() => setMonth(i)} size="sm" />
        ))}
      </ScrollView>
      <Animated.View key={month} entering={FadeIn.duration(200)} style={styles.list}>
        {events.map((e) => (
          <SeasonCard key={e.title} event={e} month={month} variant="row" />
        ))}
      </Animated.View>
      <Txt variant="caption" tone="muted" style={styles.note}>
        Les dates varient selon la région, l’altitude et la météo de l’année : ce sont des repères. Observez sans déranger, et sans toucher aux animaux sauvages.
      </Txt>
    </StackScreen>
  );
}

const styles = StyleSheet.create({
  monthsRow: { flexGrow: 0 },
  months: { paddingHorizontal: Gutter, gap: 8, paddingBottom: 16 },
  list: { paddingHorizontal: Gutter, gap: 12 },
  note: { paddingHorizontal: Gutter, marginTop: 16 },
});

