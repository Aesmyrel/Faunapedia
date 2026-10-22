import { useState } from 'react';
import { type LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { alpha, Radius } from '@/constants/theme';
import { GROUPS } from '@/data/reference';
import type { Species } from '@/data/types';
import { useTheme } from '@/hooks/use-theme';
import { formatLength } from '@/lib/format';
import { animalBox } from '@/lib/scale';

import { Txt } from '../ui/text';
import { AnimalFigure } from './animal-figure';

interface Reference {
  label: string;
  width: number;
  height: number;
  kind: 'human' | 'card' | 'coin';
}

/** Boîte de la silhouette humaine : mêmes proportions que son tracé (60 × 175), sans quoi elle serait rapetissée. */
export const HUMAN_BOX = { width: 60, height: 175 };

const HUMAN: Reference = { label: 'Humain', ...HUMAN_BOX, kind: 'human' };
const CARD: Reference = { label: 'Carte bancaire', width: 8.56, height: 5.4, kind: 'card' };
const COIN: Reference = { label: 'Pièce de 1 €', width: 2.325, height: 2.325, kind: 'coin' };

function referenceFor(maxDim: number): Reference {
  if (maxDim >= 30) return HUMAN;
  if (maxDim >= 3) return CARD;
  return COIN;
}

/** Comparaison d’échelle entre l’espèce et un repère familier. */
export function ScaleView({ species, height = 200 }: { species: Species; height?: number }) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);
  const box = animalBox(species);
  if (!box) return null;
  const ref = referenceFor(Math.max(box.width, box.height));
  const gap = Math.max(box.width, ref.width) * 0.18;
  const sceneW = ref.width + gap + box.width;
  const sceneH = Math.max(ref.height, box.height);
  const usableW = Math.max(0, width - 24);
  const scale = width ? Math.min(usableW / sceneW, (height - 40) / sceneH) : 0;
  const color = GROUPS[species.group].color;

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  return (
    <View onLayout={onLayout} style={[styles.wrap, { backgroundColor: colors.surface, borderColor: colors.border, height: height + 46 }]}>
      {/* Le sol tombe au pied de la scène, décalée par la marge intérieure du cadre. */}
      <View style={[styles.ground, { top: height - 2, backgroundColor: colors.borderStrong }]} />
      {scale > 0 && (
        <View style={[styles.scene, { height: height - 14 }]}>
          <View style={styles.item}>
            <ReferenceShape kind={ref.kind} w={ref.width * scale} h={ref.height * scale} color={colors.textSecondary} />
          </View>
          <View style={{ width: gap * scale }} />
          <View style={styles.item}>
            <AnimalFigure species={species} box={box} scale={scale} color={color} />
          </View>
        </View>
      )}
      <View style={styles.legend}>
        <Txt variant="caption" tone="secondary">
          {ref.label} · {ref.kind === 'human' ? '1,75 m' : formatLength(ref.width)}
        </Txt>
        <Txt variant="caption" color={color} align="right" style={styles.flex}>
          {species.name} · {box.basis}
          {box.stretched ? ', étiré' : box.rotated ? ', vu de dessus' : ''}
        </Txt>
      </View>
      {species.silhouette && !species.silhouette.exact && !box.stretched && (
        <Txt variant="caption" tone="muted" style={styles.note}>
          Silhouette d’une espèce proche (PhyloPic)
        </Txt>
      )}
    </View>
  );
}

const HUMAN_PATH =
  'M26 21 h8 v7 h-8 Z M14 30 Q30 24 46 30 L44 92 L16 92 Z M14 31 L7 90 L13 91 L19 40 Z ' +
  'M46 31 L53 90 L47 91 L41 40 Z M17 90 L29 90 L28 173 L19 173 Z M31 90 L43 90 L41 173 L32 173 Z';

/** Silhouette humaine stylisée (1,75 m pour 175 unités de haut). */
export function HumanFigure({ w, h, color }: { w: number; h: number; color: string }) {
  return (
    <Svg width={w} height={h} viewBox="0 0 60 175">
      <Circle cx={30} cy={12} r={10.5} fill={color} />
      <Path d={HUMAN_PATH} fill={color} />
    </Svg>
  );
}

function ReferenceShape({ kind, w, h, color }: { kind: Reference['kind']; w: number; h: number; color: string }) {
  if (kind === 'human') return <HumanFigure w={w} h={h} color={color} />;
  if (kind === 'card') {
    return (
      <Svg width={w} height={h} viewBox="0 0 85.6 54">
        <Rect x={0.5} y={0.5} width={84.6} height={53} rx={4} fill={alpha(color, 0.25)} stroke={color} />
        <Rect x={9} y={18} width={13} height={10} rx={2} fill={color} />
        <Rect x={9} y={38} width={45} height={4} rx={2} fill={color} />
      </Svg>
    );
  }
  return (
    <Svg width={w} height={h} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={11.5} fill={alpha(color, 0.3)} stroke={color} />
      <Circle cx={12} cy={12} r={7.5} fill="none" stroke={color} strokeWidth={0.8} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: Radius.xl, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden', paddingHorizontal: 12, paddingTop: 12 },
  ground: { position: 'absolute', left: 12, right: 12, height: StyleSheet.hairlineWidth },
  scene: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center' },
  item: { justifyContent: 'flex-end', alignItems: 'center' },
  legend: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, gap: 10 },
  flex: { flex: 1 },
  note: { marginTop: 2 },
});
