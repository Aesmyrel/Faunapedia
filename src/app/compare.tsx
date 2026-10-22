import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { type LayoutChangeEvent, StyleSheet, View } from 'react-native';

import { AnimalFigure } from '@/components/species/animal-figure';
import { HUMAN_BOX, HumanFigure } from '@/components/species/scale-view';
import { SpeciesImage } from '@/components/species/species-image';
import { SpeciesPicker } from '@/components/species/species-picker';
import { Icon, mci } from '@/components/ui/icon';
import { Section } from '@/components/ui/section';
import { StackScreen } from '@/components/ui/stack-screen';
import { StatusBadge } from '@/components/ui/status-badge';
import { Tap } from '@/components/ui/tap';
import { Txt } from '@/components/ui/text';
import { alpha, Gutter, Radius } from '@/constants/theme';
import { commonAncestor, getSpecies, kinship, relatedSpecies, SPECIES } from '@/data';
import { GROUPS, HABITATS, RANKS, REGIONS } from '@/data/reference';
import type { Species, Stats } from '@/data/types';
import { useTheme } from '@/hooks/use-theme';
import { capitalize, formatLength, formatLifespan, formatNumber, formatSpeed, formatWeight } from '@/lib/format';
import { type AnimalBox, animalBox } from '@/lib/scale';
import { useStore } from '@/store';

const ROWS: { key: keyof Stats; label: string; fmt: (v: number) => string }[] = [
  { key: 'length', label: 'Longueur', fmt: formatLength },
  { key: 'height', label: 'Hauteur', fmt: formatLength },
  { key: 'wingspan', label: 'Envergure', fmt: formatLength },
  { key: 'weight', label: 'Poids', fmt: formatWeight },
  { key: 'lifespan', label: 'Longévité', fmt: formatLifespan },
  { key: 'speed', label: 'Vitesse', fmt: formatSpeed },
];

function statValue(s: Species, key: keyof Stats): number | undefined {
  const v = s.stats[key];
  if (v === undefined) return undefined;
  return typeof v === 'number' ? v : v[1];
}

/** Couleurs des deux camps : celle du groupe, ou un bleu si les deux espèces partagent le même groupe. */
function duelColors(a: Species, b: Species): [string, string] {
  const ca = GROUPS[a.group].color;
  const cb = GROUPS[b.group].color;
  return [ca, ca === cb ? '#7DD3FC' : cb];
}

function kinshipText(a: Species, b: Species): { title: string; text: string } {
  const anc = commonAncestor(a, b);
  if (!anc) return { title: 'Parenté inconnue', text: 'Classification indisponible pour l’une des espèces.' };
  const name = anc.fr ? `${capitalize(anc.fr)} (${anc.name})` : anc.name;
  const rank = RANKS[anc.rank]?.toLowerCase() ?? anc.rank;
  const texts: Record<string, string> = {
    genus: 'Ce sont de très proches cousins, réunis dans le même genre.',
    subfamily: 'Ils appartiennent à la même sous-famille : une parenté étroite.',
    family: 'Ils partagent la même famille : un air de famille est souvent visible.',
    order: 'Même ordre, mais des familles différentes.',
    class: 'Seule la classe les réunit : leurs lignées se sont séparées il y a très longtemps.',
    phylum: 'Seul l’embranchement les unit : des plans d’organisation très différents.',
    kingdom: 'Ils ne partagent que le règne animal : leurs lignées ont divergé il y a plus d’un demi-milliard d’années.',
  };
  return { title: `Ancêtre commun : ${rank} des ${name}`, text: texts[anc.rank] ?? 'Ils partagent une partie de leur histoire évolutive.' };
}

