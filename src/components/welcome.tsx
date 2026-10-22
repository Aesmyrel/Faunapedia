import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { alpha, Gutter, MaxContentWidth, Radius } from '@/constants/theme';
import { SPECIES } from '@/data';
import { useTheme } from '@/hooks/use-theme';
import { useStore } from '@/store';

import { Icon, mci } from './ui/icon';
import { Tap } from './ui/tap';
import { Txt } from './ui/text';

const FEATURES = [
  {
    icon: 'book-open-page-variant',
    color: '#38BDF8',
    title: `${SPECIES.length} fiches de passionné`,
    text: 'Mensurations, records, anecdotes, cartes, sons… et l’arbre du vivant complet en direct.',
  },
  {
    icon: 'trophy',
    color: '#E8B04B',
    title: 'Des quiz pour tous les niveaux',
    text: 'Défi du jour, « Qui suis-je ? », silhouettes, chants d’oiseaux, noms latins…',
  },
  {
    icon: 'medal',
    color: '#C084FC',
    title: 'Votre carnet de naturaliste',
    text: 'Gagnez des niveaux, débloquez une quarantaine de badges et complétez votre encyclopédie.',
  },
];

/** Écran de bienvenue affiché au premier lancement. */
export function Welcome() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const updateSettings = useStore((s) => s.updateSettings);
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]}>
      <LinearGradient colors={[alpha('#E8B04B', 0.18), alpha('#E8B04B', 0)]} style={styles.glow} />
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 24 }]}>
        <Animated.View entering={FadeInDown.duration(600)} style={styles.hero}>
          <Image source={require('@/assets/images/splash-icon.png')} style={styles.logo} contentFit="contain" />
          <Txt variant="hero" align="center">
            Faunapedia
          </Txt>
          <Txt variant="body" tone="secondary" align="center">
            L’encyclopédie zoologique de poche, pour les curieux comme pour les passionnés.
          </Txt>
        </Animated.View>
        <View style={styles.features}>
          {FEATURES.map((f, i) => (
            <Animated.View
              key={f.title}
              entering={FadeInDown.delay(250 + i * 120).duration(500)}
              style={[styles.feature, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.featureIcon, { backgroundColor: alpha(f.color, 0.16) }]}>
                <Icon icon={mci(f.icon)} size={24} color={f.color} />
              </View>
              <View style={styles.flex}>
                <Txt variant="subtitle">{f.title}</Txt>
                <Txt variant="small" tone="secondary">
                  {f.text}
                </Txt>
              </View>
            </Animated.View>
          ))}
        </View>
        <Animated.View entering={FadeInUp.delay(700).duration(500)} style={styles.footer}>
          <Tap onPress={() => updateSettings({ onboarded: true })} style={[styles.cta, { backgroundColor: colors.accent }]} haptic="select">
            <Txt variant="subtitle" color={colors.onAccent}>
              Commencer l’exploration
            </Txt>
            <Icon icon={mci('arrow-right')} size={20} color={colors.onAccent} />
          </Tap>
          <Txt variant="caption" tone="muted" align="center">
            Sans compte ni publicité. Votre progression reste sur votre téléphone.
          </Txt>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  glow: { position: 'absolute', top: 0, left: 0, right: 0, height: 420 },
  content: { flexGrow: 1, paddingHorizontal: Gutter, gap: 28, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' },
  hero: { alignItems: 'center', gap: 12 },
  logo: { width: 132, height: 132, marginBottom: 6 },
  features: { gap: 12 },
  feature: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: Radius.xl, borderWidth: StyleSheet.hairlineWidth },
  featureIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1, gap: 2 },
  footer: { marginTop: 'auto', gap: 12 },
  cta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 17, borderRadius: Radius.lg },
});
