import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';

import { ChallengeCard, pointsLabel, scoreLabel } from '@/components/challenge/challenge-card';
import { codeFor, DATA_VERSION } from '@/components/challenge/challenge-data';
import { HeroHeader } from '@/components/ui/hero-header';
import { Icon, mci } from '@/components/ui/icon';
import { Section } from '@/components/ui/section';
import { StackScreen } from '@/components/ui/stack-screen';
import { Tap } from '@/components/ui/tap';
import { Txt } from '@/components/ui/text';
import { alpha, Fonts, Gutter, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { challengeOutcome, challengeRank, CODE_LENGTH, decodeChallenge, findChallengeCode, newChallengeSeed } from '@/lib/challenge';
import { MODES } from '@/lib/quiz';
import { type ChallengeRecord, useStore } from '@/store';

const COLOR = MODES.challenge.color;

const STEPS = [
  { icon: 'cards-outline', text: 'Vous jouez 10 questions.' },
  { icon: 'send-outline', text: 'Vous envoyez votre code par message.' },
  { icon: 'scale-balance', text: 'Votre ami joue les mêmes questions et vous renvoie le sien.' },
];

/** Tape le code par groupes de trois, en majuscules. */
const formatInput = (text: string) => {
  const raw = text
    .toUpperCase()
    .replace(/[^0-9A-Z]/g, '')
    .slice(0, CODE_LENGTH);
  return raw.match(/.{1,3}/g)?.join('-') ?? '';
};

/** Défier un collègue ou un ami : lancer un défi, relever celui qu’on a reçu, suivre ses duels. */
export default function ChallengeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ code?: string }>();
  const { colors } = useTheme();
  const challenges = useStore((s) => s.challenges);
  const recordChallenge = useStore((s) => s.recordChallenge);
  const [input, setInput] = useState(() => formatInput(params.code ?? ''));
  const [pasteError, setPasteError] = useState(false);
  const [open, setOpen] = useState<number | null>(null);

  const code = input.replace(/-/g, '');
  const decoded = code.length === CODE_LENGTH ? decodeChallenge(code) : null;
  const known = decoded ? challenges.find((c) => c.seed === decoded.seed) : undefined;
  const own = Boolean(decoded && known?.mine && codeFor(decoded.seed, known.mine) === code);
  const alreadyAdded = Boolean(decoded && known?.rivals.some((r) => r.code === code));
  const played = challenges.filter((c): c is ChallengeRecord & { mine: NonNullable<ChallengeRecord['mine']> } => c.mine !== undefined);

  const launch = () => router.push({ pathname: '/quiz/[mode]', params: { mode: 'challenge', seed: String(newChallengeSeed(Math.random)) } });
  const accept = () => router.push({ pathname: '/quiz/[mode]', params: { mode: 'challenge', code } });
  const paste = async () => {
    const text = await Clipboard.getStringAsync();
    const found = findChallengeCode(text ?? '');
    setPasteError(!found);
    if (found) setInput(formatInput(found));
  };
  /** Le défi est déjà joué : le code reçu ajoute simplement un adversaire. */
  const addRival = () => {
    if (!decoded) return;
    recordChallenge(decoded.seed, { rival: { ...decoded.score, code } });
    setOpen(decoded.seed);
    setInput('');
  };

  return (
    <StackScreen>
      <HeroHeader
        icon={MODES.challenge.icon}
        color={COLOR}
        eyebrow="Entre collègues et amis"
        title="Défier un ami"
        description="Un quiz de 10 questions, exactement les mêmes pour vous deux. Le meilleur score l’emporte ; à égalité, la rapidité départage."
      />

      <View style={styles.body}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: alpha(COLOR, 0.4) }]}>
          <Txt variant="heading">Lancer un défi</Txt>
          <View style={styles.steps}>
            {STEPS.map((step, i) => (
              <View key={step.text} style={styles.step}>
                <View style={[styles.stepIcon, { backgroundColor: alpha(COLOR, 0.16) }]}>
                  <Icon icon={mci(step.icon)} size={18} color={COLOR} />
                </View>
                <Txt variant="small" tone="secondary" style={styles.flex}>
                  {i + 1}. {step.text}
                </Txt>
              </View>
            ))}
          </View>
          <Tap onPress={launch} style={[styles.primary, { backgroundColor: COLOR }]}>
            <Icon icon={mci('sword-cross')} size={20} color="#0B0B0B" />
            <Txt variant="subtitle" color="#0B0B0B">
              Lancer un nouveau défi
            </Txt>
          </Tap>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Txt variant="heading">Relever un défi</Txt>
          <Txt variant="small" tone="secondary">
            Entrez le code reçu, ou copiez le message en entier et touchez « Coller ».
          </Txt>
          <View style={styles.inputRow}>
            <TextInput
              value={input}
              onChangeText={(t) => {
                setPasteError(false);
                setInput(formatInput(t));
              }}
              placeholder="XXX-XXX-XXX"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={11}
              accessibilityLabel="Code du défi"
              style={[styles.input, { color: colors.text, backgroundColor: colors.surfaceRaised, borderColor: decoded ? alpha(COLOR, 0.7) : colors.border }]}
            />
            <Tap onPress={paste} style={[styles.paste, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]} accessibilityLabel="Coller" haptic="select">
              <Icon icon={mci('content-paste')} size={18} color={colors.text} />
              <Txt variant="smallStrong">Coller</Txt>
            </Tap>
          </View>

          {pasteError && (
            <Txt variant="small" color={colors.danger}>
              Aucun code de défi trouvé dans le presse-papiers.
            </Txt>
          )}
          {code.length === CODE_LENGTH && !decoded && (
            <Txt variant="small" color={colors.danger}>
              Ce code ne correspond à aucun défi : vérifiez les caractères.
            </Txt>
          )}
          {decoded && (
            <Animated.View entering={FadeIn.duration(200)} style={styles.found}>
              {own ? (
                <Txt variant="small" tone="secondary">
                  C’est votre propre code : envoyez-le à vos amis pour qu’ils relèvent le défi.
                </Txt>
              ) : alreadyAdded ? (
                <Txt variant="small" tone="secondary">
                  Ce score est déjà enregistré dans vos défis, plus bas.
                </Txt>
              ) : (
                <>
                  <View style={[styles.target, { backgroundColor: alpha(COLOR, 0.12), borderColor: alpha(COLOR, 0.45) }]}>
                    <Icon icon={mci('target')} size={20} color={COLOR} />
                    <Txt variant="smallStrong" style={styles.flex}>
                      Score à battre : {scoreLabel(decoded.score)} · {pointsLabel(decoded.score)}
                    </Txt>
                  </View>
                  {decoded.data !== DATA_VERSION && (
                    <Txt variant="caption" tone="muted">
                      Votre ami n’a pas la même version de Faunapedia : quelques questions peuvent différer. Mettez l’appli à jour tous les deux pour un défi à armes égales.
                    </Txt>
                  )}
                  {known?.mine ? (
                    <Tap onPress={addRival} style={[styles.primary, { backgroundColor: COLOR }]}>
                      <Icon icon={mci('scale-balance')} size={20} color="#0B0B0B" />
                      <Txt variant="subtitle" color="#0B0B0B">
                        Vous avez déjà joué : voir qui gagne
                      </Txt>
                    </Tap>
                  ) : (
                    <Tap onPress={accept} style={[styles.primary, { backgroundColor: COLOR }]}>
                      <Icon icon={mci('play')} size={20} color="#0B0B0B" />
                      <Txt variant="subtitle" color="#0B0B0B">
                        Relever le défi
                      </Txt>
                    </Tap>
                  )}
                </>
              )}
            </Animated.View>
          )}
        </View>
      </View>

      {played.length > 0 && (
        <Section title="Vos défis" eyebrow={`${played.length} joué${played.length > 1 ? 's' : ''}`}>
          <View style={styles.list}>
            {played.map((c) => {
              const expanded = open === c.seed;
              return (
                <Animated.View key={c.seed} layout={LinearTransition.duration(220)} style={styles.item}>
                  <Tap
                    onPress={() => setOpen(expanded ? null : c.seed)}
                    scaleTo={0.99}
                    haptic="select"
                    style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Summary record={c} />
                    <Icon icon={mci(expanded ? 'chevron-up' : 'chevron-down')} size={20} color={colors.textMuted} />
                  </Tap>
                  {expanded && <ChallengeCard record={c} compact />}
                </Animated.View>
              );
            })}
          </View>
        </Section>
      )}
    </StackScreen>
  );
}

