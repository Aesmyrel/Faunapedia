import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Radius } from '@/constants/theme';
import { getSpeciesByInatId } from '@/data';
import { RANKS } from '@/data/reference';
import { useTheme } from '@/hooks/use-theme';
import { type INatTaxon, inatPhoto } from '@/lib/api';
import { capitalize, formatCompact } from '@/lib/format';

import { Icon, mci } from '../ui/icon';
import { Tap } from '../ui/tap';
import { Txt } from '../ui/text';

/** Ligne d’un taxon iNaturalist (arbre du vivant, recherche mondiale, faune locale). */
export function TaxonRow({ taxon, meta, onPress }: { taxon: INatTaxon; meta?: string; onPress?: () => void }) {
  const router = useRouter();
  const { colors } = useTheme();
  const curated = taxon.rank === 'species' ? getSpeciesByInatId(taxon.id) : undefined;
  const photo = inatPhoto(taxon.default_photo, 'small');
  const title = taxon.preferred_common_name ? capitalize(taxon.preferred_common_name) : taxon.name;
  const open =
    onPress ??
    (() => {
      if (curated) router.push(`/species/${curated.id}`);
      else router.push(`/taxon/${taxon.id}`);
    });
  const detail =
    meta ??
    [
      RANKS[taxon.rank] ?? taxon.rank,
      taxon.complete_species_count && taxon.rank !== 'species' ? `${formatCompact(taxon.complete_species_count)} espèces` : null,
      taxon.observations_count ? `${formatCompact(taxon.observations_count)} obs.` : null,
    ]
      .filter(Boolean)
      .join(' · ');

  return (
    <Tap onPress={open} scaleTo={0.985} style={[styles.row, { borderBottomColor: colors.border }]} accessibilityLabel={title}>
      <View style={[styles.thumb, { backgroundColor: colors.surfaceRaised }]}>
        {photo ? (
          <Image source={{ uri: photo }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} recyclingKey={String(taxon.id)} />
        ) : (
          <Icon icon={mci('paw')} size={22} color={colors.textMuted} />
        )}
      </View>
      <View style={styles.text}>
        <View style={styles.titleRow}>
          <Txt variant="subtitle" numberOfLines={1} style={styles.shrink}>
            {title}
          </Txt>
          {curated && <Icon icon={mci('book-open-variant')} size={14} color={colors.accent} />}
          {taxon.extinct && <Icon icon={mci('grave-stone')} size={14} color={colors.textMuted} />}
        </View>
        {taxon.preferred_common_name ? (
          <Txt variant="sci" tone="secondary" numberOfLines={1} style={styles.sci}>
            {taxon.name}
          </Txt>
        ) : null}
        <Txt variant="caption" tone="muted" numberOfLines={1}>
          {detail}
        </Txt>
      </View>
      <Icon icon={mci('chevron-right')} size={18} color={colors.textMuted} />
    </Tap>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  thumb: { width: 56, height: 56, borderRadius: Radius.md, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, gap: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  shrink: { flexShrink: 1 },
  sci: { fontSize: 13.5, lineHeight: 18 },
});
