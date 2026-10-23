import { useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import Animated, { Easing, FadeInDown } from 'react-native-reanimated';

import { alpha, Gutter, Radius } from '@/constants/theme';
import { APK_URL, useAppUpdate } from '@/hooks/use-app-update';
import { useTheme } from '@/hooks/use-theme';

import { Icon, mci } from '../ui/icon';
import { Tap } from '../ui/tap';
import { Txt } from '../ui/text';

/** Bandeau proposant d’installer la dernière version de l’APK, quand il en existe une. */
export function UpdateBanner() {
  const { colors } = useTheme();
  const remote = useAppUpdate();
  const [hidden, setHidden] = useState(false);
  if (!remote || hidden) return null;

  return (
    <Animated.View entering={FadeInDown.duration(300).easing(Easing.out(Easing.cubic))} style={styles.wrap}>
      <Tap
        onPress={() => Linking.openURL(APK_URL)}
        style={[styles.card, { backgroundColor: alpha(colors.accent, 0.12), borderColor: alpha(colors.accent, 0.45) }]}
        accessibilityLabel="Télécharger la nouvelle version"
        haptic="select">
        <View style={[styles.icon, { backgroundColor: alpha(colors.accent, 0.2) }]}>
          <Icon icon={mci('download')} size={22} color={colors.accent} />
        </View>
        <View style={styles.text}>
          <Txt variant="subtitle">Nouvelle version disponible</Txt>
          {remote.notes && (
            <Txt variant="small" tone="secondary" numberOfLines={2}>
              {remote.notes}
            </Txt>
          )}
          <Txt variant="caption" tone="accent">
            Touchez pour la télécharger, puis ouvrez le fichier. Votre progression est conservée.
          </Txt>
        </View>
      </Tap>
      <Tap onPress={() => setHidden(true)} style={styles.close} hitSlop={10} accessibilityLabel="Masquer" haptic={false}>
        <Icon icon={mci('close')} size={18} color={colors.textMuted} />
      </Tap>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: Gutter, marginBottom: 20 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, paddingRight: 38, borderRadius: Radius.xl, borderWidth: 1 },
  icon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, gap: 3 },
  close: { position: 'absolute', top: 10, right: Gutter + 10 },
});
