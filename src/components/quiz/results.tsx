import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';

import { alpha, Gutter, Radius } from '@/constants/theme';
import { getSpecies } from '@/data';
import { useTheme } from '@/hooks/use-theme';
import { BADGES_BY_ID, levelFromXp } from '@/lib/progress';
import type { ModeInfo, Question } from '@/lib/quiz';
import type { QuizReward } from '@/store';
import { useStore } from '@/store';

import { APP_URL, shareContent } from '../share/share';
import { SpeciesImage } from '../species/species-image';
import { Icon, mci } from '../ui/icon';
import { ProgressBar, ProgressRing } from '../ui/progress-ring';
import { Tap } from '../ui/tap';
import { Txt } from '../ui/text';
import { Confetti } from './confetti';

export interface PlayedQuestion {
  question: Question;
  choiceId: string | null;
  correct: boolean;
  points: number;
}

function verdict(ratio: number, endless: boolean, correct: number): { title: string; subtitle: string } {
  if (endless) {
    if (correct >= 20) return { title: 'Légendaire !', subtitle: 'Une performance de grand naturaliste.' };
    if (correct >= 10) return { title: 'Très belle série !', subtitle: 'Vous connaissez votre règne animal.' };
    if (correct >= 5) return { title: 'Bien joué !', subtitle: 'Encore un effort pour battre votre record.' };
    return { title: 'À vous de rejouer !', subtitle: 'Chaque partie vous rend plus fort.' };
  }
  if (ratio === 1) return { title: 'Sans faute !', subtitle: 'Parfait, rien ne vous échappe.' };
  if (ratio >= 0.8) return { title: 'Excellent !', subtitle: 'Un vrai regard de zoologiste.' };
  if (ratio >= 0.6) return { title: 'Bravo !', subtitle: 'De très bonnes bases.' };
  if (ratio >= 0.4) return { title: 'Pas mal !', subtitle: 'Les fiches vous aideront à progresser.' };
  return { title: 'On s’accroche !', subtitle: 'Explorez les espèces ratées, puis retentez.' };
}

