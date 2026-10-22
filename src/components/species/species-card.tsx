import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { alpha, Radius } from '@/constants/theme';
import { GROUPS } from '@/data/reference';
import type { Species } from '@/data/types';
import { useTheme } from '@/hooks/use-theme';
import { useStore } from '@/store';

import { Icon, mci } from '../ui/icon';
import { StatusBadge } from '../ui/status-badge';
import { Tap } from '../ui/tap';
import { Txt } from '../ui/text';
import { SpeciesImage } from './species-image';

export type CardVariant = 'tile' | 'wide' | 'row' | 'feature';

export interface SpeciesCardProps {
  species: Species;
  variant?: CardVariant;
  width?: number;
  onPress?: () => void;
  subtitle?: string;
  style?: StyleProp<ViewStyle>;
}

/** Carte d’espèce : vignette de grille, carte large de carrousel ou ligne de liste. */
export function SpeciesCard({ species: s, variant = 'tile', width, onPress, subtitle, style }: SpeciesCardProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const seen = useStore((st) => Boolean(st.seen[s.id]));
  const favorite = useStore((st) => st.favorites.includes(s.id));
  const group = GROUPS[s.group];
  const open = onPress ?? (() => router.push(`/species/${s.id}`));

  if (variant === 'row') {
    return (
      <Tap onPress={open} style={[styles.row, { borderBottomColor: colors.border }, style]} scaleTo={0.985} accessibilityLabel={s.name}>
        <SpeciesImage species={s} size="small" style={styles.rowImage} />
        <View style={styles.rowText}>
          <Txt variant="subtitle" numberOfLines={1}>
            {s.name}
          </Txt>
          <Txt variant="sci" tone="secondary" numberOfLines={1} style={styles.rowSci}>
            {subtitle ?? s.sci}
          </Txt>
        </View>
        <StatusBadge status={s.status} small />
        <Icon icon={mci('chevron-right')} size={18} color={colors.textMuted} />
      </Tap>
    );
  }

  const isFeature = variant === 'feature';
  const height = variant === 'tile' ? (width ? width * 1.28 : 220) : isFeature ? 420 : 250;
  return (
    <Tap
      onPress={open}
      style={[styles.card, { width, height, borderColor: colors.border, backgroundColor: colors.surface }, style]}
      scaleTo={0.97}
      accessibilityLabel={`${s.name}, ${group.singular}`}>
      <SpeciesImage species={s} size={isFeature ? 'large' : 'medium'} style={StyleSheet.absoluteFill} priority={isFeature ? 'high' : 'normal'} />
      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.15)', 'rgba(0,0,0,0.82)']}
        locations={[0.35, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.topRow}>
        <View style={[styles.groupDot, { backgroundColor: alpha(group.color, 0.9) }]}>
          <Icon icon={group.icon} size={12} color="#0B0B0B" />
        </View>
        <View style={styles.flags}>
          {favorite && <Icon icon={mci('heart')} size={16} color="#FF6B81" />}
          {!seen && (
            <View style={[styles.newBadge, { backgroundColor: colors.accent }]}>
              <Txt variant="label" color={colors.onAccent} style={styles.newText}>
                Nouveau
              </Txt>
            </View>
          )}
        </View>
      </View>
      <View style={styles.caption}>
        {isFeature && <StatusBadge status={s.status} label />}
        <Txt variant={isFeature ? 'display' : variant === 'wide' ? 'heading' : 'subtitle'} color="#FFF" numberOfLines={2}>
          {s.name}
        </Txt>
        <Txt variant="sci" color="rgba(255,255,255,0.78)" numberOfLines={1} style={!isFeature && styles.smallSci}>
          {subtitle ?? s.sci}
        </Txt>
      </View>
    </Tap>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: Radius.xl, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth },
  topRow: { position: 'absolute', top: 10, left: 10, right: 10, flexDirection: 'row', justifyContent: 'space-between' },
  groupDot: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  flags: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  newBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: Radius.pill },
  newText: { fontSize: 9, letterSpacing: 0.8 },
  caption: { position: 'absolute', left: 14, right: 14, bottom: 14, gap: 4 },
  smallSci: { fontSize: 13, lineHeight: 17 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  rowImage: { width: 54, height: 54, borderRadius: 14 },
  rowText: { flex: 1, gap: 1 },
  rowSci: { fontSize: 13.5 },
});
