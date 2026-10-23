import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { GestureDetector, usePanGesture, usePinchGesture, useSimultaneousGestures, useTapGesture } from 'react-native-gesture-handler';
import Animated, { Easing, FadeIn, FadeInDown, runOnJS, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SpeciesImage } from '@/components/species/species-image';
import { SectorBadge } from '@/components/tree/sector-badge';
import { BADGE_ZOOM, MAX_ZOOM, MIN_ZOOM, ORDER_ZOOM, SECTORS, SPECIES_ZOOM, TREE } from '@/components/tree/tree-data';
import { TreeLayer } from '@/components/tree/tree-layer';
import { Chip } from '@/components/ui/chip';
import { Icon, mci } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { StackScreen } from '@/components/ui/stack-screen';
import { Tap } from '@/components/ui/tap';
import { Txt } from '@/components/ui/text';
import { Gutter, Radius } from '@/constants/theme';
import { SPECIES } from '@/data';
import { GROUP_ORDER, GROUPS } from '@/data/reference';
import type { GroupId } from '@/data/types';
import { useTheme } from '@/hooks/use-theme';
import { capitalize, plural } from '@/lib/format';
import { lineage, litPaths, nearestLeaf, type PhyloNode, polar } from '@/lib/phylo';
import { centerOn, clampView, fitView, HOME_VIEW, panLimit, type TreeFrame, type TreeView, toDrawing } from '@/lib/tree-view';
import { useStore } from '@/store';

/** Place des pastilles de groupe autour de l’arbre, et de la carte du bas. */
const RIM_MARGIN = 46;
const FOOTER = 100;
/** En dessous de ce zoom, toucher l’arbre zoome sur le groupe touché. */
const SECTOR_TAP_ZOOM = 2;
/** Marge dessinée autour de l’écran, pour que les déplacements restent nets. */
const OVERSCAN = 0.25;
const MOVE = { duration: 520, easing: Easing.inOut(Easing.cubic) };

const label = (n: PhyloNode) => capitalize(n.fr ?? n.name);
const angleGap = (a: number, b: number) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));

interface Layer {
  id: number;
  view: TreeView;
  ready: boolean;
}