export function QuizResults({
  info,
  played,
  points,
  reward,
  practice,
  onReplay,
}: {
  info: ModeInfo;
  played: PlayedQuestion[];
  points: number;
  reward: QuizReward | null;
  practice: boolean;
  onReplay: () => void;
}) {
  const router = useRouter();
  const { colors } = useTheme();
  const xp = useStore((s) => s.xp);
  const correct = played.filter((p) => p.correct).length;
  const total = played.length;
  const endless = info.length === null;
  const ratio = total ? correct / total : 0;
  const v = verdict(ratio, endless, correct);
  const level = levelFromXp(xp);
  const celebrate = (reward?.perfect || reward?.record) && correct > 0;

  const share = () => {
    shareContent({
      message: `Faunapedia · ${info.title} : ${endless ? `${correct} bonnes réponses` : `${correct}/${total}`} (${points} points) 🦉`,
      url: APP_URL,
      title: 'Faunapedia',
    });
  };

  return (
    <View style={styles.wrap}>
      {celebrate && <Confetti />}
      <Animated.View entering={ZoomIn.springify().damping(14)} style={styles.center}>
        <ProgressRing size={170} stroke={12} progress={endless ? Math.min(1, correct / 20) : ratio} color={info.color}>
          <Txt variant="hero">{endless ? correct : `${correct}/${total}`}</Txt>
          <Txt variant="caption" tone="muted">
            {endless ? 'bonnes réponses' : 'bonnes réponses'}
          </Txt>
        </ProgressRing>
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(150)} style={styles.center}>
        <Txt variant="display" align="center">
          {v.title}
        </Txt>
        <Txt variant="body" tone="secondary" align="center">
          {v.subtitle}
        </Txt>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(250)} style={styles.statsRow}>
        <StatBox label="Points" value={String(points)} color={info.color} />
        <StatBox label="XP gagnée" value={reward ? `+${reward.xp}` : '—'} color={colors.accent} />
        {reward?.streak ? <StatBox label="Série" value={`${reward.streak} 🔥`} color="#F97316" /> : null}
      </Animated.View>

      {practice && (
        <Txt variant="small" tone="muted" align="center">
          Partie d’entraînement : le défi du jour est déjà relevé.
        </Txt>
      )}
      {reward?.record && !practice && (
        <View style={[styles.banner, { backgroundColor: alpha('#FACC15', 0.14), borderColor: alpha('#FACC15', 0.4) }]}>
          <Icon icon={mci('trophy')} size={20} color="#FACC15" />
          <Txt variant="smallStrong" color="#FACC15">
            Nouveau record personnel !
          </Txt>
        </View>
      )}

      <Animated.View entering={FadeInDown.delay(320)} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.levelHead}>
          <Txt variant="subtitle">
            Niveau {level.level} · {level.rank.title}
          </Txt>
          {reward && reward.levelAfter > reward.levelBefore && (
            <Txt variant="smallStrong" tone="accent">
              Niveau supérieur !
            </Txt>
          )}
        </View>
        <ProgressBar progress={level.progress} color={colors.accent} height={8} />
        <Txt variant="caption" tone="muted">
          {level.current} / {level.needed} XP vers le niveau {level.level + 1}
        </Txt>
      </Animated.View>

      {reward && reward.newBadges.length > 0 && (
        <View style={styles.badges}>
          <Txt variant="label" tone="muted">
            Badges débloqués
          </Txt>
          {reward.newBadges.map((id) => {
            const b = BADGES_BY_ID[id];
            if (!b) return null;
            return (
              <View key={id} style={[styles.badge, { backgroundColor: alpha(b.color, 0.12), borderColor: alpha(b.color, 0.4) }]}>
                <Icon icon={b.icon} size={22} color={b.color} />
                <View style={styles.flex}>
                  <Txt variant="subtitle">{b.title}</Txt>
                  <Txt variant="caption" tone="secondary">
                    {b.description}
                  </Txt>
                </View>
              </View>
            );
          })}
        </View>
      )}

      <View style={styles.actions}>
        <Tap onPress={onReplay} style={[styles.primary, { backgroundColor: info.color }]}>
          <Icon icon={mci('replay')} size={20} color="#0B0B0B" />
          <Txt variant="subtitle" color="#0B0B0B">
            Rejouer
          </Txt>
        </Tap>
        <Tap onPress={share} style={[styles.secondary, { backgroundColor: colors.surfaceRaised }]} accessibilityLabel="Partager">
          <Icon icon={mci('share-variant')} size={20} color={colors.text} />
        </Tap>
      </View>
      <Tap onPress={() => (router.canGoBack() ? router.back() : router.replace('/quiz'))} style={styles.link}>
        <Txt variant="smallStrong" tone="secondary">
          Retour aux modes de jeu
        </Txt>
      </Tap>

      <View style={styles.review}>
        <Txt variant="heading">Récapitulatif</Txt>
        {played.map((p, i) => {
          const s = getSpecies(p.question.learnIds[0]);
          return (
            <Tap
              key={p.question.id}
              onPress={() => s && router.push(`/species/${s.id}`)}
              style={[styles.reviewRow, { borderBottomColor: colors.border }]}
              scaleTo={0.99}>
              {s && <SpeciesImage species={s} size="square" style={styles.thumb} />}
              <View style={styles.flex}>
                <Txt variant="caption" tone="muted">
                  {i + 1}. {p.question.category}
                </Txt>
                <Txt variant="smallStrong" numberOfLines={1}>
                  {s?.name ?? p.question.prompt}
                </Txt>
              </View>
              <Icon icon={mci(p.correct ? 'check-circle' : 'close-circle')} size={22} color={p.correct ? colors.success : colors.danger} />
            </Tap>
          );
        })}
      </View>
    </View>
  );
}

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.stat, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Txt variant="number" color={color}>
        {value}
      </Txt>
      <Txt variant="caption" tone="muted">
        {label}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: Gutter, gap: 18, paddingBottom: 30 },
  center: { alignItems: 'center', gap: 6 },
  flex: { flex: 1 },
  statsRow: { flexDirection: 'row', gap: 10 },
  stat: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: Radius.lg, borderWidth: StyleSheet.hairlineWidth, gap: 2 },
  banner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, borderRadius: Radius.lg, borderWidth: 1 },
  card: { padding: 16, gap: 10, borderRadius: Radius.xl, borderWidth: StyleSheet.hairlineWidth },
  levelHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badges: { gap: 8 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: Radius.lg, borderWidth: 1 },
  actions: { flexDirection: 'row', gap: 10 },
  primary: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: Radius.lg },
  secondary: { width: 56, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.lg },
  link: { alignSelf: 'center', padding: 6 },
  review: { gap: 4, marginTop: 10 },
  reviewRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  thumb: { width: 44, height: 44, borderRadius: 10 },
});
