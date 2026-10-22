import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { Gutter, MaxContentWidth } from '@/constants/theme';
import type { Species } from '@/data/types';

import { SpeciesCard } from './species-card';

/** Grille responsive de cartes d’espèces (2 colonnes sur téléphone, 3 au-delà). */
export function SpeciesGrid({ species }: { species: Species[] }) {
  const { width } = useWindowDimensions();
  const contentW = Math.min(width, MaxContentWidth);
  const columns = contentW >= 700 ? 3 : 2;
  const cardW = (contentW - Gutter * 2 - 12 * (columns - 1)) / columns;
  return (
    <View style={styles.grid}>
      {species.map((s) => (
        <SpeciesCard key={s.id} species={s} variant="tile" width={cardW} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: Gutter },
});
