import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

import { qrShape } from '@/lib/qr';

/** Marge claire autour du code, exigée par les lecteurs (en modules). */
const QUIET = 4;

export interface QrCodeProps {
  value: string;
  /** Largeur maximale ; arrondie pour que chaque module tombe sur un pixel entier. */
  size?: number;
  /** Logo au centre (le code passe alors en correction d’erreurs maximale). */
  logo?: boolean;
}

/** QR code sombre sur fond blanc, toujours lisible quel que soit le thème. */
export function QrCode({ value, size = 232, logo = true }: QrCodeProps) {
  const shape = qrShape(value, logo ? 'H' : 'M');
  const modules = shape.size + QUIET * 2;
  const cell = Math.max(1, Math.floor(size / modules));
  const side = cell * modules;
  // Le logo couvre moins de 6 % de la surface, bien en deçà des 30 % que tolère le niveau H.
  const badge = Math.round((shape.size * 0.24) / 2) * 2 * cell;
  return (
    <View style={{ width: side, height: side }} accessible accessibilityRole="image" accessibilityLabel={`QR code vers ${value}`}>
      <Svg width={side} height={side} viewBox={`${-QUIET} ${-QUIET} ${modules} ${modules}`}>
        <Rect x={-QUIET} y={-QUIET} width={modules} height={modules} fill="#FFFFFF" />
        <Path d={shape.path} fill="#07090B" />
      </Svg>
      {logo && (
        <View style={[styles.badge, { width: badge, height: badge, borderRadius: badge * 0.26, marginLeft: -badge / 2, marginTop: -badge / 2 }]}>
          <Image source={require('@/assets/images/icon.png')} style={[styles.logo, { borderRadius: badge * 0.2 }]} contentFit="cover" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { position: 'absolute', left: '50%', top: '50%', padding: 3, backgroundColor: '#FFFFFF' },
  logo: { flex: 1 },
});
