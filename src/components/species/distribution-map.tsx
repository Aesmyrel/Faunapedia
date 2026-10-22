import { Image } from 'expo-image';
import * as WebBrowser from 'expo-web-browser';
import { StyleSheet, View } from 'react-native';

import { Radius } from '@/constants/theme';
import { useRemote } from '@/hooks/use-remote';
import { useTheme } from '@/hooks/use-theme';
import { gbifBaseTile, gbifDensityTile, gbifOccurrenceCount, gbifSpeciesUrl } from '@/lib/api';
import { formatNumber } from '@/lib/format';

import { Icon, mci } from '../ui/icon';
import { Tap } from '../ui/tap';
import { Txt } from '../ui/text';

const TILES = [0, 1] as const;

/**
 * Carte mondiale des observations (GBIF), en hexagones de densité.
 * `historical` : espèce éteinte, on garde alors toutes les sources (spécimens compris).
 */
export function DistributionMap({ taxonKey, name, historical = false }: { taxonKey: number; name: string; historical?: boolean }) {
  const { dark, colors } = useTheme();
  const style = dark ? 'dark' : 'light';
  const count = useRemote(`gbif-count-${taxonKey}-${historical}`, () => gbifOccurrenceCount(taxonKey, !historical));
  return (
    <View style={[styles.wrap, { borderColor: colors.border, backgroundColor: colors.surface }]}>
      <View style={styles.map} accessible accessibilityLabel={`Carte des observations de ${name}`}>
        {TILES.map((x) => (
          <View key={x} style={styles.tile}>
            <Image source={{ uri: gbifBaseTile(x, style) }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
            <Image source={{ uri: gbifDensityTile(taxonKey, x, style, !historical) }} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} />
          </View>
        ))}
      </View>
      <Tap onPress={() => WebBrowser.openBrowserAsync(gbifSpeciesUrl(taxonKey))} style={styles.footer} scaleTo={0.99}>
        <Icon icon={mci('map-marker-multiple')} size={16} color={colors.accent} />
        <Txt variant="caption" tone="secondary" style={styles.flex}>
          {count.data !== undefined
            ? `${formatNumber(count.data, 0)} ${historical ? 'données géolocalisées (spécimens compris)' : 'observations de terrain géolocalisées'}`
            : 'Observations géolocalisées (GBIF)'}
        </Txt>
        <Txt variant="caption" tone="accent">
          GBIF ↗
        </Txt>
      </Tap>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: Radius.xl, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth },
  map: { flexDirection: 'row', aspectRatio: 2 },
  tile: { flex: 1, aspectRatio: 1 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 11 },
  flex: { flex: 1 },
});
