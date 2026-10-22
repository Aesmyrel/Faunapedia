import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { alpha, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { Icon, mci } from '../ui/icon';
import { Tap } from '../ui/tap';
import { Txt } from '../ui/text';

/** Invitation à faire découvrir l’application, menant à l’écran de partage. */
export function ShareAppCard() {
  const router = useRouter();
  const { colors } = useTheme();
  return (
    <Tap
      onPress={() => router.push('/share')}
      style={[styles.card, { backgroundColor: colors.surface, borderColor: alpha(colors.accent, 0.35) }]}
      accessibilityRole="button"
      accessibilityLabel="Partager l’application">
      <LinearGradient colors={[alpha(colors.accent, 0.16), alpha(colors.accent, 0)]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
      <View style={[styles.icon, { backgroundColor: alpha(colors.accent, 0.18) }]}>
        <Icon icon={mci('qrcode')} size={26} color={colors.accent} />
      </View>
      <View style={styles.flex}>
        <Txt variant="heading">Faites découvrir Faunapedia</Txt>
        <Txt variant="small" tone="secondary">
          Un QR code à montrer ou un lien à envoyer à un proche curieux de nature.
        </Txt>
      </View>
      <Icon icon={mci('chevron-right')} size={20} color={colors.textMuted} />
    </Tap>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: Radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  icon: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1, gap: 3 },
});
