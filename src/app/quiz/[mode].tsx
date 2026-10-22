import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Modal, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp, SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChoiceBinary, ChoicePhoto, ChoiceRow, type ChoiceState } from '@/components/quiz/choice-button';
import { CluesPanel, QuestionMedia } from '@/components/quiz/question-media';
import { type PlayedQuestion, QuizResults } from '@/components/quiz/results';
import { Chip } from '@/components/ui/chip';
import { HeroHeader } from '@/components/ui/hero-header';
import { Icon, mci } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { ProgressBar } from '@/components/ui/progress-ring';
import { EmptyState } from '@/components/ui/states';
import { Tap } from '@/components/ui/tap';
import { Txt } from '@/components/ui/text';
import { alpha, Gutter, MaxContentWidth, Radius } from '@/constants/theme';
import { getSpecies, hashString, SPECIES } from '@/data';
import { GROUP_ORDER, GROUPS } from '@/data/reference';
import type { GroupId } from '@/data/types';
import { useHaptics } from '@/hooks/use-haptics';
import { useTheme } from '@/hooks/use-theme';
import { capitalize, todayKey } from '@/lib/format';
import { dueReviews } from '@/lib/progress';
import {
  createQuiz,
  DIFFICULTY_LABELS,
  type Difficulty,
  MODES,
  type Question,
  type Quiz,
  type QuizMode,
  scoreAnswer,
} from '@/lib/quiz';
import { randomSeed } from '@/lib/random';
import { type QuizReward, useStore } from '@/store';

type Phase = 'intro' | 'play' | 'results';

/** Horloge lue uniquement dans les gestionnaires d’événements (jamais au rendu). */
const clock = () => Date.now();

const PRAISE = ['Bravo !', 'Excellent !', 'Bien vu !', 'Parfait !', 'Impressionnant !', 'Exact !'];
const OOPS = ['Raté…', 'Pas cette fois', 'Dommage !', 'Presque !'];

