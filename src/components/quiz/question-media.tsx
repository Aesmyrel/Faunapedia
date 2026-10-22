import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { alpha, Radius } from '@/constants/theme';
import { getSpecies } from '@/data';
import { GROUPS } from '@/data/reference';
import { useRemote } from '@/hooks/use-remote';
import { useTheme } from '@/hooks/use-theme';
import { getSounds } from '@/lib/api';
import type { Question } from '@/lib/quiz';

import { SpeciesImage } from '../species/species-image';
import { ClipPlayer } from '../species/sound-player';
import { Icon, mci } from '../ui/icon';
import { Loading } from '../ui/states';
import { Tap } from '../ui/tap';
import { Txt } from '../ui/text';

/** Photo, silhouette ou son associé à une question. */
export function QuestionMedia({ question, answered, onUnavailable }: { question: Question; answered: boolean; onUnavailable: () => void }) {
  const media = question.media;
  if (!media) return null;
  const species = getSpecies(media.speciesId);
  if (!species) return null;
  if (media.type === 'photo') {
    return (
      <View style={styles.photo}>
        <SpeciesImage species={species} index={media.photoIndex ?? 0} size="large" style={StyleSheet.absoluteFill} priority="high" />
      </View>
    );
  }
  if (media.type === 'silhouette' && species.silhouette) {
    const color = GROUPS[species.group].color;
    return (
      <View style={[styles.photo, styles.center]}>
        <LinearGradient colors={[alpha(color, 0.25), alpha(color, 0.05)]} style={StyleSheet.absoluteFill} />
        {answered ? (
          <SpeciesImage species={species} size="large" style={StyleSheet.absoluteFill} />
        ) : (
          <Image
            source={{ uri: species.silhouette.url }}
            style={{ width: '78%', height: '72%' }}
            contentFit="contain"
            tintColor={color}
            accessibilityLabel="Silhouette mystère"
          />
        )}
      </View>
    );
  }
  if (media.type === 'sound' && species.inatId) {
    return <SoundMedia taxonId={species.inatId} color={GROUPS[species.group].color} onUnavailable={onUnavailable} reveal={answered ? species.id : undefined} />;
  }
  return null;
}

function SoundMedia({ taxonId, color, onUnavailable, reveal }: { taxonId: number; color: string; onUnavailable: () => void; reveal?: string }) {
  const { colors } = useTheme();
  const sounds = useRemote(`quiz-sound-${taxonId}`, () => getSounds(taxonId, 3));
  const clip = sounds.data?.[0];
  const unavailable = !sounds.loading && (Boolean(sounds.error) || !clip);

  useEffect(() => {
    if (unavailable) onUnavailable();
  }, [unavailable, onUnavailable]);

  const species = reveal ? getSpecies(reveal) : undefined;
  return (
    <View style={[styles.sound, { backgroundColor: colors.surface, borderColor: alpha(color, 0.3) }]}>
      {species ? (
        <View style={styles.soundReveal}>
          <SpeciesImage species={species} style={StyleSheet.absoluteFill} />
        </View>
      ) : (
        <View style={[styles.wave, { backgroundColor: alpha(color, 0.15) }]}>
          <Icon icon={mci('waveform')} size={44} color={color} />
        </View>
      )}
      {sounds.loading ? <Loading label="Chargement de l’enregistrement…" /> : clip ? <ClipPlayer clip={clip} color={color} autoPlay compact hidePlace={!reveal} /> : null}
    </View>
  );
}

/** Indices progressifs de « Qui suis-je ? », avec photo qui se précise. */
export function CluesPanel({
  question,
  revealed,
  answered,
  onReveal,
}: {
  question: Question;
  revealed: number;
  answered: boolean;
  onReveal: () => void;
}) {
  const { colors } = useTheme();
  const clues = question.clues ?? [];
  const species = getSpecies(question.media?.speciesId);
  const blur = answered ? 0 : Math.max(0, 60 - revealed * 9);
  const canReveal = !answered && revealed < clues.length;
  return (
    <View style={styles.clues}>
      {species && (
        <View style={styles.cluePhoto}>
          <SpeciesImage species={species} index={question.media?.photoIndex ?? 0} size="medium" blurRadius={blur} style={StyleSheet.absoluteFill} />
          {!answered && (
            <View style={styles.blurBadge}>
              <Icon icon={mci('eye-off-outline')} size={14} color="#fff" />
              <Txt variant="caption" color="#fff">
                La photo se précise à chaque indice
              </Txt>
            </View>
          )}
        </View>
      )}
      {clues.slice(0, answered ? clues.length : revealed).map((c, i) => (
        <Animated.View key={c} entering={FadeInDown.duration(300)} style={[styles.clue, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Txt variant="smallStrong" tone="accent" style={styles.clueNum}>
            {i + 1}
          </Txt>
          <Txt variant="small" style={styles.flex}>
            {c}
          </Txt>
        </Animated.View>
      ))}
      {canReveal && (
        <Tap onPress={onReveal} style={[styles.reveal, { borderColor: alpha(colors.accent, 0.5) }]} haptic="select">
          <Icon icon={mci('lightbulb-on-outline')} size={18} color={colors.accent} />
          <Txt variant="smallStrong" tone="accent">
            Indice suivant ({revealed}/{clues.length}) · −12 % de points
          </Txt>
        </Tap>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  photo: { width: '100%', aspectRatio: 4 / 3, borderRadius: Radius.xl, overflow: 'hidden', backgroundColor: '#111' },
  center: { alignItems: 'center', justifyContent: 'center' },
  sound: { borderRadius: Radius.xl, borderWidth: 1, padding: 14, gap: 14 },
  wave: { height: 120, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center' },
  soundReveal: { height: 160, borderRadius: Radius.lg, overflow: 'hidden' },
  clues: { gap: 8 },
  cluePhoto: { width: '100%', aspectRatio: 16 / 9, borderRadius: Radius.xl, overflow: 'hidden', backgroundColor: '#111', marginBottom: 4 },
  blurBadge: {
    position: 'absolute',
    left: 10,
    bottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  clue: { flexDirection: 'row', gap: 10, padding: 12, borderRadius: Radius.md, borderWidth: StyleSheet.hairlineWidth },
  clueNum: { width: 16 },
  reveal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
});
