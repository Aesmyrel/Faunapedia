import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Modal, Platform, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { interpolate, type SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { photoUrl } from '@/data';
import type { Species } from '@/data/types';
import { useTheme } from '@/hooks/use-theme';

import { IconButton } from '../ui/icon-button';
import { mci } from '../ui/icon';
import { Tap } from '../ui/tap';
import { Txt } from '../ui/text';
import { SpeciesImage } from './species-image';

export interface PhotoHeroProps {
  species: Species;
  height: number;
  scrollY: SharedValue<number>;
}

/** Galerie plein cadre en tête de fiche, avec parallaxe et visionneuse. */
export function PhotoHero({ species, height, scrollY }: PhotoHeroProps) {
  const { width } = useWindowDimensions();
  const { colors } = useTheme();
  const [index, setIndex] = useState(0);
  const [viewer, setViewer] = useState(false);
  const photos = species.photos;
  const count = Math.max(1, photos.length);

  const parallax = useAnimatedStyle(() => {
    const y = scrollY.get();
    return {
      transform: [
        { translateY: interpolate(y, [-height, 0, height], [-height / 2, 0, height * 0.45]) },
        { scale: interpolate(y, [-height, 0], [2, 1], 'clamp') },
      ],
    };
  });

  return (
    <View style={{ height, overflow: 'hidden' }}>
      <Animated.View style={[StyleSheet.absoluteFill, parallax]}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}>
          {Array.from({ length: count }, (_, i) => (
            <Tap key={i} onPress={() => photos.length && setViewer(true)} scaleTo={1} haptic={false} accessibilityLabel="Agrandir la photo">
              <SpeciesImage species={species} index={i} size="large" style={{ width, height }} priority={i === 0 ? 'high' : 'low'} />
            </Tap>
          ))}
        </ScrollView>
      </Animated.View>
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(0,0,0,0.45)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0)', colors.background]}
        locations={[0, 0.22, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />
      {photos.length > 1 && (
        <View style={styles.dots} pointerEvents="none">
          {photos.map((p, i) => (
            <View key={p.url} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
      )}
      <PhotoViewer species={species} visible={viewer} initial={index} onClose={() => setViewer(false)} />
    </View>
  );
}

function PhotoViewer({ species, visible, initial, onClose }: { species: Species; visible: boolean; initial: number; onClose: () => void }) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(initial);
  const photo = species.photos[index];
  return (
    <Modal visible={visible} animationType="fade" transparent={false} onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.viewer}>
        <ScrollView
          horizontal
          pagingEnabled
          contentOffset={{ x: initial * width, y: 0 }}
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}>
          {species.photos.map((p, i) => (
            <ScrollView
              key={p.url}
              style={{ width, height }}
              contentContainerStyle={styles.zoom}
              maximumZoomScale={Platform.OS === 'ios' ? 4 : 1}
              minimumZoomScale={1}
              centerContent
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}>
              <Image
                source={{ uri: photoUrl(p, 'large') }}
                placeholder={{ uri: photoUrl(p, 'medium') }}
                style={{ width, height: height * 0.8 }}
                contentFit="contain"
                transition={200}
                accessibilityLabel={`${species.name}, photo ${i + 1}`}
              />
            </ScrollView>
          ))}
        </ScrollView>
        <View style={[styles.viewerTop, { top: insets.top + 8 }]}>
          <Txt variant="smallStrong" color="#fff">
            {index + 1} / {species.photos.length}
          </Txt>
          <IconButton icon={mci('close')} onPress={onClose} label="Fermer" overMedia />
        </View>
        {photo && (
          <View style={[styles.viewerCaption, { paddingBottom: insets.bottom + 16 }]}>
            <Txt variant="caption" color="rgba(255,255,255,0.8)" numberOfLines={2}>
              {photo.attribution}
            </Txt>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  dots: { position: 'absolute', bottom: 120, alignSelf: 'center', flexDirection: 'row', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.45)' },
  dotActive: { width: 18, backgroundColor: '#fff' },
  viewer: { flex: 1, backgroundColor: '#000' },
  zoom: { flexGrow: 1, alignItems: 'center', justifyContent: 'center' },
  viewerTop: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewerCaption: { position: 'absolute', left: 20, right: 20, bottom: 0 },
});
