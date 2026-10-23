import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { alpha } from '@/constants/theme';
import { cuteFor } from '@/lib/phobia';

import { Icon, mci } from '../ui/icon';
import { Txt } from '../ui/text';

/**
 * Image douce affichée à la place d’une photo d’araignée (mode arachnophobie) :
 * un petit animal sur un dégradé pastel, toujours le même pour un même sujet.
 */
export function CutePlaceholder({ seed, label, style }: { seed: string; label?: boolean; style?: StyleProp<ViewStyle> }) {
  const { icon, color } = cuteFor(seed);
  return (
    <View style={[styles.fill, style]} accessible accessibilityRole="image" accessibilityLabel="Photo d’araignée masquée">
      <LinearGradient colors={[alpha(color, 0.95), alpha(color, 0.55)]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, styles.center]}>
        <View style={styles.bubble}>
          <Icon icon={mci(icon)} size={label ? 56 : 30} color="#FFFFFF" />
        </View>
        {label && (
          <Txt variant="caption" color="rgba(255,255,255,0.95)" align="center" style={styles.label}>
            Photo d’araignée masquée
          </Txt>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { overflow: 'hidden' },
  center: { alignItems: 'center', justifyContent: 'center', gap: 8 },
  bubble: { padding: '8%', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.18)' },
  label: { paddingHorizontal: 12, textShadowColor: 'rgba(0,0,0,0.15)', textShadowRadius: 4 },
});
