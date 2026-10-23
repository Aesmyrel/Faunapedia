import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { alpha, Radius } from '@/constants/theme';
import { getSpecies } from '@/data';
import type { SeasonEvent, SeasonKind } from '@/data/seasons';
import { useTheme } from '@/hooks/use-theme';

import { SpeciesImage } from '../species/species-image';
import { Icon, mci } from '../ui/icon';
import { Tap } from '../ui/tap';
import { Txt } from '../ui/text';

export const SEASON_KINDS: Record<SeasonKind, { label: string; icon: string; color: string }> = {
  observer: { label: 'À observer', icon: 'binoculars', color: '#38BDF8' },
  ecouter: { label: 'À écouter', icon: 'ear-hearing', color: '#C084FC' },
  migration: { label: 'Migration', icon: 'bird', color: '#F59E0B' },
  agir: { label: 'Un geste pour la nature', icon: 'hand-heart-outline', color: '#34D399' },
};

/** Événement saisonnier : en carte (accueil) ou en ligne détaillée (écran du calendrier). */
export function SeasonCard({ event, month, variant = 'card', width = 240 }: { event: SeasonEvent; month: number; variant?: 'card' | 'row'; width?: number }) {
  const router = useRouter();
  const { colors } = useTheme();
  const kind = SEASON_KINDS[event.kind];
  const species = getSpecies(event.speciesId);
  const open = () => (species ? router.push(`/species/${species.id}`) : router.push({ pathname: '/saison', params: { month: String(month) } }));

  const visual = species ? (
    <SpeciesImage species={species} size="medium" style={StyleSheet.absoluteFill} />
  ) : (
    <>
      <LinearGradient colors={[alpha(kind.color, 0.45), alpha(kind.color, 0.12)]} style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, styles.center]}>
        <Icon icon={mci(kind.icon)} size={variant === 'row' ? 30 : 40} color="#FFFFFF" />
      </View>
    </>
  );

  if (variant === 'row') {
    return (
      <Tap onPress={open} style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]} scaleTo={0.99} accessibilityLabel={event.title}>
        <View style={styles.rowImage}>{visual}</View>
        <View style={styles.flex}>
          <View style={styles.kind}>
            <Icon icon={mci(kind.icon)} size={14} color={kind.color} />
            <Txt variant="label" color={kind.color}>
              {kind.label}
            </Txt>
          </View>
          <Txt variant="subtitle">{event.title}</Txt>
          <Txt variant="small" tone="secondary">
            {event.text}
          </Txt>
          {species && (
            <Txt variant="caption" tone="accent">
              Voir la fiche : {species.name} ›
            </Txt>
          )}
        </View>
      </Tap>
    );
  }

  return (
    <Tap onPress={open} style={[styles.card, { width, backgroundColor: colors.surface, borderColor: colors.border }]} accessibilityLabel={event.title}>
      <View style={styles.cardImage}>{visual}</View>
      <View style={styles.cardBody}>
        <View style={styles.kind}>
          <Icon icon={mci(kind.icon)} size={14} color={kind.color} />
          <Txt variant="label" color={kind.color}>
            {kind.label}
          </Txt>
        </View>
        <Txt variant="subtitle" numberOfLines={2}>
          {event.title}
        </Txt>
        <Txt variant="small" tone="secondary" numberOfLines={3}>
          {event.text}
        </Txt>
      </View>
    </Tap>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1, gap: 3 },
  kind: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  card: { borderRadius: Radius.xl, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  cardImage: { height: 120, overflow: 'hidden' },
  cardBody: { padding: 14, gap: 4 },
  row: { flexDirection: 'row', gap: 14, padding: 12, borderRadius: Radius.xl, borderWidth: StyleSheet.hairlineWidth },
  rowImage: { width: 84, height: 84, borderRadius: Radius.lg, overflow: 'hidden' },
});
