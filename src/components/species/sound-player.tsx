import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { alpha, Radius } from '@/constants/theme';
import { useRemote } from '@/hooks/use-remote';
import { useTheme } from '@/hooks/use-theme';
import { getSounds, type SoundClip } from '@/lib/api';
import { formatCredit } from '@/lib/format';

import { Icon, mci } from '../ui/icon';
import { ProgressBar } from '../ui/progress-ring';
import { Loading } from '../ui/states';
import { Tap } from '../ui/tap';
import { Txt } from '../ui/text';

let audioModeSet = false;
function ensureAudioMode() {
  if (audioModeSet) return;
  audioModeSet = true;
  setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
}

/** Lecteur d’un enregistrement de terrain. */
export function ClipPlayer({
  clip,
  color,
  autoPlay,
  compact,
  hidePlace,
}: {
  clip: SoundClip;
  color: string;
  autoPlay?: boolean;
  compact?: boolean;
  /** Masque le lieu d’enregistrement (indice trop révélateur en quiz). */
  hidePlace?: boolean;
}) {
  const { colors } = useTheme();
  const player = useAudioPlayer(clip.url);
  const status = useAudioPlayerStatus(player);

  useEffect(() => {
    ensureAudioMode();
    if (autoPlay && status.isLoaded) player.play();
  }, [autoPlay, status.isLoaded, player]);

  const toggle = () => {
    ensureAudioMode();
    if (status.playing) player.pause();
    else {
      if (status.duration && status.currentTime >= status.duration - 0.1) player.seekTo(0);
      player.play();
    }
  };
  const progress = status.duration ? status.currentTime / status.duration : 0;

  return (
    <View style={[styles.clip, compact && styles.compact, { backgroundColor: colors.surface, borderColor: alpha(color, 0.3) }]}>
      <Tap onPress={toggle} style={[styles.play, { backgroundColor: color }]} scaleTo={0.9} accessibilityLabel={status.playing ? 'Pause' : 'Écouter'}>
        <Icon icon={mci(status.playing ? 'pause' : 'play')} size={26} color="#0B0B0B" />
      </Tap>
      <View style={styles.info}>
        <ProgressBar progress={progress} color={color} height={4} />
        <Txt variant="caption" tone="muted" numberOfLines={1}>
          {clip.place && !hidePlace ? `${clip.place} · ` : ''}
          {formatCredit(clip.attribution, clip.license)}
        </Txt>
      </View>
    </View>
  );
}

/** Section « Écouter » : enregistrements iNaturalist chargés à la demande. */
export function SoundSection({ taxonId, color, eager }: { taxonId: number; color: string; eager: boolean }) {
  const { colors } = useTheme();
  const [requested, setRequested] = useState(eager);
  const sounds = useRemote(requested ? `sounds-${taxonId}` : null, () => getSounds(taxonId, 4));

  if (!requested) {
    return (
      <Tap onPress={() => setRequested(true)} style={[styles.request, { borderColor: colors.border, backgroundColor: colors.surface }]}>
        <Icon icon={mci('waveform')} size={20} color={color} />
        <Txt variant="smallStrong" style={styles.flex}>
          Chercher des enregistrements sonores
        </Txt>
        <Icon icon={mci('chevron-right')} size={18} color={colors.textMuted} />
      </Tap>
    );
  }
  if (sounds.loading) return <Loading label="Recherche d’enregistrements…" />;
  if (sounds.error || !sounds.data?.length) {
    return (
      <Txt variant="small" tone="muted">
        Aucun enregistrement sous licence libre n’est disponible pour cette espèce.
      </Txt>
    );
  }
  return (
    <View style={styles.list}>
      {sounds.data.map((c) => (
        <ClipPlayer key={c.url} clip={c} color={color} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  clip: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: Radius.lg, borderWidth: 1 },
  compact: { padding: 8 },
  play: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, gap: 8 },
  list: { gap: 10 },
  request: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  flex: { flex: 1 },
});