/** L’arbre des 275 espèces, de l’embranchement à l’espèce : on touche un groupe pour y entrer, puis une espèce. */
export default function TreeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ espece?: string }>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const seen = useStore((st) => st.seen);
  const [selected, setSelected] = useState<PhyloNode | null>(() => TREE.leaves.find((l) => l.id === params.espece) ?? null);
  const [focus, setFocus] = useState<GroupId | null>(() => selected?.group ?? null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const [layers, setLayers] = useState<Layer[]>([]);
  const [zoom, setZoom] = useState(1);
  const nextId = useRef(1);
  const opened = useRef(false);

  const s = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const startS = useSharedValue(1);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const focalX = useSharedValue(0);
  const focalY = useSharedValue(0);
  const pinching = useSharedValue(false);
  const rebase = useSharedValue(false);
  const geo = useSharedValue({ cx: 0, cy: 0, rim: 1 });

  const footer = FOOTER + insets.bottom;
  const width = size?.width ?? 0;
  const height = size?.height ?? 0;
  const rim = Math.max(60, Math.min(width, height - footer) / 2 - RIM_MARGIN);
  const cx = width / 2;
  const cy = (height - footer) / 2;
  const frame: TreeFrame = { width, height, cx, cy, k: rim / TREE.outer, center: TREE.center };

  useEffect(() => {
    geo.set({ cx, cy, rim });
  }, [geo, cx, cy, rim]);

  /** Fige la vue : un calque net est dessiné pour elle, puis remplace les précédents. */
  const commit = (zs: number, x: number, y: number) => {
    const id = nextId.current++;
    const layer = { id, view: { s: zs, tx: x, ty: y }, ready: false };
    setZoom(zs);
    setLayers((ls) => {
      const base = ls.filter((l) => l.ready).pop();
      return base ? [base, layer] : [layer];
    });
  };
  const onReady = (id: number) =>
    setLayers((ls) => {
      const i = ls.findIndex((l) => l.id === id);
      return i < 0 ? ls : ls.slice(i).map((l) => (l.id === id ? { ...l, ready: true } : l));
    });

  const animateTo = (target: TreeView, delay = 0) => {
    const v = clampView(target, rim, MIN_ZOOM, MAX_ZOOM);
    s.set(withDelay(delay, withTiming(v.s, MOVE)));
    tx.set(withDelay(delay, withTiming(v.tx, MOVE)));
    ty.set(withDelay(delay, withTiming(v.ty, MOVE)));
    // Le calque net de l’arrivée est préparé dès le départ.
    commit(v.s, v.tx, v.ty);
  };
  const current = (): TreeView => ({ s: s.get(), tx: tx.get(), ty: ty.get() });

  /** Cadre un groupe entier : du niveau des classes jusqu’au pourtour, noms des ordres compris. */
  const showGroup = (g: GroupId) => {
    const sector = SECTORS.find((x) => x.group === g);
    if (!sector) return;
    const c = TREE.center;
    const ends = [sector.leaves[0].angle, sector.angle, sector.leaves[sector.leaves.length - 1].angle];
    const box = (outer: number) => {
      const points = [...sector.leaves.map((l) => polar(c, outer, l.angle)), ...ends.map((a) => polar(c, TREE.outer * 0.3, a))];
      const xs = points.map((p) => p[0]);
      const ys = points.map((p) => p[1]);
      return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)] as const;
    };
    const first = fitView(frame, box(TREE.outer + 22 / frame.k), footer, 5);
    // Une fois le zoom connu, on laisse la place des noms des ordres.
    const withNames = box(TREE.outer + 100 / (first.s * frame.k));
    const fitted = fitView(frame, withNames, footer, 5);
    setFocus(g);
    setSelected(null);
    animateTo(fitted.s >= ORDER_ZOOM ? fitted : centerOn(frame, (withNames[0] + withNames[2]) / 2, (withNames[1] + withNames[3]) / 2, ORDER_ZOOM, footer));
  };
  /** Zoome jusqu’aux noms des espèces, autour de l’une d’elles. */
  const zoomNear = (leaf: PhyloNode, from: TreeView, delay = 0) => {
    const zs = Math.min(MAX_ZOOM, Math.max(SPECIES_ZOOM + 0.6, from.s * 2));
    // Le pourtour vient au centre, avec la place des noms vers l’extérieur.
    const [x, y] = polar(TREE.center, TREE.outer + 55 / (zs * frame.k), leaf.angle);
    animateTo(centerOn(frame, x, y, zs, footer), delay);
  };
  const reset = () => {
    setFocus(null);
    animateTo(HOME_VIEW);
  };
  const zoomBy = (factor: number) => {
    const v = current();
    const zs = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, v.s * factor));
    if (zs <= MIN_ZOOM + 0.01) return reset();
    const r = zs / v.s;
    animateTo({ s: zs, tx: v.tx * r, ty: v.ty * r });
  };

  const onTap = (x: number, y: number) => {
    const v = current();
    const [ux, uy] = toDrawing(v, frame, x, y);
    const dx = ux - TREE.center;
    const dy = uy - TREE.center;
    const r = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx);
    const px = 1 / (v.s * frame.k);
    if (r < TREE.outer * 0.12 || r > TREE.outer + 150 * px) return setSelected(null);
    const leaf = nearestLeaf(TREE, angle);
    const group = leaf.group ?? 'others';
    if (v.s < SPECIES_ZOOM - 0.2) {
      if (v.s < SECTOR_TAP_ZOOM && focus !== group) showGroup(group);
      else zoomNear(leaf, v);
      return;
    }
    const near = r > TREE.outer - 30 * px && (angleGap(angle, leaf.angle) * r) / px < 18;
    setSelected(near ? leaf : null);
  };

  // Ouverture depuis une fiche : on rejoint l’espèce dans l’arbre.
  useEffect(() => {
    if (!size || opened.current || !selected) return;
    opened.current = true;
    zoomNear(selected, HOME_VIEW, 350);
  });

  const pinch = usePinchGesture({
    onActivate: (e) => {
      'worklet';
      const g = geo.get();
      pinching.set(true);
      startS.set(s.get());
      startX.set(tx.get());
      startY.set(ty.get());
      focalX.set(e.focalX - g.cx);
      focalY.set(e.focalY - g.cy);
    },
    onUpdate: (e) => {
      'worklet';
      const g = geo.get();
      const zs = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, startS.get() * e.scale));
      const r = zs / startS.get();
      const limit = panLimit(zs, g.rim);
      // Le point sous les doigts au départ reste sous les doigts.
      const x = e.focalX - g.cx - r * (focalX.get() - startX.get());
      const y = e.focalY - g.cy - r * (focalY.get() - startY.get());
      s.set(zs);
      tx.set(Math.max(-limit, Math.min(limit, x)));
      ty.set(Math.max(-limit, Math.min(limit, y)));
    },
    onDeactivate: () => {
      'worklet';
      pinching.set(false);
      rebase.set(true);
      runOnJS(commit)(s.get(), tx.get(), ty.get());
    },
  });
  const pan = usePanGesture({
    maxPointers: 1,
    onActivate: () => {
      'worklet';
      startX.set(tx.get());
      startY.set(ty.get());
      rebase.set(false);
    },
    onUpdate: (e) => {
      'worklet';
      if (pinching.get()) return;
      if (rebase.get()) {
        // Un doigt reste après un pincement : on repart de la vue actuelle.
        startX.set(tx.get() - e.translationX);
        startY.set(ty.get() - e.translationY);
        rebase.set(false);
      }
      const limit = panLimit(s.get(), geo.get().rim);
      tx.set(Math.max(-limit, Math.min(limit, startX.get() + e.translationX)));
      ty.set(Math.max(-limit, Math.min(limit, startY.get() + e.translationY)));
    },
    onDeactivate: () => {
      'worklet';
      runOnJS(commit)(s.get(), tx.get(), ty.get());
    },
  });
  const tap = useTapGesture({
    runOnJS: true,
    onActivate: (e) => onTap(e.x, e.y),
  });
  const gesture = useSimultaneousGestures(pinch, pan, tap);

  const lit = litPaths(TREE, (id) => Boolean(seen[id]));
  const seenCount = SPECIES.filter((sp) => seen[sp.id]).length;
  const groupsPresent = GROUP_ORDER.filter((g) => SECTORS.some((x) => x.group === g));
  const sp = selected?.species;
  const focusInfo = focus ? GROUPS[focus] : null;
  const focusLeaves = focus ? TREE.leaves.filter((l) => (l.group ?? 'others') === focus) : [];

  // Pastilles décalées vers l’extérieur quand deux petits groupes se touchent.
  let previous = -Infinity;
  let lastLevel = 1;
  const badges = SECTORS.map((sector) => {
    const level = angleGap(sector.angle, previous) * (rim + 24) < 34 && lastLevel === 0 ? 1 : 0;
    previous = sector.angle;
    lastLevel = level;
    return { sector, distance: 24 + level * 32 };
  });

  const layerProps = { frame, s, tx, ty, seen, lit, focus, selected };

  return (
    <StackScreen static>
      <View style={styles.header}>
        <Txt variant="label" tone="accent">
          {seenCount} / {SPECIES.length} espèces découvertes
        </Txt>
        <Txt variant="display">L’arbre des espèces</Txt>
        <Txt variant="small" tone="secondary">
          Toutes les espèces de Faunapedia, classées du centre (les animaux) vers l’extérieur (l’espèce). Chaque espèce découverte illumine sa branche.
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
            onPress={() => (focus === g ? reset() : showGroup(g))}
          />
        ))}
      </ScrollView>

      <View style={styles.stage} onLayout={(e) => setSize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}>
        {size && (
          <>
            <GestureDetector gesture={gesture}>
              <View style={StyleSheet.absoluteFill} collapsable={false}>
                <TreeLayer id={0} view={HOME_VIEW} over={0} {...layerProps} />
                {layers.map((l) => (
                  <TreeLayer key={l.id} id={l.id} view={l.view} over={OVERSCAN} onReady={onReady} {...layerProps} />
                ))}
              </View>
            </GestureDetector>

            {zoom < BADGE_ZOOM &&
              badges.map(({ sector, distance }) => (
                <SectorBadge
                  key={sector.group}
                  group={sector.group}
                  angle={sector.angle}
                  distance={distance}
                  cx={cx}
                  cy={cy}
                  rim={rim}
                  s={s}
                  tx={tx}
                  ty={ty}
                  dimmed={focus !== null && focus !== sector.group}
                  onPress={showGroup}
                />
              ))}

            {focusInfo && focus && (
              <Animated.View key={focus} entering={FadeIn.duration(200)} style={styles.focus}>
                <Tap onPress={reset} style={[styles.focusPill, { backgroundColor: colors.surface, borderColor: colors.border }]} accessibilityLabel="Revenir à l’arbre entier">
                  <Icon icon={focusInfo.icon} size={16} color={focusInfo.color} />
                  <View>
                    <Txt variant="smallStrong">{focusInfo.label}</Txt>
                    <Txt variant="caption" tone="muted">
                      {plural(focusLeaves.length, 'espèce')} · {plural(focusLeaves.filter((l) => seen[l.id]).length, 'découverte')}
                    </Txt>
                  </View>
                  <Icon icon={mci('close')} size={16} color={colors.textMuted} />
                </Tap>
              </Animated.View>
            )}

            <View style={[styles.zoom, { bottom: footer }]} pointerEvents="box-none">
              <IconButton icon={mci('minus')} onPress={() => zoomBy(1 / 1.8)} label="Dézoomer" />
              <IconButton icon={mci('plus')} onPress={() => zoomBy(1.8)} label="Zoomer" />
              <IconButton icon={mci('fit-to-screen-outline')} onPress={reset} label="Recentrer" />
            </View>

            <View style={[styles.footer, { bottom: insets.bottom + 10 }]} pointerEvents="box-none">
              {sp && selected ? (
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
                      {lineage(selected).slice(1).map(label).join(' › ')}
                    </Txt>
                  </View>
                  <Tap onPress={() => router.push(`/species/${sp.id}`)} style={[styles.open, { backgroundColor: colors.accent }]} accessibilityLabel={`Voir la fiche : ${sp.name}`}>
                    <Icon icon={mci('arrow-right')} size={20} color={colors.onAccent} />
                  </Tap>
                </Animated.View>
              ) : (
                <View style={[styles.card, styles.hint, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Icon icon={mci('gesture-tap')} size={22} color={colors.textMuted} />
                  <Txt variant="small" tone="secondary" style={styles.flex}>
                    {zoom >= SPECIES_ZOOM - 0.2
                      ? 'Touchez une espèce pour suivre sa lignée jusqu’au centre.'
                      : focus || zoom >= SECTOR_TAP_ZOOM
                        ? 'Touchez une branche pour zoomer jusqu’au nom des espèces.'
                        : 'Touchez un groupe pour zoomer dessus. Pincez et faites glisser pour explorer.'}
                  </Txt>
                </View>
              )}
            </View>
          </>
        )}
      </View>
    </StackScreen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: Gutter, gap: 4 },
  legendRow: { flexGrow: 0 },
  legend: { paddingHorizontal: Gutter, gap: 8, paddingVertical: 12 },
  stage: { flex: 1, overflow: 'hidden' },
  focus: { position: 'absolute', top: 4, left: Gutter },
  focusPill: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, paddingHorizontal: 12, borderRadius: Radius.pill, borderWidth: StyleSheet.hairlineWidth },
  zoom: { position: 'absolute', right: 12, flexDirection: 'row', gap: 8 },
  footer: { position: 'absolute', left: Gutter, right: Gutter },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: Radius.xl, borderWidth: StyleSheet.hairlineWidth },
  hint: { borderStyle: 'dashed', borderWidth: 1 },
  thumb: { width: 56, height: 56, borderRadius: 14 },
  flex: { flex: 1, gap: 2 },
  open: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