export default function QuizSessionScreen() {
  const params = useLocalSearchParams<{ mode: string; difficulty?: string; group?: string; species?: string }>();
  const mode: QuizMode = params.mode && params.mode in MODES ? (params.mode as QuizMode) : 'quick';
  const info = MODES[mode];
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const h = useHaptics();
  const today = todayKey();

  const daily = useStore((s) => s.daily);
  const review = useStore((s) => s.review);
  const best = useStore((s) => s.stats.bestCorrect[mode]);
  const finishQuiz = useStore((s) => s.finishQuiz);
  // Défi du jour déjà relevé : la partie devient un entraînement (figé au lancement).
  const practice = mode === 'daily' && daily.last === today;
  const [practiceRun, setPracticeRun] = useState(false);

  const [difficulty, setDifficulty] = useState<Difficulty>(() => {
    const d = Number(params.difficulty);
    return d === 1 || d === 2 || d === 3 ? d : 2;
  });
  const [group, setGroup] = useState<GroupId | undefined>(params.group as GroupId | undefined);
  const [phase, setPhase] = useState<Phase>('intro');
  const target = getSpecies(params.species);
  // Espèces à revoir d’ici la fin de la journée.
  const focusIds = useMemo(
    () => (mode === 'review' ? dueReviews(review, new Date(`${today}T23:59:59`).getTime()).slice(0, 30) : undefined),
    [mode, review, today],
  );

  // ─── État de la partie ───
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [played, setPlayed] = useState<PlayedQuestion[]>([]);
  const [points, setPoints] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [lives, setLives] = useState(info.lives ?? 0);
  const [revealed, setRevealed] = useState(1);
  const [lastGain, setLastGain] = useState(0);
  const [timeLeft, setTimeLeft] = useState(info.timeLimitSec ?? 0);
  const [reward, setReward] = useState<QuizReward | null>(null);
  const [confirmQuit, setConfirmQuit] = useState(false);
  const [failures, setFailures] = useState(0);
  const startedAt = useRef(0);
  const finished = useRef(false);

  const finish = useCallback(
    (list: PlayedQuestion[], total: number, best: number) => {
      if (finished.current) return;
      finished.current = true;
      const correct = list.filter((p) => p.correct).length;
      const r = finishQuiz({
        mode: practiceRun ? 'quick' : mode,
        correct,
        total: list.length,
        points: total,
        bestCombo: best,
        answers: list.map((p) => ({ speciesIds: p.question.learnIds, correct: p.correct })),
      });
      setReward(r);
      setPhase('results');
    },
    [finishQuiz, mode, practiceRun],
  );

  const load = (source: Quiz | null, i: number, streak: number) => {
    const q = source?.next(i, streak) ?? null;
    setSelected(null);
    setRevealed(1);
    setLastGain(0);
    if (!q) return false;
    setQuestion(q);
    startedAt.current = clock();
    return true;
  };

  const reset = () => {
    finished.current = false;
    setPlayed([]);
    setPoints(0);
    setCombo(0);
    setBestCombo(0);
    setLives(info.lives ?? 0);
    setTimeLeft(info.timeLimitSec ?? 0);
    setIndex(0);
    setReward(null);
    setFailures(0);
  };

  const start = () => {
    reset();
    setPracticeRun(practice);
    const q = createQuiz(SPECIES, {
      mode,
      seed: mode === 'daily' ? hashString(`defi-${today}`) : randomSeed(),
      difficulty,
      group: mode === 'quick' || mode === 'silhouettes' || mode === 'survival' ? group : undefined,
      speciesId: target?.id,
      focusIds,
    });
    setQuiz(q);
    setPhase('play');
    load(q, 0, 0);
  };

  // Chronomètre du contre-la-montre.
  useEffect(() => {
    if (phase !== 'play' || !info.timeLimitSec) return;
    const t = setInterval(() => setTimeLeft((v) => Math.max(0, v - 0.1)), 100);
    return () => clearInterval(t);
  }, [phase, info.timeLimitSec]);
  useEffect(() => {
    if (phase === 'play' && info.timeLimitSec && timeLeft <= 0) finish(played, points, bestCombo);
  }, [timeLeft, phase, info.timeLimitSec, finish, played, points, bestCombo]);

  const next = (list = played, total = points, streak = combo, livesLeft = lives, best = bestCombo) => {
    const outOfLives = info.lives !== undefined && livesLeft <= 0;
    const done = info.length !== null && index + 1 >= info.length;
    if (outOfLives || done) return finish(list, total, best);
    const ni = index + 1;
    setIndex(ni);
    if (!load(quiz, ni, streak)) finish(list, total, best);
  };

  const answer = (choiceId: string) => {
    if (!question || selected || phase !== 'play') return;
    const correct = choiceId === question.answerId;
    const elapsed = clock() - startedAt.current;
    const s = scoreAnswer({
      correct,
      difficulty: question.difficulty,
      elapsedMs: elapsed,
      combo,
      cluesUsed: question.kind === 'clues' ? revealed : undefined,
    });
    if (correct) h.success();
    else h.error();
    const streak = correct ? combo + 1 : 0;
    const best = Math.max(bestCombo, streak);
    const total = points + s.points;
    const livesLeft = !correct && info.lives !== undefined ? lives - 1 : lives;
    const list = [...played, { question, choiceId, correct, points: s.points }];
    setSelected(choiceId);
    setCombo(streak);
    setBestCombo(best);
    setPoints(total);
    setLastGain(s.points);
    setLives(livesLeft);
    setPlayed(list);
    if (info.timeLimitSec) {
      if (!correct) setTimeLeft((v) => Math.max(0, v - 3));
      setTimeout(() => next(list, total, streak, livesLeft, best), correct ? 450 : 900);
    }
  };

  // Son indisponible (hors ligne, pas d’enregistrement libre) : on passe à une autre question.
  const onUnavailable = useCallback(() => {
    if (selected) return;
    const tries = failures + 1;
    setFailures(tries);
    const q = tries < 5 && quiz ? quiz.next(index, combo) : null;
    setQuestion(q);
    startedAt.current = clock();
  }, [quiz, index, combo, selected, failures]);

  const close = () => {
    if (phase === 'play' && played.length > 0) setConfirmQuit(true);
    else if (router.canGoBack()) router.back();
    else router.replace('/quiz');
  };

  // ─── Rendu ───
  const header = (
    <View style={[styles.topBar, { paddingTop: insets.top + 6 }, phase === 'intro' && styles.topBarFloating]}>
      <IconButton icon={mci('close')} onPress={close} label="Quitter" size={38} />
      {phase === 'play' ? (
        <View style={styles.topCenter}>
          {info.length !== null ? (
            <Segments total={info.length} played={played} current={index} />
          ) : info.timeLimitSec ? (
            <View style={styles.timer}>
              <View style={styles.flex}>
                <ProgressBar progress={timeLeft / info.timeLimitSec} color={timeLeft < 10 ? colors.danger : info.color} height={8} />
              </View>
              <Txt variant="smallStrong" style={styles.timerText} color={timeLeft < 10 ? colors.danger : colors.text}>
                {Math.ceil(timeLeft)} s
              </Txt>
            </View>
          ) : (
            <View style={styles.lives}>
              {Array.from({ length: info.lives ?? 0 }, (_, i) => (
                <Icon key={i} icon={mci(i < lives ? 'heart' : 'heart-outline')} size={20} color={i < lives ? '#EF4444' : colors.textMuted} />
              ))}
              <Txt variant="smallStrong" tone="secondary" style={styles.counter}>
                {played.filter((p) => p.correct).length} ✓
              </Txt>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.topCenter}>
          <Txt variant="subtitle" align="center">
            {info.title}
          </Txt>
        </View>
      )}
      <View style={[styles.score, { backgroundColor: alpha(info.color, 0.16) }]}>
        <Txt variant="smallStrong" color={info.color}>
          {points}
        </Txt>
      </View>
    </View>
  );

  if (phase === 'intro') {
    const dueCount = focusIds?.length ?? 0;
    const blocked = mode === 'review' && dueCount === 0;
    return (
      <View style={[styles.fill, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={[styles.introContent, { paddingTop: insets.top + 90, paddingBottom: insets.bottom + 30 }]}>
          <HeroHeader
            icon={info.icon}
            color={info.color}
            eyebrow={
              mode === 'daily'
                ? capitalize(new Date(`${today}T12:00:00`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }))
                : info.tagline
            }
            title={target && mode === 'species' ? `${info.title} : ${target.name}` : info.title}
            description={info.description}
          />
          <View style={styles.introBody}>
            {best !== undefined && best > 0 && (
              <View style={[styles.bestRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Icon icon={mci('trophy-outline')} size={20} color="#FACC15" />
                <Txt variant="smallStrong" style={styles.flex}>
                  Votre record : {best} bonne{best > 1 ? 's' : ''} réponse{best > 1 ? 's' : ''}
                </Txt>
              </View>
            )}
            {practice && (
              <View style={[styles.bestRow, { backgroundColor: alpha(colors.success, 0.12), borderColor: alpha(colors.success, 0.4) }]}>
                <Icon icon={mci('check-decagram')} size={20} color={colors.success} />
                <Txt variant="smallStrong" style={styles.flex}>
                  Défi relevé aujourd’hui : {daily.scores[today] ?? 0}/10. Vous pouvez rejouer pour vous entraîner.
                </Txt>
              </View>
            )}
            {mode === 'quick' && (
              <View style={styles.option}>
                <Txt variant="label" tone="muted">
                  Difficulté
                </Txt>
                <View style={styles.chips}>
                  {([1, 2, 3] as Difficulty[]).map((d) => (
                    <Chip key={d} label={DIFFICULTY_LABELS[d]} selected={difficulty === d} color={info.color} onPress={() => setDifficulty(d)} />
                  ))}
                </View>
              </View>
            )}
            {(mode === 'quick' || mode === 'silhouettes' || mode === 'survival') && (
              <View style={styles.option}>
                <Txt variant="label" tone="muted">
                  Thème
                </Txt>
                <View style={styles.chips}>
                  <Chip label="Tout le règne animal" selected={!group} onPress={() => setGroup(undefined)} size="sm" />
                  {GROUP_ORDER.filter((g) => g !== 'others').map((g) => (
                    <Chip
                      key={g}
                      label={GROUPS[g].label}
                      icon={GROUPS[g].icon}
                      color={GROUPS[g].color}
                      selected={group === g}
                      onPress={() => setGroup(group === g ? undefined : g)}
                      size="sm"
                    />
                  ))}
                </View>
              </View>
            )}
            {info.online && (
              <Txt variant="small" tone="muted">
                Ce mode nécessite une connexion : les enregistrements proviennent d’iNaturalist.
              </Txt>
            )}
            {blocked ? (
              <EmptyState
                icon={mci('check-all')}
                title="Rien à réviser"
                message="Les espèces sur lesquelles vous vous trompez apparaîtront ici, à intervalles croissants."
              />
            ) : (
              <Tap onPress={start} style={[styles.startBtn, { backgroundColor: info.color }]}>
                <Txt variant="subtitle" color="#0B0B0B">
                  {practice ? 'S’entraîner' : 'C’est parti !'}
                </Txt>
                <Icon icon={mci('arrow-right')} size={20} color="#0B0B0B" />
              </Tap>
            )}
            {mode === 'review' && dueCount > 0 && (
              <Txt variant="small" tone="muted" align="center">
                {dueCount} espèce{dueCount > 1 ? 's' : ''} à revoir aujourd’hui.
              </Txt>
            )}
          </View>
        </ScrollView>
        {header}
      </View>
    );
  }

  if (phase === 'results') {
    return (
      <View style={[styles.fill, { backgroundColor: colors.background }]}>
        {header}
        <ScrollView contentContainerStyle={[styles.resultsContent, { paddingBottom: insets.bottom + 30 }]}>
          <QuizResults
            info={info}
            played={played}
            points={points}
            reward={reward}
            practice={practiceRun}
            onReplay={() => {
              reset();
              setQuestion(null);
              setPhase('intro');
            }}
          />
        </ScrollView>
      </View>
    );
  }

  // ─── Phase de jeu ───
  if (!question) {
    return (
      <View style={[styles.fill, { backgroundColor: colors.background }]}>
        {header}
        <EmptyState
          icon={mci(failures > 0 ? 'wifi-off' : 'help-circle-outline')}
          title={failures > 0 ? 'Connexion nécessaire' : 'Préparation…'}
          message={failures > 0 ? 'Impossible de charger les enregistrements.' : undefined}
        />
      </View>
    );
  }

  const answered = selected !== null;
  const correctNow = answered && selected === question.answerId;
  const stateOf = (id: string): ChoiceState => {
    if (!answered) return 'idle';
    if (id === question.answerId) return 'correct';
    if (id === selected) return 'wrong';
    return 'dimmed';
  };
  const learn = getSpecies(question.learnIds[0]);
  const answerLabel = question.choices.find((c) => c.id === question.answerId)?.label;
  const feedbackTitle = correctNow ? PRAISE[index % PRAISE.length] : OOPS[index % OOPS.length];

  return (
    <View style={[styles.fill, { backgroundColor: colors.background }]}>
      {header}
      <ScrollView contentContainerStyle={[styles.playContent, { paddingBottom: answered && !info.timeLimitSec ? 260 : insets.bottom + 30 }]} showsVerticalScrollIndicator={false}>
        <Animated.View key={question.id} entering={FadeInDown.duration(350)} style={styles.questionBlock}>
          <View style={styles.metaRow}>
            <View style={[styles.category, { backgroundColor: alpha(info.color, 0.14) }]}>
              <Txt variant="label" color={info.color}>
                {question.category}
              </Txt>
            </View>
            {combo >= 3 && (
              <Animated.View entering={FadeIn} style={[styles.category, { backgroundColor: alpha('#F97316', 0.16) }]}>
                <Txt variant="label" color="#F97316">
                  Série ×{combo} 🔥
                </Txt>
              </Animated.View>
            )}
          </View>
          <Txt variant="title">{question.prompt}</Txt>
          {question.subject && (
            <Txt
              variant={question.subject.quote ? 'quote' : question.subject.italic ? 'sci' : 'heading'}
              tone={question.subject.quote ? 'secondary' : 'accent'}
              style={question.subject.italic && styles.subjectSci}>
              {question.subject.quote ? `« ${question.subject.text} »` : question.subject.text}
            </Txt>
          )}

          {question.kind === 'clues' ? (
            <CluesPanel question={question} revealed={revealed} answered={answered} onReveal={() => setRevealed((r) => r + 1)} />
          ) : (
            <QuestionMedia question={question} answered={answered} onUnavailable={onUnavailable} />
          )}

          {question.layout === 'grid' ? (
            <View style={styles.grid}>
              {[0, 2].map((row) => (
                <View key={row} style={styles.gridRow}>
                  {question.choices.slice(row, row + 2).map((c) => (
                    <ChoicePhoto key={c.id} choice={c} state={stateOf(c.id)} disabled={answered} showName={false} onPress={() => answer(c.id)} />
                  ))}
                </View>
              ))}
            </View>
          ) : question.layout === 'duel' ? (
            <View style={styles.duel}>
              {question.choices.map((c) => (
                <View key={c.id} style={styles.flex}>
                  <ChoicePhoto choice={c} state={stateOf(c.id)} disabled={answered} showName tall onPress={() => answer(c.id)} />
                </View>
              ))}
              <View pointerEvents="none" style={[styles.vs, { backgroundColor: colors.background, borderColor: colors.borderStrong }]}>
                <Txt variant="smallStrong">VS</Txt>
              </View>
            </View>
          ) : question.layout === 'binary' ? (
            <View style={styles.binaryRow}>
              {question.choices.map((c) => (
                <ChoiceBinary key={c.id} choice={c} state={stateOf(c.id)} disabled={answered} onPress={() => answer(c.id)} />
              ))}
            </View>
          ) : (
            <View style={styles.list}>
              {question.choices.map((c, i) => (
                <ChoiceRow key={c.id} choice={c} index={i} state={stateOf(c.id)} revealSub={answered} disabled={answered} onPress={() => answer(c.id)} />
              ))}
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {answered && info.timeLimitSec ? (
        <Animated.View entering={FadeInUp.duration(150)} pointerEvents="none" style={styles.flash}>
          <Txt variant="display" color={correctNow ? colors.success : colors.danger}>
            {correctNow ? `+${lastGain}` : '−3 s'}
          </Txt>
        </Animated.View>
      ) : null}

      {answered && !info.timeLimitSec && (
        <Animated.View
          entering={SlideInDown.springify().damping(18)}
          style={[
            styles.feedback,
            {
              backgroundColor: colors.surfaceRaised,
              borderColor: correctNow ? alpha(colors.success, 0.5) : alpha(colors.danger, 0.5),
              paddingBottom: insets.bottom + 14,
            },
          ]}>
          <View style={styles.feedbackHead}>
            <Icon icon={mci(correctNow ? 'check-circle' : 'close-circle')} size={26} color={correctNow ? colors.success : colors.danger} />
            <Txt variant="heading" style={styles.flex}>
              {feedbackTitle}
            </Txt>
            {correctNow && (
              <Txt variant="subtitle" color={colors.success}>
                +{lastGain}
              </Txt>
            )}
          </View>
          {!correctNow && answerLabel && question.layout !== 'binary' && (
            <Txt variant="smallStrong">Bonne réponse : {answerLabel}</Txt>
          )}
          <Txt variant="small" tone="secondary" numberOfLines={4}>
            {question.explanation}
          </Txt>
          <View style={styles.feedbackActions}>
            {learn && (
              <Tap onPress={() => router.push(`/species/${learn.id}`)} style={[styles.learnBtn, { backgroundColor: colors.surface }]}>
                <Icon icon={mci('book-open-variant')} size={18} color={colors.text} />
                <Txt variant="smallStrong">Fiche</Txt>
              </Tap>
            )}
            <Tap onPress={() => next()} style={[styles.nextBtn, { backgroundColor: info.color }]}>
              <Txt variant="subtitle" color="#0B0B0B">
                {(info.lives !== undefined && lives <= 0) || (info.length !== null && index + 1 >= info.length) ? 'Voir le résultat' : 'Continuer'}
              </Txt>
              <Icon icon={mci('arrow-right')} size={20} color="#0B0B0B" />
            </Tap>
          </View>
        </Animated.View>
      )}

      <Modal visible={confirmQuit} transparent animationType="fade" onRequestClose={() => setConfirmQuit(false)}>
        <View style={[styles.modalBg, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modal, { backgroundColor: colors.surfaceRaised }]}>
            <Txt variant="heading">Abandonner la partie ?</Txt>
            <Txt variant="small" tone="secondary">
              Votre progression dans cette partie sera perdue.
            </Txt>
            <View style={styles.modalActions}>
              <Tap onPress={() => setConfirmQuit(false)} style={[styles.modalBtn, { backgroundColor: colors.surface }]}>
                <Txt variant="smallStrong">Continuer</Txt>
              </Tap>
              <Tap
                onPress={() => {
                  setConfirmQuit(false);
                  if (router.canGoBack()) router.back();
                  else router.replace('/quiz');
                }}
                style={[styles.modalBtn, { backgroundColor: alpha(colors.danger, 0.2) }]}>
                <Txt variant="smallStrong" color={colors.danger}>
                  Abandonner
                </Txt>
              </Tap>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Segments({ total, played, current }: { total: number; played: PlayedQuestion[]; current: number }) {
  const { colors } = useTheme();
  return (
    <View style={styles.segments}>
      {Array.from({ length: total }, (_, i) => {
        const p = played[i];
        const color = p ? (p.correct ? colors.success : colors.danger) : i === current ? colors.textSecondary : colors.border;
        return <View key={i} style={[styles.segment, { backgroundColor: color }]} />;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  flex: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingBottom: 10 },
  topBarFloating: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 2 },
  topCenter: { flex: 1, justifyContent: 'center' },
  segments: { flexDirection: 'row', gap: 4 },
  segment: { flex: 1, height: 6, borderRadius: 3 },
  timer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  timerText: { minWidth: 36, textAlign: 'right' },
  lives: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  counter: { marginLeft: 8 },
  score: { minWidth: 54, paddingHorizontal: 10, paddingVertical: 7, borderRadius: Radius.pill, alignItems: 'center' },
  introContent: { width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' },
  introBody: { paddingHorizontal: Gutter, gap: 18 },
  bestRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: Radius.lg, borderWidth: 1 },
  option: { gap: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  startBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 18, borderRadius: Radius.lg, marginTop: 8 },
  resultsContent: { paddingTop: 20, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' },
  playContent: { paddingHorizontal: Gutter, paddingTop: 8, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' },
  questionBlock: { gap: 14 },
  metaRow: { flexDirection: 'row', gap: 8 },
  category: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.pill },
  subjectSci: { fontSize: 22, lineHeight: 28 },
  grid: { gap: 10 },
  gridRow: { flexDirection: 'row', gap: 10 },
  duel: { flexDirection: 'row', gap: 12 },
  vs: {
    position: 'absolute',
    left: '50%',
    marginLeft: -18,
    top: '42%',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    zIndex: 2,
  },
  binaryRow: { flexDirection: 'row', gap: 12 },
  list: { gap: 10 },
  flash: { position: 'absolute', top: '40%', alignSelf: 'center' },
  feedback: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 18,
    gap: 10,
    borderTopLeftRadius: Radius.xxl,
    borderTopRightRadius: Radius.xxl,
    borderWidth: 1,
    borderBottomWidth: 0,
  },
  feedbackHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  feedbackActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  learnBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, borderRadius: Radius.lg },
  nextBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15, borderRadius: Radius.lg },
  modalBg: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  modal: { width: '100%', maxWidth: 380, padding: 20, gap: 10, borderRadius: Radius.xl },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  modalBtn: { flex: 1, alignItems: 'center', paddingVertical: 13, borderRadius: Radius.md },
});
