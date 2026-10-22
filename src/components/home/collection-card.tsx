import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { alpha, Radius } from '@/constants/theme';
import { SPECIES } from '@/data';
import type { Collection } from '@/data/reference';

import { SpeciesImage } from '../species/species-image';
import { Icon } from '../ui/icon';
import { Tap } from '../ui/tap';
import { Txt } from '../ui/text';

/** Carte d’une collection thématique (couverture = une espèce emblématique). */
export function CollectionCard({ collection: c, width = 260 }: { collection: Collection; width?: number }) {
  const router = useRouter();
  const members = SPECIES.filter(c.filter);
  const cover = members.find((s) => s.photos.length) ?? members[0];
  return (
    <Tap onPress={() => router.push(`/collection/${c.id}`)} style={[styles.card, { width }]} accessibilityLabel={c.title}>
      {cover && <SpeciesImage species={cover} style={StyleSheet.absoluteFill} />}
      <LinearGradient
        colors={[alpha(c.color, 0.15), 'rgba(0,0,0,0.25)', 'rgba(0,0,0,0.88)']}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.icon, { backgroundColor: alpha(c.color, 0.9) }]}>
        <Icon icon={c.icon} size={18} color="#0B0B0B" />
      </View>
      <View style={styles.caption}>
        <Txt variant="label" color={c.color}>
          {members.length} espèces
        </Txt>
        <Txt variant="heading" color="#fff">
          {c.title}
        </Txt>
        <Txt variant="caption" color="rgba(255,255,255,0.75)" numberOfLines={1}>
          {c.subtitle}
        </Txt>
      </View>
    </Tap>
  );
}

const styles = StyleSheet.create({
  card: { height: 190, borderRadius: Radius.xl, overflow: 'hidden', backgroundColor: '#111' },
  icon: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  caption: { position: 'absolute', left: 14, right: 14, bottom: 14, gap: 2 },
});
