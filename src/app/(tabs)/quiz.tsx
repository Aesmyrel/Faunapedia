import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Icon, mci } from '@/components/ui/icon';
import { ProgressBar, ProgressRing } from '@/components/ui/progress-ring';
import { TabScreen } from '@/components/ui/screen';
import { Section } from '@/components/ui/section';
import { Tap } from '@/components/ui/tap';
import { Txt } from '@/components/ui/text';
import { alpha, Gutter, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { challengeOutcome } from '@/lib/challenge';
import { todayKey } from '@/lib/format';
import { dueReviews, levelFromXp } from '@/lib/progress';
import { MODES, type QuizMode } from '@/lib/quiz';
import { activeStreak, useStore } from '@/store';

const GRID_MODES: QuizMode[] = ['quick', 'whoami', 'duel', 'survival', 'timed', 'expert', 'silhouettes', 'sounds', 'review'];

function untilMidnight(now: Date): string {
  const end = new Date(now);
  end.setHours(24, 0, 0, 0);
  const mins = Math.max(0, Math.round((end.getTime() - now.getTime()) / 60000));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h} h ${String(m).padStart(2, '0')}` : `${m} min`;
}

export default function QuizScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const xp = useStore((s) => s.xp);
  const stats = useStore((s) => s.stats);
  const daily = useStore((s) => s.daily);
  const review = useStore((s) => s.review);
  const badges = useStore((s) => s.badges);
  const challenges = useStore((s) => s.challenges);
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const level = levelFromXp(xp);
  const today = todayKey(now);
  const done = daily.last === today;
  const streak = activeStreak(daily, today);
  const due = dueReviews(review, now.getTime()).length;
  const accuracy = stats.answered ? Math.round((stats.correct / stats.answered) * 100) : 0;
  const dailyInfo = MODES.daily;
  const challengeInfo = MODES.challenge;
  const duels = challenges.flatMap((c) => (c.mine ? [{ mine: c.mine, rivals: c.rivals }] : []));
  const wins = duels.filter((c) => c.rivals.length > 0 && c.rivals.every((r) => challengeOutcome(c.mine, r) !== 'lose')).length;
  const waiting = duels.filter((c) => c.rivals.length === 0).length;

  return (
    <TabScreen>
      <View style={styles.header}>
        <Txt variant="label" tone="muted">
          Testez vos connaissances
        </Txt>
        <Txt variant="display">Quiz</Txt>
      </View>

      <Animated.View entering={FadeInDown.duration(400)} style={styles.block}>
        <Tap
          onPress={() => router.push('/carnet')}
          style={[styles.levelCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          scaleTo={0.98}>
          <ProgressRing size={74} stroke={6} progress={level.progress} color={colors.accent}>
            <Txt variant="caption" tone="muted">
              Niv.
            </Txt>
            <Txt variant="heading">{level.level}</Txt>
          </ProgressRing>
          <View style={styles.flex}>
            <Txt variant="heading">{level.rank.title}</Txt>
            <Txt variant="caption" tone="secondary" numberOfLines={2}>
              {level.rank.quote}
            </Txt>
            <View style={styles.xpRow}>
              <View style={styles.flex}>
                <ProgressBar progress={level.progress} color={colors.accent} />
              </View>
              <Txt variant="caption" tone="muted">
                {level.current}/{level.needed} XP
              </Txt>
            </View>
          </View>
        </Tap>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(80).duration(400)} style={styles.block}>
        <Tap onPress={() => router.push('/quiz/daily')} style={[styles.daily, { borderColor: alpha(dailyInfo.color, 0.45) }]}>
          <LinearGradient colors={[alpha(dailyInfo.color, 0.35), alpha(dailyInfo.color, 0.06)]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
          <View style={styles.dailyTop}>
            <View style={[styles.dailyIcon, { backgroundColor: alpha(dailyInfo.color, 0.25) }]}>
              <Icon icon={mci(done ? 'check-decagram' : 'calendar-star')} size={28} color={dailyInfo.color} />
            </View>
            <View style={styles.flex}>
              <Txt variant="label" color={dailyInfo.color}>
                Défi du jour
              </Txt>
              <Txt variant="title">{done ? `Relevé : ${daily.scores[today] ?? 0}/10` : '10 questions, une seule chance'}</Txt>
            </View>
          </View>
          <View style={styles.dailyBottom}>
            <View style={styles.pill}>
              <Icon icon={mci('fire')} size={16} color="#F97316" />
              <Txt variant="smallStrong">
                {streak > 0 ? `${streak} jour${streak > 1 ? 's' : ''} de suite` : 'Lancez votre série !'}
              </Txt>
            </View>
            <View style={styles.pill}>
              <Icon icon={mci('timer-sand')} size={16} color={colors.textSecondary} />
              <Txt variant="smallStrong" tone="secondary">
                {done ? `Prochain défi dans ${untilMidnight(now)}` : `Encore ${untilMidnight(now)}`}
              </Txt>
            </View>
          </View>
        </Tap>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(140).duration(400)} style={styles.block}>
        <Tap
          onPress={() => router.push('/defi')}
          style={[styles.challenge, { backgroundColor: colors.surface, borderColor: alpha(challengeInfo.color, 0.45) }]}
          accessibilityLabel="Défier un ami">
          <LinearGradient colors={[alpha(challengeInfo.color, 0.22), alpha(challengeInfo.color, 0)]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
          <View style={[styles.dailyIcon, { backgroundColor: alpha(challengeInfo.color, 0.22) }]}>
            <Icon icon={challengeInfo.icon} size={26} color={challengeInfo.color} />
          </View>
          <View style={styles.flex}>
            <Txt variant="label" color={challengeInfo.color}>
              Défier un ami
            </Txt>
            <Txt variant="subtitle">Les mêmes questions pour vous deux</Txt>
            <Txt variant="caption" tone="secondary">
              {challenges.length === 0
                ? 'Lancez un défi à un collègue ou relevez celui que vous avez reçu.'
                : [wins > 0 ? `${wins} victoire${wins > 1 ? 's' : ''}` : null, waiting > 0 ? `${waiting} en attente de réponse` : null, `${challenges.length} défi${challenges.length > 1 ? 's' : ''}`]
                    .filter(Boolean)
                    .join(' · ')}
            </Txt>
          </View>
          <Icon icon={mci('chevron-right')} size={22} color={colors.textMuted} />
        </Tap>
      </Animated.View>

      <Section title="Modes de jeu" eyebrow="Choisissez votre défi">
        <View style={styles.grid}>
          {GRID_MODES.map((m, i) => {
            const info = MODES[m];
            const best = stats.bestCorrect[m];
            const badge = m === 'review' && due > 0 ? `${due}` : undefined;
            return (
              <Animated.View key={m} entering={FadeInDown.delay(60 * i).duration(350)} style={styles.cell}>
                <Tap
                  onPress={() => router.push(`/quiz/${m}`)}
                  style={[styles.mode, { backgroundColor: colors.surface, borderColor: alpha(info.color, 0.3) }]}
                  accessibilityLabel={`${info.title} : ${info.tagline}`}>
                  <LinearGradient colors={[alpha(info.color, 0.16), alpha(info.color, 0)]} style={StyleSheet.absoluteFill} />
                  <View style={styles.modeTop}>
                    <View style={[styles.modeIcon, { backgroundColor: alpha(info.color, 0.18) }]}>
                      <Icon icon={info.icon} size={22} color={info.color} />
                    </View>
                    {badge && (
                      <View style={[styles.countBadge, { backgroundColor: info.color }]}>
                        <Txt variant="caption" color="#0B0B0B">
                          {badge}
                        </Txt>
                      </View>
                    )}
                    {info.online && <Icon icon={mci('wifi')} size={14} color={colors.textMuted} />}
                  </View>
                  <Txt variant="subtitle">{info.title}</Txt>
                  <Txt variant="caption" tone="secondary" numberOfLines={2}>
                    {info.tagline}
                  </Txt>
                  {best ? (
                    <Txt variant="caption" color={info.color}>
                      Record : {best}
                    </Txt>
                  ) : null}
                </Tap>
              </Animated.View>
            );
          })}
        </View>
      </Section>

      <Section title="Vos statistiques">
        <View style={styles.statsGrid}>
          <Stat label="Parties" value={String(stats.quizzes)} icon="gamepad-variant" color="#38BDF8" />
          <Stat label="Précision" value={`${accuracy} %`} icon="bullseye-arrow" color="#22C55E" />
          <Stat label="Meilleure série" value={String(stats.bestCombo)} icon="fire" color="#F97316" />
          <Stat label="Badges" value={String(Object.keys(badges).length)} icon="medal" color="#FACC15" onPress={() => router.push('/badges')} />
        </View>
      </Section>
    </TabScreen>
  );
}

function Stat({ label, value, icon, color, onPress }: { label: string; value: string; icon: string; color: string; onPress?: () => void }) {
  const { colors } = useTheme();
  const body = (
    <View style={[styles.stat, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Icon icon={mci(icon)} size={20} color={color} />
      <Txt variant="number">{value}</Txt>
      <Txt variant="caption" tone="muted">
        {label}
      </Txt>
    </View>
  );
  return onPress ? (
    <Tap onPress={onPress} style={styles.statCell}>
      {body}
    </Tap>
  ) : (
    <View style={styles.statCell}>{body}</View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: Gutter, marginBottom: 16, gap: 2 },
  block: { paddingHorizontal: Gutter, marginBottom: 12 },
  flex: { flex: 1 },
  levelCard: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 16, borderRadius: Radius.xl, borderWidth: StyleSheet.hairlineWidth },
  xpRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  daily: { padding: 18, gap: 16, borderRadius: Radius.xxl, borderWidth: 1, overflow: 'hidden' },
  dailyTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  dailyIcon: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  dailyBottom: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  challenge: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: Radius.xl, borderWidth: 1, overflow: 'hidden' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  cell: { width: '47.8%', flexGrow: 1 },
  mode: { padding: 14, gap: 6, borderRadius: Radius.xl, borderWidth: 1, overflow: 'hidden', minHeight: 150 },
  modeTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  modeIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  countBadge: { minWidth: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCell: { width: '47.8%', flexGrow: 1 },
  stat: { padding: 14, gap: 4, borderRadius: Radius.lg, borderWidth: StyleSheet.hairlineWidth },
});
