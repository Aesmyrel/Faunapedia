import { useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';

import { QrCode } from '@/components/share/qr-code';
import { APP_SHARE_MESSAGE, APP_URL, APP_URL_LABEL, shareApp, type ShareOutcome } from '@/components/share/share';
import { HeroHeader } from '@/components/ui/hero-header';
import { Icon, mci } from '@/components/ui/icon';
import { Section } from '@/components/ui/section';
import { StackScreen } from '@/components/ui/stack-screen';
import { Tap } from '@/components/ui/tap';
import { Txt } from '@/components/ui/text';
import { Gutter, MaxContentWidth, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const FEEDBACK: Partial<Record<ShareOutcome, string>> = {
  copied: 'Message copié dans le presse-papiers.',
  failed: 'Le partage n’est pas disponible sur cet appareil.',
};

export default function ShareScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const [outcome, setOutcome] = useState<ShareOutcome | null>(null);
  const qrSize = Math.min(Math.min(width, MaxContentWidth) - Gutter * 2 - 48, 264);

  const share = async () => {
    setOutcome(await shareApp());
  };

  return (
    <StackScreen>
      <HeroHeader
        icon={mci('qrcode')}
        color={colors.accent}
        eyebrow="Faire découvrir"
        title="Partager Faunapedia"
        description="Un collègue, un ami, un enfant curieux de nature ? Montrez-lui ce code ou envoyez-lui le lien."
      />

      {APP_URL && (
        <Animated.View entering={ZoomIn.springify().mass(1).stiffness(200).damping(18)} style={styles.center}>
          <View style={[styles.qrCard, { borderColor: colors.border }]}>
            <QrCode value={APP_URL} size={qrSize} />
            <View style={styles.qrText}>
              <Txt variant="smallStrong" color="#17150F" align="center">
                À scanner avec l’appareil photo
              </Txt>
              <Txt variant="caption" color="#6B675D" align="center" numberOfLines={1}>
                {APP_URL_LABEL}
              </Txt>
            </View>
          </View>
        </Animated.View>
      )}

      <Animated.View entering={FadeInDown.delay(150)} style={styles.actions}>
        <Tap onPress={share} style={[styles.cta, { backgroundColor: colors.accent }]} haptic="select">
          <Icon icon={mci('share-variant')} size={20} color={colors.onAccent} />
          <Txt variant="subtitle" color={colors.onAccent}>
            Envoyer le lien
          </Txt>
        </Tap>
        {outcome && FEEDBACK[outcome] && (
          <Txt variant="caption" tone="secondary" align="center">
            {FEEDBACK[outcome]}
          </Txt>
        )}
      </Animated.View>

      <Section title="Aperçu du message">
        <View style={[styles.bubble, { backgroundColor: colors.accentSoft }]}>
          <Txt variant="small">{APP_SHARE_MESSAGE}</Txt>
          {APP_URL && (
            <Txt variant="small" tone="accent" numberOfLines={1}>
              {APP_URL}
            </Txt>
          )}
        </View>
      </Section>
    </StackScreen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', paddingHorizontal: Gutter },
  qrCard: {
    alignItems: 'center',
    gap: 4,
    padding: 8,
    paddingBottom: 22,
    borderRadius: Radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: '#FFFFFF',
  },
  qrText: { gap: 2, maxWidth: 264 },
  actions: { paddingHorizontal: Gutter, gap: 10, marginTop: 24, marginBottom: 8 },
  cta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 17, borderRadius: Radius.lg },
  bubble: { gap: 6, padding: 16, borderRadius: Radius.xl, borderBottomRightRadius: 6 },
});
