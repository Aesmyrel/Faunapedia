import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { alpha, Radius } from '@/constants/theme';
import { SPECIES_BY_GROUP } from '@/data';
import { GROUPS } from '@/data/reference';
import type { GroupId } from '@/data/types';
import { useTheme } from '@/hooks/use-theme';
import { useStore } from '@/store';

import { Icon } from '../ui/icon';
import { ProgressBar } from '../ui/progress-ring';
import { Tap } from '../ui/tap';
import { Txt } from '../ui/text';

/** Tuile d’un grand groupe animal, avec la progression des découvertes. */
export function GroupTile({ id, width = 150 }: { id: GroupId; width?: number }) {
  const router = useRouter();
  const { colors } = useTheme();
  const g = GROUPS[id];
  const all = SPECIES_BY_GROUP[id];
  const seen = useStore((s) => all.filter((sp) => s.seen[sp.id]).length);
  return (
    <Tap
      onPress={() => router.push(`/group/${id}`)}
      style={[styles.tile, { width, borderColor: alpha(g.color, 0.28), backgroundColor: colors.surface }]}
      accessibilityLabel={`${g.label}, ${seen} sur ${all.length} découvertes`}>
      <LinearGradient colors={[alpha(g.color, 0.22), alpha(g.color, 0)]} style={StyleSheet.absoluteFill} />
      <View style={[styles.icon, { backgroundColor: alpha(g.color, 0.18) }]}>
        <Icon icon={g.icon} size={22} color={g.color} />
      </View>
      <View style={styles.text}>
        <Txt variant="subtitle" numberOfLines={1}>
          {g.label}
        </Txt>
        <Txt variant="caption" tone="muted">
          {seen}/{all.length} découvertes
        </Txt>
      </View>
      <ProgressBar progress={seen / all.length} color={g.color} height={4} />
    </Tap>
  );
}

const styles = StyleSheet.create({
  tile: { borderRadius: Radius.lg, padding: 14, gap: 12, overflow: 'hidden', borderWidth: 1 },
  icon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  text: { gap: 2 },
});
