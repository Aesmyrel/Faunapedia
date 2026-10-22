import { StyleSheet, View } from 'react-native';

import { HeroHeader } from '@/components/ui/hero-header';
import { Icon, mci } from '@/components/ui/icon';
import { ProgressBar } from '@/components/ui/progress-ring';
import { StackScreen } from '@/components/ui/stack-screen';
import { Txt } from '@/components/ui/text';
import { alpha, Gutter, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { BADGES } from '@/lib/progress';
import { useStore } from '@/store';

export default function BadgesScreen() {
  const { colors } = useTheme();
  const state = useStore();
  const snapshot = { seen: state.seen, favorites: state.favorites, xp: state.xp, stats: state.stats, daily: state.daily, counters: state.counters };
  const unlocked = BADGES.filter((b) => state.badges[b.id]).length;

  return (
    <StackScreen>
      <HeroHeader
        icon={mci('medal')}
        color="#FACC15"
        eyebrow={`${unlocked} / ${BADGES.length} débloqués`}
        title="Badges"
        description="Découvrez des espèces, relevez les défis et explorez l’arbre du vivant pour compléter votre collection."
      />
      <View style={styles.grid}>
        {BADGES.map((b) => {
          const owned = Boolean(state.badges[b.id]);
          const [cur, goal] = b.progress(snapshot);
          const hidden = b.secret && !owned;
          return (
            <View
              key={b.id}
              style={[
                styles.cell,
                { backgroundColor: colors.surface, borderColor: owned ? alpha(b.color, 0.5) : colors.border },
              ]}>
              <View style={[styles.icon, { backgroundColor: owned ? alpha(b.color, 0.2) : colors.surfaceRaised }]}>
                <Icon icon={hidden ? mci('help') : b.icon} size={26} color={owned ? b.color : colors.textMuted} />
              </View>
              <Txt variant="smallStrong" align="center" numberOfLines={2}>
                {hidden ? 'Badge secret' : b.title}
              </Txt>
              <Txt variant="caption" tone="muted" align="center" numberOfLines={3}>
                {hidden ? 'Continuez à jouer pour le découvrir…' : b.description}
              </Txt>
              {!owned && !hidden && (
                <View style={styles.progress}>
                  <ProgressBar progress={Math.min(1, cur / goal)} color={b.color} height={4} />
                  <Txt variant="caption" tone="muted" align="center">
                    {Math.min(cur, goal)}/{goal}
                  </Txt>
                </View>
              )}
              {owned && (
                <Txt variant="caption" color={b.color}>
                  Obtenu le {new Date(state.badges[b.id]).toLocaleDateString('fr-FR')}
                </Txt>
              )}
            </View>
          );
        })}
      </View>
    </StackScreen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: Gutter },
  cell: { width: '48%', flexGrow: 1, alignItems: 'center', gap: 6, padding: 14, borderRadius: Radius.xl, borderWidth: 1 },
  icon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  progress: { alignSelf: 'stretch', gap: 4, marginTop: 4 },
});
