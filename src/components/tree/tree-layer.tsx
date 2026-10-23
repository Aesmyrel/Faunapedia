import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { runOnJS, type SharedValue, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Path, Rect, Text as SvgText } from 'react-native-svg';

import { Fonts } from '@/constants/theme';
import { GROUPS } from '@/data/reference';
import type { GroupId } from '@/data/types';
import { useTheme } from '@/hooks/use-theme';
import { cladeLabel, lineagePath, type PhyloNode, polar } from '@/lib/phylo';
import { type TreeFrame, type TreeView, viewBoxFor } from '@/lib/tree-view';

import { LEAF_STEP, ORDER_ZOOM, ORDERS, SPECIES_ZOOM, TREE } from './tree-data';

export interface TreeLayerProps {
  id: number;
  /** Vue pour laquelle ce calque est dessiné, net. */
  view: TreeView;
  frame: TreeFrame;
  /** Marge dessinée autour de la scène (fraction de sa taille), pour les déplacements. */
  over: number;
  /** Vue courante, animée. */
  s: SharedValue<number>;
  tx: SharedValue<number>;
  ty: SharedValue<number>;
  seen: Record<string, number>;
  lit: Partial<Record<GroupId, string>>;
  focus: GroupId | null;
  selected: PhyloNode | null;
  /** Apparaît en fondu, puis prévient qu’il recouvre les calques précédents. */
  onReady?: (id: number) => void;
}

const deg = (a: number) => (a * 180) / Math.PI;

/**
 * Un calque de l’arbre, dessiné net pour une vue donnée. Pendant un geste, il
 * suit la vue courante par une simple transformation (donc un peu flou), puis
 * un nouveau calque net le remplace. Sur Android, le SVG est rendu en image :
 * l’agrandir directement le rendrait flou.
 */
