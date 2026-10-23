import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { alpha, Radius } from '@/constants/theme';
import { GROUPS } from '@/data/reference';
import type { Species } from '@/data/types';
import { useHideSpiders } from '@/hooks/use-hide-spiders';
import { isArachnid } from '@/lib/phobia';
import { type AnimalBox, stretchedBodyPath } from '@/lib/scale';

import { Icon } from '../ui/icon';
import { CutePlaceholder } from './cute-placeholder';

/** Silhouette d’une espèce à l’échelle, dans une emprise de `box.width × box.height` multipliée par `scale`. */
export function AnimalFigure({ species, box, scale, color }: { species: Species; box: AnimalBox; scale: number; color: string }) {
  const w = box.width * scale;
  const h = box.height * scale;
  const hidden = useHideSpiders() && isArachnid(species);

  if (hidden) {
    const side = Math.max(24, Math.min(w, h));
    return <CutePlaceholder seed={species.id} style={{ width: side, height: side, borderRadius: side / 2 }} />;
  }

  if (box.stretched) {
    return (
      <Svg width={w} height={h} viewBox={`0 0 ${box.width} ${box.height}`} accessibilityLabel={`${species.name}, étiré`}>
        <Path d={stretchedBodyPath(box.width, box.height)} fill={color} />
      </Svg>
    );
  }

  if (!species.silhouette) {
    return (
      <View style={[styles.placeholder, { width: w, height: h, backgroundColor: alpha(color, 0.3) }]}>
        <Icon icon={GROUPS[species.group].icon} size={Math.min(24, Math.min(w, h) * 0.6)} color={color} />
      </View>
    );
  }

  // Une silhouette couchée garde ses proportions d’origine, puis pivote d’un quart de tour.
  const [imgW, imgH] = box.rotated ? [h, w] : [w, h];
  return (
    <View style={[styles.center, { width: w, height: h }]}>
      <Image
        source={{ uri: species.silhouette.url }}
        style={[{ width: imgW, height: imgH }, box.rotated && styles.rotated]}
        contentFit="contain"
        tintColor={color}
        accessibilityLabel={`Silhouette : ${species.name}`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  rotated: { transform: [{ rotate: '90deg' }] },
  placeholder: { borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
});
