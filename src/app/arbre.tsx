import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { GestureDetector, usePanGesture, usePinchGesture, useSimultaneousGestures, useTapGesture } from 'react-native-gesture-handler';
import Animated, { FadeInDown, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle, G, Path, Text as SvgText } from 'react-native-svg';

import { SpeciesImage } from '@/components/species/species-image';
import { Chip } from '@/components/ui/chip';
import { Icon, mci } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { StackScreen } from '@/components/ui/stack-screen';
import { Tap } from '@/components/ui/tap';
import { Txt } from '@/components/ui/text';
import { Fonts, Gutter, MaxContentWidth, Radius } from '@/constants/theme';
import { SPECIES } from '@/data';
import { GROUP_ORDER, GROUPS } from '@/data/reference';
import type { GroupId } from '@/data/types';
import { useTheme } from '@/hooks/use-theme';
import { capitalize } from '@/lib/format';
import { buildTree, layoutTree, leafAt, lineage, lineagePath, type PhyloNode, polar } from '@/lib/phylo';
import { useStore } from '@/store';

const LAYOUT = layoutTree(buildTree(SPECIES));
const MIN_ZOOM = 1;
const MAX_ZOOM = 7;
/** Au-delà, les noms des espèces deviennent lisibles. */
const LABEL_ZOOM = 2.4;

/** Noms courts des classes affichées sur le pourtour (les noms savants débordent). */
const CLASS_LABELS: Record<string, string> = {
  Mammalia: 'Mammifères',
  Aves: 'Oiseaux',
  Reptilia: 'Reptiles',
  Amphibia: 'Amphibiens',
  Actinopterygii: 'Poissons osseux',
  Chondrichthyes: 'Requins, raies',
  Insecta: 'Insectes',
  Arachnida: 'Arachnides',
  Malacostraca: 'Crustacés',
  Cephalopoda: 'Céphalopodes',
  Gastropoda: 'Gastéropodes',
  Anthozoa: 'Coraux, anémones',
};

const label = (n: PhyloNode) => (n.rank === 'class' && CLASS_LABELS[n.name]) || capitalize(n.fr ?? n.name);
const deg = (a: number) => (a * 180) / Math.PI;