export default function CompareScreen() {
  const params = useLocalSearchParams<{ a?: string; b?: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const bump = useStore((s) => s.bump);
  const [aId, setA] = useState(() => params.a ?? 'lion');
  const [bId, setB] = useState(() => {
    if (params.b) return params.b;
    const base = getSpecies(params.a ?? 'lion');
    return (base && relatedSpecies(base, 1)[0]?.id) ?? 'tigre';
  });
  const [picking, setPicking] = useState<'a' | 'b' | null>(null);
  const a = getSpecies(aId) ?? SPECIES[0];
  const b = getSpecies(bId) ?? SPECIES[1];

  useEffect(() => {
    bump('compares');
  }, [aId, bId, bump]);

  const kin = kinshipText(a, b);
  const shared = useMemo(() => {
    const ids = new Set(b.taxonomy.map((t) => t.id));
    return a.taxonomy.filter((t) => ids.has(t.id));
  }, [a, b]);
  const [colorA, colorB] = duelColors(a, b);
  const commonHabitats = a.habitats.filter((h) => b.habitats.includes(h));
  const commonRegions = a.regions.filter((r) => b.regions.includes(r));

  return (
    <StackScreen>
      <View style={styles.pad}>
        <Txt variant="label" tone="accent">
          Comparateur
        </Txt>
        <Txt variant="display">Face à face</Txt>
      </View>

      <View style={styles.versus}>
        <Slot species={a} onPress={() => setPicking('a')} onOpen={() => router.push(`/species/${a.id}`)} />
        <View style={[styles.vs, { backgroundColor: colors.surfaceRaised, borderColor: colors.borderStrong }]}>
          <Txt variant="smallStrong">VS</Txt>
        </View>
        <Slot species={b} onPress={() => setPicking('b')} onOpen={() => router.push(`/species/${b.id}`)} />
      </View>
      <Tap
        onPress={() => {
          setA(bId);
          setB(aId);
        }}
        style={styles.swap}
        haptic="select">
        <Icon icon={mci('swap-horizontal')} size={18} color={colors.accent} />
        <Txt variant="smallStrong" tone="accent">
          Inverser
        </Txt>
      </Tap>

      <Section title="Parenté" eyebrow={`${kinship(a, b)} rangs en commun`}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Txt variant="subtitle">{kin.title}</Txt>
          <Txt variant="small" tone="secondary">
            {kin.text}
          </Txt>
          <View style={styles.lineage}>
            {shared.map((t, i) => (
              <Tap key={t.id} onPress={() => router.push(`/taxon/${t.id}`)} style={styles.lineageItem} haptic="select">
                <Txt variant="caption" tone={i === shared.length - 1 ? 'accent' : 'muted'}>
                  {t.fr ? capitalize(t.fr) : t.name}
                </Txt>
                {i < shared.length - 1 && <Icon icon={mci('chevron-right')} size={12} color={colors.textMuted} />}
              </Tap>
            ))}
          </View>
        </View>
      </Section>

      <Section title="À l’échelle">
        <DualScale a={a} b={b} />
      </Section>

      <Section title="Mensurations">
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {ROWS.map((row) => {
            const va = statValue(a, row.key);
            const vb = statValue(b, row.key);
            if (va === undefined && vb === undefined) return null;
            const max = Math.max(va ?? 0, vb ?? 0) || 1;
            const winner = va !== undefined && vb !== undefined ? (va > vb ? 'a' : vb > va ? 'b' : null) : null;
            const ratio = va && vb ? Math.max(va, vb) / Math.min(va, vb) : undefined;
            return (
              <View key={row.key} style={styles.statRow}>
                <View style={styles.statHead}>
                  <Txt variant="label" tone="muted">
                    {row.label}
                  </Txt>
                  {ratio && ratio >= 1.05 && (
                    <Txt variant="caption" tone="accent">
                      ×{formatNumber(ratio, ratio >= 10 ? 0 : 1)}
                    </Txt>
                  )}
                </View>
                <Bar label={va !== undefined ? row.fmt(va) : '—'} ratio={(va ?? 0) / max} color={colorA} win={winner === 'a'} />
                <Bar label={vb !== undefined ? row.fmt(vb) : '—'} ratio={(vb ?? 0) / max} color={colorB} win={winner === 'b'} />
              </View>
            );
          })}
        </View>
      </Section>

      <Section title="Écologie">
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.statusRow}>
            <View style={styles.flex}>
              <Txt variant="caption" tone="muted">
                {a.name}
              </Txt>
              <StatusBadge status={a.status} label small />
            </View>
            <View style={styles.flex}>
              <Txt variant="caption" tone="muted">
                {b.name}
              </Txt>
              <StatusBadge status={b.status} label small />
            </View>
          </View>
          <Txt variant="small" tone="secondary">
            Milieux communs : {commonHabitats.length ? commonHabitats.map((h) => HABITATS[h].label.toLowerCase()).join(', ') : 'aucun'}.
          </Txt>
          <Txt variant="small" tone="secondary">
            Régions communes : {commonRegions.length ? commonRegions.map((r) => REGIONS[r].label).join(', ') : 'aucune'}.
          </Txt>
        </View>
      </Section>

      <SpeciesPicker
        visible={picking !== null}
        title={picking === 'a' ? 'Première espèce' : 'Seconde espèce'}
        exclude={picking === 'a' ? bId : aId}
        onPick={(s) => {
          if (picking === 'a') setA(s.id);
          else setB(s.id);
          setPicking(null);
        }}
        onClose={() => setPicking(null)}
      />
    </StackScreen>
  );
}

