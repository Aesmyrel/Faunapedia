import { useRef, useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import Animated, { Easing, FadeInDown } from 'react-native-reanimated';

import { APK_URL } from '@/constants/release';
import { alpha, Gutter, Radius } from '@/constants/theme';
import { useAppUpdate } from '@/hooks/use-app-update';
import { installUpdate, type InstallStep } from '@/hooks/install-update';
import { useTheme } from '@/hooks/use-theme';

import { Icon, mci } from '../ui/icon';
import { ProgressBar } from '../ui/progress-ring';
import { Tap } from '../ui/tap';
import { Txt } from '../ui/text';

type Status = 'idle' | InstallStep | 'error';

/**
 * Bandeau de mise à jour : télécharge la nouvelle version dans l’application,
 * puis ouvre la fenêtre d’installation d’Android.
 */
export function UpdateBanner() {
  const { colors } = useTheme();
  const remote = useAppUpdate();
  const [hidden, setHidden] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const lastPercent = useRef(-1);
  if (!remote || hidden) return null;

  const busy = typeof status === 'object';
  const start = async () => {
    if (busy) return;
    lastPercent.current = -1;
    setStatus({ phase: 'download', progress: 0 });
    try {
      await installUpdate(remote.build, (step) => {
        // Un rendu par pour cent suffit.
        if (step.phase === 'download') {
          const percent = Math.floor(step.progress * 100);
          if (percent === lastPercent.current) return;
          lastPercent.current = percent;
        }
        setStatus(step);
      });
      setStatus('idle');
    } catch {
      setStatus('error');
      Linking.openURL(APK_URL).catch(() => {});
    }
  };

  const title = busy ? (status.phase === 'download' ? 'Téléchargement de la mise à jour…' : 'Installation…') : 'Nouvelle version disponible';
  const caption = busy
    ? status.phase === 'download'
      ? `${Math.floor(status.progress * 100)} % · restez dans l’application`
      : 'Confirmez l’installation dans la fenêtre d’Android.'
    : status === 'error'
      ? 'Le téléchargement intégré a échoué : le navigateur prend le relais.'
      : 'Touchez pour l’installer. Votre progression est conservée.';

  return (
    <Animated.View entering={FadeInDown.duration(300).easing(Easing.out(Easing.cubic))} style={styles.wrap}>
      <Tap
        onPress={start}
        disabled={busy}
        style={[styles.card, { backgroundColor: alpha(colors.accent, 0.12), borderColor: alpha(colors.accent, 0.45) }]}
        accessibilityLabel={busy ? title : 'Installer la nouvelle version'}
        haptic="select">
        <View style={[styles.icon, { backgroundColor: alpha(colors.accent, 0.2) }]}>
          <Icon icon={mci(busy ? 'progress-download' : 'download')} size={22} color={colors.accent} />
        </View>
        <View style={styles.text}>
          <Txt variant="subtitle">{title}</Txt>
          {!busy && remote.notes && (
            <Txt variant="small" tone="secondary" numberOfLines={2}>
              {remote.notes}
            </Txt>
          )}
          {busy && status.phase === 'download' && <ProgressBar progress={status.progress} color={colors.accent} height={5} />}
          <Txt variant="caption" tone="accent">
            {caption}
          </Txt>
        </View>
      </Tap>
      {!busy && (
        <Tap onPress={() => setHidden(true)} style={styles.close} hitSlop={10} accessibilityLabel="Masquer" haptic={false}>
          <Icon icon={mci('close')} size={18} color={colors.textMuted} />
        </Tap>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: Gutter, marginBottom: 20 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, paddingRight: 38, borderRadius: Radius.xl, borderWidth: 1 },
  icon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, gap: 4 },
  close: { position: 'absolute', top: 10, right: Gutter + 10 },
});