/** L’arbre des 275 espèces, de l’embranchement à l’espèce, zoomable. */
export default function TreeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const seen = useStore((s) => s.seen);
  const [selected, setSelected] = useState<PhyloNode | null>(null);
  const [focus, setFocus] = useState<GroupId | null>(null);
  const [zoomed, setZoomed] = useState(false);
  const side = Math.min(width, MaxContentWidth);
  const unit = LAYOUT.size / side;

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const savedTx = useSharedValue(0);
  const savedTy = useSharedValue(0);

  const pinch = usePinchGesture({
    onUpdate: (e) => {
      'worklet';
      scale.set(Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, savedScale.get() * e.scale)));
    },
    onDeactivate: () => {
      'worklet';
      savedScale.set(scale.get());
      runOnJS(setZoomed)(scale.get() >= LABEL_ZOOM);
    },
  });
  const pan = usePanGesture({
    onUpdate: (e) => {
      'worklet';
      const limit = (side * (scale.get() - 1)) / 2 + side * 0.25;
      tx.set(Math.max(-limit, Math.min(limit, savedTx.get() + e.translationX)));
      ty.set(Math.max(-limit, Math.min(limit, savedTy.get() + e.translationY)));
    },
    onDeactivate: () => {
      'worklet';
      savedTx.set(tx.get());
      savedTy.set(ty.get());
    },
  });
  const tap = useTapGesture({
    runOnJS: true,
    onActivate: (e) => {
      // Point touché ramené dans le repère du dessin (zoom et déplacement compris).
      const c = side / 2;
      const s = scale.get();
      const x = ((e.x - c - tx.get()) / s + c) * unit;
      const y = ((e.y - c - ty.get()) / s + c) * unit;
      const leaf = leafAt(LAYOUT, x, y, (22 * unit) / s);
      setSelected(leaf ?? null);
    },
  });
  const gesture = useSimultaneousGestures(pinch, pan, tap);

  const canvasStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.get() }, { translateY: ty.get() }, { scale: scale.get() }],
  }));

  const zoomTo = (target: number) => {
    const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, target));
    scale.set(withTiming(next, { duration: 250 }));
    savedScale.set(next);
    if (next === MIN_ZOOM) {
      tx.set(withTiming(0, { duration: 250 }));
      ty.set(withTiming(0, { duration: 250 }));
      savedTx.set(0);
      savedTy.set(0);
    }
    setZoomed(next >= LABEL_ZOOM);
  };

  const seenCount = SPECIES.filter((s) => seen[s.id]).length;
  const groupsPresent = GROUP_ORDER.filter((g) => LAYOUT.leaves.some((l) => l.group === g));
  const dim = (g: GroupId | undefined) => (focus && g !== focus ? 0.12 : 1);
  const c = LAYOUT.center;
  const path = selected ? lineagePath(selected, c) : null;
  const sp = selected?.species;

  return (
    <StackScreen static>
      <View style={styles.header}>
        <Txt variant="label" tone="accent">
          {seenCount} / {SPECIES.length} espèces découvertes
        </Txt>
        <Txt variant="display">L’arbre des espèces</Txt>
        <Txt variant="small" tone="secondary">
          Du centre vers l’extérieur : embranchement, classe, ordre, famille, genre, espèce. Les espèces découvertes brillent.
        </Txt>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.legendRow} contentContainerStyle={styles.legend}>
        {groupsPresent.map((g) => (
          <Chip
            key={g}
            label={GROUPS[g].label}
            icon={GROUPS[g].icon}
            color={GROUPS[g].color}
            size="sm"
            selected={focus === g}
            onPress={() => setFocus(focus === g ? null : g)}
          />
        ))}
      </ScrollView>

      <View style={[styles.stage, { width: side, height: side }]}>
        <GestureDetector gesture={gesture}>
          <View style={StyleSheet.absoluteFill}>
            <Animated.View style={[{ width: side, height: side }, canvasStyle]}>
              <Svg width={side} height={side} viewBox={`0 0 ${LAYOUT.size} ${LAYOUT.size}`}>
                {(Object.keys(LAYOUT.branches) as (GroupId | 'mixed')[]).map((key) => (
                  <Path
                    key={key}
                    d={LAYOUT.branches[key]}
                    stroke={key === 'mixed' ? colors.textMuted : GROUPS[key].color}
                    strokeWidth={key === 'mixed' ? 1.4 : 1.2}
                    strokeOpacity={key === 'mixed' ? (focus ? 0.25 : 0.7) : 0.85 * dim(key)}
                    vectorEffect="non-scaling-stroke"
                    fill="none"
                  />
                ))}
                {path && <Path d={path} stroke={colors.accent} strokeWidth={3} vectorEffect="non-scaling-stroke" fill="none" />}
                {LAYOUT.leaves.map((leaf) => {
                  const [x, y] = polar(c, leaf.radius, leaf.angle);
                  const discovered = Boolean(seen[leaf.id]);
                  return (
                    <Circle
                      key={leaf.id}
                      cx={x}
                      cy={y}
                      r={discovered ? 4.4 : 3.2}
                      fill={GROUPS[leaf.group ?? 'others'].color}
                      opacity={(discovered ? 1 : 0.4) * dim(leaf.group)}
                    />
                  );
                })}
                {selected && (() => {
                  const [x, y] = polar(c, selected.radius, selected.angle);
                  return <Circle cx={x} cy={y} r={9} stroke={colors.accent} strokeWidth={2.5} fill="none" vectorEffect="non-scaling-stroke" />;
                })()}
                {!zoomed &&
                  LAYOUT.labels.map((n) => {
                    const r = LAYOUT.outer + 18;
                    const [x, y] = polar(c, r, n.angle);
                    const flip = Math.cos(n.angle) < 0;
                    return (
                      <SvgText
                        key={n.id}
                        x={x}
                        y={y}
                        fontSize={15}
                        fontFamily={Fonts.semibold}
                        fill={n.group ? GROUPS[n.group].color : colors.textSecondary}
                        opacity={dim(n.group)}
                        textAnchor={flip ? 'end' : 'start'}
                        alignmentBaseline="middle"
                        rotation={deg(n.angle) + (flip ? 180 : 0)}
                        origin={`${x}, ${y}`}>
                        {label(n)}
                      </SvgText>
                    );
                  })}
                {zoomed && (
                  <G>
                    {LAYOUT.leaves.map((leaf) => {
                      const [x, y] = polar(c, leaf.radius + 8, leaf.angle);
                      const flip = Math.cos(leaf.angle) < 0;
                      return (
                        <SvgText
                          key={leaf.id}
                          x={x}
                          y={y}
                          fontSize={5.2}
                          fontFamily={Fonts.medium}
                          fill={seen[leaf.id] ? colors.text : colors.textMuted}
                          opacity={dim(leaf.group)}
                          textAnchor={flip ? 'end' : 'start'}
                          alignmentBaseline="middle"
                          rotation={deg(leaf.angle) + (flip ? 180 : 0)}
                          origin={`${x}, ${y}`}>
                          {leaf.name}
                        </SvgText>
                      );
                    })}
                  </G>
                )}
                <Circle cx={c} cy={c} r={7} fill={colors.accent} />
              </Svg>
            </Animated.View>
          </View>
        </GestureDetector>
        <View style={styles.zoom} pointerEvents="box-none">
          <IconButton icon={mci('plus')} onPress={() => zoomTo(savedScale.get() * 1.8)} label="Zoomer" />
          <IconButton icon={mci('minus')} onPress={() => zoomTo(savedScale.get() / 1.8)} label="Dézoomer" />
          <IconButton icon={mci('fit-to-screen-outline')} onPress={() => zoomTo(1)} label="Recentrer" />
        </View>
      </View>

      <View style={styles.footer}>
        {sp ? (
          <Animated.View key={sp.id} entering={FadeInDown.duration(220)} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <SpeciesImage species={sp} size="small" style={styles.thumb} />
            <View style={styles.flex}>
              <Txt variant="subtitle" numberOfLines={1}>
                {sp.name}
              </Txt>
              <Txt variant="sci" tone="secondary" numberOfLines={1}>
                {sp.sci}
              </Txt>
              <Txt variant="caption" tone="muted" numberOfLines={2}>
                {lineage(selected)
                  .slice(1)
                  .map(label)
                  .join(' › ')}
              </Txt>
            </View>
            <Tap onPress={() => router.push(`/species/${sp.id}`)} style={[styles.open, { backgroundColor: colors.accent }]} accessibilityLabel={`Voir la fiche : ${sp.name}`}>
              <Icon icon={mci('arrow-right')} size={20} color={colors.onAccent} />
            </Tap>
          </Animated.View>
        ) : (
          <View style={[styles.card, styles.hint, { borderColor: colors.border }]}>
            <Icon icon={mci('gesture-tap')} size={22} color={colors.textMuted} />
            <Txt variant="small" tone="secondary" style={styles.flex}>
              Pincez pour zoomer, faites glisser pour vous déplacer, touchez une espèce pour suivre sa lignée.
            </Txt>
          </View>
        )}
      </View>
    </StackScreen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: Gutter, gap: 4 },
  legendRow: { flexGrow: 0 },
  legend: { paddingHorizontal: Gutter, gap: 8, paddingVertical: 12 },
  stage: { alignSelf: 'center', overflow: 'hidden' },
  zoom: { position: 'absolute', right: 12, bottom: 12, gap: 8 },
  footer: { paddingHorizontal: Gutter, paddingTop: 8 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: Radius.xl, borderWidth: StyleSheet.hairlineWidth },
  hint: { borderStyle: 'dashed', borderWidth: 1 },
  thumb: { width: 56, height: 56, borderRadius: 14 },
  flex: { flex: 1, gap: 2 },
  open: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});

