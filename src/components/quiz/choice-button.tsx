import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, FadeIn, LinearTransition, useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';

import { alpha, Radius } from '@/constants/theme';
import { getSpecies } from '@/data';
import type { Choice } from '@/lib/quiz';
import { useTheme } from '@/hooks/use-theme';

import { SpeciesImage } from '../species/species-image';
import { Icon, mci } from '../ui/icon';
import { Tap } from '../ui/tap';
import { Txt } from '../ui/text';

export type ChoiceState = 'idle' | 'correct' | 'wrong' | 'dimmed';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

function useFeedbackAnimation(state: ChoiceState) {
  const shake = useSharedValue(0);
  const pop = useSharedValue(1);
  useEffect(() => {
    if (state === 'wrong') {
      shake.set(
        withSequence(withTiming(-8, { duration: 50 }), withTiming(8, { duration: 70 }), withTiming(-5, { duration: 60 }), withTiming(0, { duration: 50 })),
      );
    }
    if (state === 'correct') {
      pop.set(
        withSequence(
          withTiming(1.035, { duration: 120, easing: Easing.out(Easing.quad) }),
          withTiming(1, { duration: 200, easing: Easing.inOut(Easing.quad) }),
        ),
      );
    }
  }, [state, shake, pop]);
  return useAnimatedStyle(() => ({ transform: [{ translateX: shake.get() }, { scale: pop.get() }] }));
}

function stateColors(state: ChoiceState, colors: ReturnType<typeof useTheme>['colors']) {
  if (state === 'correct') return { bg: alpha(colors.success, 0.18), border: colors.success };
  if (state === 'wrong') return { bg: alpha(colors.danger, 0.18), border: colors.danger };
  return { bg: colors.surface, border: colors.border };
}

/** Réponse en liste (lettre + libellé). */
export function ChoiceRow({
  choice,
  index,
  state,
  revealSub,
  disabled,
  onPress,
}: {
  choice: Choice;
  index: number;
  state: ChoiceState;
  revealSub: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const anim = useFeedbackAnimation(state);
  const c = stateColors(state, colors);
  return (
    <Animated.View layout={LinearTransition.duration(220)}>
      <Animated.View style={[anim, state === 'dimmed' && styles.dimmed]}>
        <Tap
          onPress={onPress}
          disabled={disabled}
          haptic={false}
          style={[styles.row, { backgroundColor: c.bg, borderColor: c.border }]}
          accessibilityLabel={choice.label}
          accessibilityState={{ disabled, selected: state === 'correct' || state === 'wrong' }}>
          <View style={[styles.letter, { backgroundColor: choice.color ? alpha(choice.color, 0.25) : colors.surfaceRaised }]}>
            {state === 'correct' ? (
              <Icon icon={mci('check-bold')} size={16} color={colors.success} />
            ) : state === 'wrong' ? (
              <Icon icon={mci('close-thick')} size={16} color={colors.danger} />
            ) : (
              <Txt variant="smallStrong" color={choice.color ?? colors.textSecondary}>
                {LETTERS[index]}
              </Txt>
            )}
          </View>
          <View style={styles.flex}>
            <Txt variant={choice.italic ? 'sci' : 'subtitle'} style={choice.italic && styles.italicLabel}>
              {choice.label}
            </Txt>
            {revealSub && choice.sublabel && (
              <Animated.View entering={FadeIn.duration(220)}>
                <Txt variant="caption" tone="muted">
                  {choice.sublabel}
                </Txt>
              </Animated.View>
            )}
          </View>
        </Tap>
      </Animated.View>
    </Animated.View>
  );
}

/** Réponse sous forme de photo (grille 2×2 ou duel). */
export function ChoicePhoto({
  choice,
  state,
  disabled,
  showName,
  tall,
  onPress,
}: {
  choice: Choice;
  state: ChoiceState;
  disabled: boolean;
  showName: boolean;
  tall?: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const anim = useFeedbackAnimation(state);
  const c = stateColors(state, colors);
  const species = getSpecies(choice.speciesId);
  return (
    <Animated.View style={[styles.photoWrap, anim, state === 'dimmed' && styles.dimmed]}>
      <Tap
        onPress={onPress}
        disabled={disabled}
        haptic={false}
        style={[styles.photo, { borderColor: c.border, aspectRatio: tall ? 0.78 : 1 }]}
        accessibilityLabel={showName ? choice.label : 'Photo'}>
        {species && <SpeciesImage species={species} style={StyleSheet.absoluteFill} size="medium" />}
        {(showName || state !== 'idle') && (
          <View style={styles.photoCaption}>
            <Txt variant="smallStrong" color="#fff" numberOfLines={2}>
              {choice.label}
            </Txt>
          </View>
        )}
        {(state === 'correct' || state === 'wrong') && (
          <View style={[styles.photoBadge, { backgroundColor: state === 'correct' ? colors.success : colors.danger }]}>
            <Icon icon={mci(state === 'correct' ? 'check-bold' : 'close-thick')} size={18} color="#fff" />
          </View>
        )}
      </Tap>
    </Animated.View>
  );
}

/** Grand bouton Vrai / Faux. */
export function ChoiceBinary({ choice, state, disabled, onPress }: { choice: Choice; state: ChoiceState; disabled: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  const anim = useFeedbackAnimation(state);
  const c = stateColors(state, colors);
  const positive = choice.id === 'vrai';
  const tint = positive ? colors.success : colors.danger;
  return (
    <Animated.View style={[styles.flex, anim, state === 'dimmed' && styles.dimmed]}>
      <Tap
        onPress={onPress}
        disabled={disabled}
        haptic={false}
        accessibilityLabel={choice.label}
        style={[styles.binary, { backgroundColor: state === 'idle' ? alpha(tint, 0.1) : c.bg, borderColor: state === 'idle' ? alpha(tint, 0.45) : c.border }]}>
        <Icon icon={mci(positive ? 'check-circle-outline' : 'close-circle-outline')} size={30} color={tint} />
        <Txt variant="heading">{choice.label}</Txt>
      </Tap>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  dimmed: { opacity: 0.45 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 14, paddingVertical: 14, borderRadius: Radius.lg, borderWidth: 1.5 },
  letter: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  italicLabel: { fontSize: 17, lineHeight: 22 },
  photoWrap: { flex: 1 },
  photo: { borderRadius: Radius.lg, overflow: 'hidden', borderWidth: 2.5, backgroundColor: '#111' },
  photoCaption: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 10, backgroundColor: 'rgba(0,0,0,0.55)' },
  photoBadge: { position: 'absolute', top: 8, right: 8, width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  binary: { alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 26, borderRadius: Radius.xl, borderWidth: 1.5 },
});