function Slot({ species, onPress, onOpen }: { species: Species; onPress: () => void; onOpen: () => void }) {
  const { colors } = useTheme();
  return (
    <View style={styles.slot}>
      <Tap onPress={onOpen} style={[styles.slotImage, { borderColor: alpha(GROUPS[species.group].color, 0.6) }]} accessibilityLabel={species.name}>
        <SpeciesImage species={species} style={StyleSheet.absoluteFill} />
      </Tap>
      <Txt variant="subtitle" align="center" numberOfLines={2}>
        {species.name}
      </Txt>
      <Tap onPress={onPress} style={[styles.change, { backgroundColor: colors.surfaceRaised }]} haptic="select">
        <Icon icon={mci('swap-vertical')} size={14} color={colors.textSecondary} />
        <Txt variant="caption" tone="secondary">
          Changer
        </Txt>
      </Tap>
    </View>
  );
}

function Bar({ label, ratio, color, win }: { label: string; ratio: number; color: string; win: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={styles.barRow}>
      <View style={[styles.barTrack, { backgroundColor: colors.border }]}>
        <View style={[styles.barFill, { width: `${Math.max(2, ratio * 100)}%`, backgroundColor: win ? color : alpha(color, 0.45) }]} />
      </View>
      <Txt variant={win ? 'smallStrong' : 'small'} style={styles.barLabel} color={win ? colors.text : colors.textSecondary}>
        {label}
      </Txt>
    </View>
  );
}

/** Les deux espèces et un humain, à la même échelle. */
function DualScale({ a, b }: { a: Species; b: Species }) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);
  const boxA = animalBox(a);
  const boxB = animalBox(b);
  if (!boxA || !boxB) {
    return (
      <Txt variant="small" tone="muted">
        Mesures insuffisantes pour une comparaison à l’échelle.
      </Txt>
    );
  }
  const height = 190;
  const maxDim = Math.max(boxA.width, boxA.height, boxB.width, boxB.height);
  const human = maxDim >= 30 ? { w: HUMAN_BOX.width, h: HUMAN_BOX.height } : null;
  const parts = [human?.w ?? 0, boxA.width, boxB.width];
  const gap = maxDim * 0.12;
  const sceneW = parts.reduce((s, x) => s + x, 0) + gap * (human ? 2 : 1);
  const sceneH = Math.max(human?.h ?? 0, boxA.height, boxB.height);
  const scale = width ? Math.min((width - 24) / sceneW, (height - 20) / sceneH) : 0;
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const [colorA, colorB] = duelColors(a, b);
  const draw = (s: Species, box: AnimalBox, color: string) => <AnimalFigure species={s} box={box} scale={scale} color={color} />;

  return (
    <View onLayout={onLayout} style={[styles.scale, { backgroundColor: colors.surface, borderColor: colors.border, height: height + 40 }]}>
      {scale > 0 && (
        <View style={[styles.scene, { height }]}>
          {human && (
            <>
              <HumanFigure w={human.w * scale} h={human.h * scale} color={colors.textSecondary} />
              <View style={{ width: gap * scale }} />
            </>
          )}
          {draw(a, boxA, colorA)}
          <View style={{ width: gap * scale }} />
          {draw(b, boxB, colorB)}
        </View>
      )}
      <View style={styles.scaleLegend}>
        {human && (
          <Txt variant="caption" tone="muted">
            Humain 1,75 m
          </Txt>
        )}
        <Txt variant="caption" color={colorA}>
          {a.name}
        </Txt>
        <Txt variant="caption" color={colorB}>
          {b.name}
        </Txt>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pad: { paddingHorizontal: Gutter, gap: 2, marginBottom: 16 },
  flex: { flex: 1, gap: 4 },
  versus: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: Gutter, gap: 10 },
  vs: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, marginTop: 60 },
  slot: { flex: 1, alignItems: 'center', gap: 8 },
  slotImage: { width: '100%', aspectRatio: 1, borderRadius: Radius.xl, overflow: 'hidden', borderWidth: 2 },
  change: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.pill },
  swap: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'center', marginTop: 12, padding: 6 },
  card: { padding: 16, gap: 12, borderRadius: Radius.xl, borderWidth: StyleSheet.hairlineWidth },
  lineage: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 2 },
  lineageItem: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  statRow: { gap: 6 },
  statHead: { flexDirection: 'row', justifyContent: 'space-between' },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  barTrack: { flex: 1, height: 10, borderRadius: 5, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 5 },
  barLabel: { width: 96, textAlign: 'right' },
  statusRow: { flexDirection: 'row', gap: 12 },
  scale: { borderRadius: Radius.xl, borderWidth: StyleSheet.hairlineWidth, padding: 12 },
  scene: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center' },
  scaleLegend: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 8 },
});
