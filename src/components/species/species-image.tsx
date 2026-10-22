import { Image, type ImageStyle } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { alpha } from '@/constants/theme';
import { photoUrl, type PhotoSize } from '@/data';
import { GROUPS } from '@/data/reference';
import type { Species } from '@/data/types';

import { Icon } from '../ui/icon';

export interface SpeciesImageProps {
  species: Species;
  size?: PhotoSize;
  index?: number;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
  blurRadius?: number;
  priority?: 'low' | 'normal' | 'high';
}

/**
 * Photo d’une espèce, avec repli élégant (silhouette PhyloPic ou icône du
 * groupe sur un dégradé) quand aucune photo libre n’existe.
 */
export function SpeciesImage({ species, size = 'medium', index = 0, style, imageStyle, blurRadius, priority }: SpeciesImageProps) {
  const uri = photoUrl(species.photos[index] ?? species.photos[0], size);
  const color = GROUPS[species.group].color;
  if (uri) {
    return (
      <View style={[styles.fill, style]}>
        <Image
          source={{ uri }}
          style={[StyleSheet.absoluteFill, imageStyle]}
          contentFit="cover"
          transition={250}
          recyclingKey={`${species.id}-${index}`}
          blurRadius={blurRadius}
          priority={priority}
          cachePolicy="memory-disk"
          accessibilityLabel={species.name}
        />
      </View>
    );
  }
  return (
    <View style={[styles.fill, style]}>
      <LinearGradient colors={[alpha(color, 0.45), alpha(color, 0.12)]} style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, styles.center]}>
        {species.silhouette ? (
          <Image
            source={{ uri: species.silhouette.url }}
            style={{ width: '70%', aspectRatio: species.silhouette.ratio, maxHeight: '70%' }}
            contentFit="contain"
            tintColor={alpha('#FFFFFF', 0.85)}
          />
        ) : (
          <Icon icon={GROUPS[species.group].icon} size={48} color={alpha('#FFFFFF', 0.8)} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { overflow: 'hidden', backgroundColor: '#111' },
  center: { alignItems: 'center', justifyContent: 'center' },
});
