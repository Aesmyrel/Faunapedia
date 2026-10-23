import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { alpha, Fonts, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { CHALLENGE_LENGTH, challengeMessage, challengeOutcome, challengeRank, type ChallengeScore, formatCode } from '@/lib/challenge';
import { formatNumber } from '@/lib/format';
import { MODES } from '@/lib/quiz';
import type { ChallengeRecord } from '@/store';

import { APP_URL, shareContent } from '../share/share';
import { Icon, mci } from '../ui/icon';
import { Tap } from '../ui/tap';
import { Txt } from '../ui/text';
import { codeFor } from './challenge-data';

const COLOR = MODES.challenge.color;

const VERDICTS = {
  win: { title: 'Victoire !', icon: 'trophy', color: '#FACC15' },
  lose: { title: 'Perdu de peu…', icon: 'emoticon-wink-outline', color: '#38BDF8' },
  draw: { title: 'Égalité parfaite !', icon: 'handshake-outline', color: '#34D399' },
} as const;

export const scoreLabel = (s: ChallengeScore) => `${s.correct}/${CHALLENGE_LENGTH}`;
export const pointsLabel = (s: ChallengeScore) => `${formatNumber(s.points, 0)} pts`;

/** Bilan d’un défi : le duel (ou le classement), le code à envoyer et le bouton de partage. */
export function ChallengeCard({ record, compact = false }: { record: ChallengeRecord & { mine: ChallengeScore }; compact?: boolean }) {
  const { colors } = useTheme();
  const [copied, setCopied] = useState(false);
  const { mine, rivals } = record;
  const code = codeFor(record.seed, mine);
  const solo = rivals.length === 1 ? rivals[0] : undefined;
  const outcome = solo ? challengeOutcome(mine, solo) : null;
  const verdict = outcome ? VERDICTS[outcome] : null;
  const rank = challengeRank(mine, rivals);

  const send = () =>
    shareContent({
      message: challengeMessage({ code, score: mine, rival: solo, url: APP_URL }),
      title: 'Défi Faunapedia',
    });
  const copy = async () => {
    await Clipboard.setStringAsync(formatCode(code));
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  // Classement : vous et chaque adversaire, du meilleur au moins bon.
  const board = [{ ...mine, you: true }, ...rivals.map((r) => ({ ...r, you: false }))].sort((a, b) => b.correct - a.correct || b.points - a.points);

  return (
    <Animated.View entering={FadeInDown.duration(300)} style={[styles.card, { backgroundColor: colors.surface, borderColor: alpha(COLOR, 0.45) }]}>
      {verdict && solo ? (
        <>
          <View style={styles.verdict}>
            <Icon icon={mci(verdict.icon)} size={22} color={verdict.color} />
            <Txt variant="heading" color={verdict.color}>
              {verdict.title}
            </Txt>
          </View>
          <View style={styles.duel}>
            <Side label="Vous" score={mine} highlight={outcome !== 'lose'} />
            <Txt variant="label" tone="muted">
              contre
            </Txt>
            <Side label="Adversaire" score={solo} highlight={outcome !== 'win'} />
          </View>
        </>
      ) : rivals.length > 1 ? (
        <>
          <View style={styles.verdict}>
            <Icon icon={mci(rank === 1 ? 'trophy' : 'podium')} size={22} color={rank === 1 ? '#FACC15' : COLOR} />
            <Txt variant="heading">
              {rank === 1 ? 'Vous êtes en tête !' : `${rank}e sur ${rivals.length + 1}`}
            </Txt>
          </View>
          <View style={styles.board}>
            {board.map((b, i) => (
              <View key={b.you ? 'you' : `${i}-${b.correct}-${b.points}`} style={[styles.boardRow, b.you && { backgroundColor: alpha(COLOR, 0.14) }]}>
                <Txt variant="smallStrong" tone="muted" style={styles.rank}>
                  {i + 1}
                </Txt>
                <Txt variant={b.you ? 'smallStrong' : 'small'} style={styles.flex}>
                  {b.you ? 'Vous' : 'Adversaire'}
                </Txt>
                <Txt variant="smallStrong">{scoreLabel(b)}</Txt>
                <Txt variant="caption" tone="muted" style={styles.pts}>
                  {pointsLabel(b)}
                </Txt>
              </View>
            ))}
          </View>
        </>
      ) : (
        <View style={styles.intro}>
          <Txt variant="label" color={COLOR}>
            Défi prêt à envoyer
          </Txt>
          {!compact && (
            <Txt variant="small" tone="secondary">
              Vos amis répondront exactement aux mêmes questions. Quand ils vous renvoient leur code, entrez-le dans « Défier un ami » pour voir qui gagne.
            </Txt>
          )}
        </View>
      )}

      <View style={[styles.codeBox, { backgroundColor: colors.surfaceRaised }]}>
        <View style={styles.flex}>
          <Txt variant="caption" tone="muted">
            Votre code ({scoreLabel(mine)} · {pointsLabel(mine)})
          </Txt>
          <Txt variant="title" style={styles.code} selectable>
            {formatCode(code)}
          </Txt>
        </View>
        <Tap onPress={copy} style={styles.copy} accessibilityLabel="Copier le code" haptic="select">
          <Icon icon={mci(copied ? 'check' : 'content-copy')} size={20} color={copied ? colors.success : colors.textSecondary} />
        </Tap>
      </View>

      <Tap onPress={send} style={[styles.send, { backgroundColor: COLOR }]}>
        <Icon icon={mci('send')} size={18} color="#0B0B0B" />
        <Txt variant="subtitle" color="#0B0B0B">
          {solo ? 'Renvoyer mon score' : 'Envoyer le défi'}
        </Txt>
      </Tap>
    </Animated.View>
  );
}

function Side({ label, score, highlight }: { label: string; score: ChallengeScore; highlight: boolean }) {
  return (
    <View style={styles.side}>
      <Txt variant="caption" tone="muted">
        {label}
      </Txt>
      <Txt variant="hero" tone={highlight ? 'primary' : 'muted'}>
        {scoreLabel(score)}
      </Txt>
      <Txt variant="caption" tone="secondary">
        {pointsLabel(score)}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, gap: 14, borderRadius: Radius.xl, borderWidth: 1 },
  verdict: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  duel: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  side: { alignItems: 'center', gap: 2, minWidth: 110 },
  intro: { gap: 6 },
  board: { gap: 4 },
  boardRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, paddingHorizontal: 10, borderRadius: Radius.md },
  rank: { width: 18 },
  pts: { width: 64, textAlign: 'right' },
  flex: { flex: 1 },
  codeBox: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 14, borderRadius: Radius.lg },
  code: { fontFamily: Fonts.mono, letterSpacing: 2 },
  copy: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  send: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: Radius.lg },
});