/** Une ligne de l’historique : issue du défi, scores et date. */
function Summary({ record }: { record: ChallengeRecord & { mine: NonNullable<ChallengeRecord['mine']> } }) {
  const { colors } = useTheme();
  const { mine, rivals } = record;
  const date = new Date(record.at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
  let icon = 'timer-sand';
  let color: string = colors.textMuted;
  let title = 'En attente de réponse';
  if (rivals.length === 1) {
    const outcome = challengeOutcome(mine, rivals[0]);
    icon = { win: 'trophy', lose: 'emoticon-wink-outline', draw: 'handshake-outline' }[outcome];
    color = { win: '#FACC15', lose: '#38BDF8', draw: '#34D399' }[outcome];
    title = `${{ win: 'Gagné', lose: 'Perdu', draw: 'Égalité' }[outcome]} · ${scoreLabel(mine)} contre ${scoreLabel(rivals[0])}`;
  } else if (rivals.length > 1) {
    const rank = challengeRank(mine, rivals);
    icon = rank === 1 ? 'trophy' : 'podium';
    color = rank === 1 ? '#FACC15' : COLOR;
    title = `${rank === 1 ? '1er' : `${rank}e`} sur ${rivals.length + 1} · ${scoreLabel(mine)}`;
  }
  return (
    <>
      <View style={[styles.summaryIcon, { backgroundColor: alpha(color, 0.16) }]}>
        <Icon icon={mci(icon)} size={20} color={color} />
      </View>
      <View style={styles.flex}>
        <Txt variant="smallStrong">{title}</Txt>
        <Txt variant="caption" tone="muted">
          {date}
          {rivals.length === 0 ? ` · votre score : ${scoreLabel(mine)}` : ''}
        </Txt>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: Gutter, gap: 16 },
  card: { padding: 16, gap: 12, borderRadius: Radius.xl, borderWidth: 1 },
  steps: { gap: 10 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  primary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, paddingHorizontal: 12, borderRadius: Radius.lg },
  inputRow: { flexDirection: 'row', gap: 10 },
  input: { flex: 1, minWidth: 0, height: 52, paddingHorizontal: 16, borderRadius: Radius.lg, borderWidth: 1, fontFamily: Fonts.mono, fontSize: 20, letterSpacing: 2, outlineWidth: 0 },
  paste: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, borderRadius: Radius.lg, borderWidth: StyleSheet.hairlineWidth },
  found: { gap: 10 },
  target: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: Radius.lg, borderWidth: 1 },
  list: { gap: 10 },
  item: { gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: Radius.lg, borderWidth: StyleSheet.hairlineWidth },
  summaryIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1 },
});