export function TreeLayer({ id, view, frame, over, s, tx, ty, seen, lit, focus, selected, onReady }: TreeLayerProps) {
  const { colors } = useTheme();
  const appear = useSharedValue(onReady ? 0 : 1);
  const { s: s0, tx: tx0, ty: ty0 } = view;
  const offY = frame.cy - frame.height / 2;
  const offX = frame.cx - frame.width / 2;

  useEffect(() => {
    if (!onReady) return;
    appear.set(
      withDelay(
        60,
        withTiming(1, { duration: 180 }, (finished) => {
          'worklet';
          if (finished) runOnJS(onReady)(id);
        }),
      ),
    );
  }, [appear, id, onReady]);

  const style = useAnimatedStyle(() => {
    const r = s.get() / s0;
    return {
      opacity: appear.get(),
      transform: [{ translateX: tx.get() - r * tx0 + (1 - r) * offX }, { translateY: ty.get() - r * ty0 + (1 - r) * offY }, { scale: r }],
    };
  });

  const [vx, vy, vw, vh] = viewBoxFor(view, frame, over);
  /** Unités du dessin pour un point d’écran, à ce zoom. */
  const px = 1 / (s0 * frame.k);
  const margin = 190 * px;
  const visible = (x: number, y: number) => x > vx - margin && x < vx + vw + margin && y > vy - margin && y < vy + vh + margin;
  const c = TREE.center;
  const rim = TREE.outer;
  const dim = (g: GroupId | undefined) => (focus && g !== focus ? 0.14 : 1);
  const showOrders = s0 >= ORDER_ZOOM && s0 < SPECIES_ZOOM;
  const showSpecies = s0 >= SPECIES_ZOOM;
  const dotR = Math.min(1.5 + 0.4 * s0, 4) * px;
  const seenR = Math.min(2.6 + 0.5 * s0, 6) * px;
  const branchW = Math.min(1 + 0.15 * s0, 1.8);

  const radialText = (key: string, angle: number, r: number, text: string, size: number, fill: string, font: string, opacity: number) => {
    const [x, y] = polar(c, r, angle);
    if (!visible(x, y)) return null;
    const flip = Math.cos(angle) < 0;
    return (
      <SvgText
        key={key}
        x={x}
        y={y}
        fontSize={size * px}
        fontFamily={font}
        fill={fill}
        opacity={opacity}
        textAnchor={flip ? 'end' : 'start'}
        alignmentBaseline="middle"
        rotation={deg(angle) + (flip ? 180 : 0)}
        origin={`${x}, ${y}`}>
        {text}
      </SvgText>
    );
  };

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.layer, { left: -over * frame.width, top: -over * frame.height, width: frame.width * (1 + 2 * over), height: frame.height * (1 + 2 * over) }, style]}>
      <Svg width="100%" height="100%" viewBox={`${vx} ${vy} ${vw} ${vh}`}>
        {onReady && <Rect x={vx} y={vy} width={vw} height={vh} fill={colors.background} />}
        {(Object.keys(TREE.branches) as (GroupId | 'mixed')[]).map((key) => (
          <Path
            key={key}
            d={TREE.branches[key]}
            stroke={key === 'mixed' ? colors.textMuted : GROUPS[key].color}
            strokeWidth={branchW}
            strokeOpacity={key === 'mixed' ? (focus ? 0.3 : 0.6) : 0.5 * dim(key)}
            vectorEffect="non-scaling-stroke"
            fill="none"
          />
        ))}
        {(Object.keys(lit) as GroupId[]).map((g) => (
          <Path key={`lit-${g}`} d={lit[g]} stroke={GROUPS[g].color} strokeWidth={branchW + 0.9} strokeOpacity={dim(g)} vectorEffect="non-scaling-stroke" fill="none" />
        ))}
        {selected && <Path d={lineagePath(selected, c)} stroke={colors.accent} strokeWidth={branchW + 1.8} vectorEffect="non-scaling-stroke" fill="none" />}
        {TREE.leaves.map((leaf) => {
          const [x, y] = polar(c, leaf.radius, leaf.angle);
          if (!visible(x, y)) return null;
          const color = GROUPS[leaf.group ?? 'others'].color;
          const opacity = dim(leaf.group);
          return seen[leaf.id] ? (
            <GlowDot key={leaf.id} x={x} y={y} r={seenR} color={color} opacity={opacity} />
          ) : (
            <Circle key={leaf.id} cx={x} cy={y} r={dotR} fill={color} opacity={0.55 * opacity} />
          );
        })}
        {selected &&
          (() => {
            const [x, y] = polar(c, selected.radius, selected.angle);
            return <Circle cx={x} cy={y} r={9 * px} stroke={colors.accent} strokeWidth={2.5} fill="none" vectorEffect="non-scaling-stroke" />;
          })()}
        {showOrders &&
          ORDERS.map((n) => {
            // Un ordre n’est nommé que s’il a la place de l’être.
            if (n.leafCount * LEAF_STEP * rim < 13 * px) return null;
            return radialText(n.id, n.angle, rim + 9 * px, cladeLabel(n), 10.5, n.group ? GROUPS[n.group].color : colors.textSecondary, Fonts.semibold, dim(n.group));
          })}
        {showSpecies &&
          TREE.leaves.map((leaf) => {
            const known = Boolean(seen[leaf.id]);
            return radialText(
              leaf.id,
              leaf.angle,
              rim + (known ? seenR : dotR) + 6 * px,
              leaf.name,
              11,
              known ? colors.text : colors.textSecondary,
              known ? Fonts.semibold : Fonts.medium,
              dim(leaf.group),
            );
          })}
        <Circle cx={c} cy={c} r={5 * px} fill={colors.accent} />
      </Svg>
    </Animated.View>
  );
}

/** Espèce découverte : un point vif et son halo. */
function GlowDot({ x, y, r, color, opacity }: { x: number; y: number; r: number; color: string; opacity: number }) {
  return (
    <>
      <Circle cx={x} cy={y} r={r * 2.3} fill={color} opacity={0.22 * opacity} />
      <Circle cx={x} cy={y} r={r} fill={color} opacity={opacity} />
    </>
  );
}

const styles = StyleSheet.create({
  layer: { position: 'absolute' },
});
