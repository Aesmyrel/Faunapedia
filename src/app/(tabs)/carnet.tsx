import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';

import { SpeciesCard } from '@/components/species/species-card';
import { Carousel } from '@/components/ui/carousel';
import { Icon, mci } from '@/components/ui/icon';
import { ProgressBar, ProgressRing } from '@/components/ui/progress-ring';
import { TabScreen } from '@/components/ui/screen';
import { Section } from '@/components/ui/section';
import { Segmented, Toggle } from '@/components/ui/segmented';
import { Tap } from '@/components/ui/tap';
import { Txt } from '@/components/ui/text';
import { alpha, Gutter, Radius } from '@/constants/theme';
import { getSpecies, SPECIES, SPECIES_BY_GROUP } from '@/data';
import { GROUP_ORDER, GROUPS } from '@/data/reference';
import { useTheme } from '@/hooks/use-theme';
import { BADGES, isUnlocked, levelFromXp } from '@/lib/progress';
import { activeStreak, type ThemePreference, useStore } from '@/store';

export default function NotebookScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const state = useStore();
  const [confirmReset, setConfirmReset] = useState(false);
  const level = levelFromXp(state.xp);
  const seenIds = Object.keys(state.seen);
  const seenCount = seenIds.length;
  const recent = useMemo(
    () =>
      Object.entries(state.seen)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 12)
        .map(([id]) => getSpecies(id))
        .filter((s) => s !== undefined),
    [state.seen],
  );
  const favorites = state.favorites.map((id) => getSpecies(id)).filter((s) => s !== undefined);
  const snapshot = { seen: state.seen, favorites: state.favorites, xp: state.xp, stats: state.stats, daily: state.daily, counters: state.counters };
  const nextBadges = BADGES.filter((b) => !state.badges[b.id] && !b.secret)
    .map((b) => {
      const [cur, goal] = b.progress(snapshot);
      return { b, ratio: Math.min(1, cur / goal), cur, goal };
    })
    .sort((a, b) => b.ratio - a.ratio)
    .slice(0, 3);
  const unlockedCount = BADGES.filter((b) => state.badges[b.id] || isUnlocked(b, snapshot)).length;

  return (
    <TabScreen>
      <View style={styles.header}>
        <Txt variant="label" tone="muted">
          Votre progression
        </Txt>
        <Txt variant="display">Carnet de terrain</Txt>
      </View>

      <View style={styles.block}>
        <View style={[styles.profile, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <ProgressRing size={96} stroke={7} progress={level.progress} color={colors.accent}>
            <Txt variant="caption" tone="muted">
              Niveau
            </Txt>
            <Txt variant="title">{level.level}</Txt>
          </ProgressRing>
          <View style={styles.flex}>
            <Txt variant="heading">{level.rank.title}</Txt>
            <Txt variant="caption" tone="secondary">
              {state.xp} XP au total
              {level.nextRank ? ` · prochain rang au niveau ${level.nextRank.from} : ${level.nextRank.title}` : ''}
            </Txt>
            <View style={styles.miniStats}>
              <Mini icon="book-open-variant" value={`${seenCount}/${SPECIES.length}`} color="#38BDF8" />
              <Mini icon="medal" value={`${unlockedCount}`} color="#FACC15" />
              <Mini icon="fire" value={`${activeStreak(state.daily)}`} color="#F97316" />
            </View>
          </View>
        </View>
      </View>

      <Section title="Encyclopédie" eyebrow={`${Math.round((seenCount / SPECIES.length) * 100)} % découvert`}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {GROUP_ORDER.map((g) => {
            const all = SPECIES_BY_GROUP[g];
            const n = all.filter((s) => state.seen[s.id]).length;
            const info = GROUPS[g];
            return (
              <Tap key={g} onPress={() => router.push(`/group/${g}`)} style={styles.groupRow} scaleTo={0.99} haptic="select">
                <Icon icon={info.icon} size={18} color={info.color} />
                <Txt variant="smallStrong" style={styles.groupLabel} numberOfLines={1}>
                  {info.label}
                </Txt>
                <View style={styles.flex}>
                  <ProgressBar progress={n / all.length} color={info.color} />
                </View>
                <Txt variant="caption" tone="muted" style={styles.groupCount}>
                  {n}/{all.length}
                </Txt>
              </Tap>
            );
          })}
        </View>
      </Section>

      <Section title="Favoris" eyebrow={`${favorites.length} espèce${favorites.length > 1 ? 's' : ''}`} bleed>
        {favorites.length ? (
          <Carousel snap={160}>
            {favorites.map((s) => (
              <SpeciesCard key={s.id} species={s} variant="tile" width={160} />
            ))}
          </Carousel>
        ) : (
          <View style={[styles.empty, { borderColor: colors.border, marginHorizontal: Gutter }]}>
            <Icon icon={mci('heart-outline')} size={22} color={colors.textMuted} />
            <Txt variant="small" tone="muted" style={styles.flex}>
              Touchez le cœur sur une fiche pour retrouver ici vos espèces préférées.
            </Txt>
          </View>
        )}
      </Section>

      <Section title="Badges" eyebrow={`${unlockedCount}/${BADGES.length} débloqués`} action={{ label: 'Tous', onPress: () => router.push('/badges') }}>
        <View style={styles.badges}>
          {nextBadges.map(({ b, ratio, cur, goal }) => (
            <View key={b.id} style={[styles.badgeRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.badgeIcon, { backgroundColor: alpha(b.color, 0.16) }]}>
                <Icon icon={b.icon} size={20} color={b.color} />
              </View>
              <View style={styles.flex}>
                <Txt variant="smallStrong">{b.title}</Txt>
                <Txt variant="caption" tone="muted" numberOfLines={1}>
                  {b.description}
                </Txt>
                <View style={styles.badgeProgress}>
                  <View style={styles.flex}>
                    <ProgressBar progress={ratio} color={b.color} height={4} />
                  </View>
                  <Txt variant="caption" tone="muted">
                    {Math.min(cur, goal)}/{goal}
                  </Txt>
                </View>
              </View>
            </View>
          ))}
        </View>
      </Section>

      {recent.length > 0 && (
        <Section title="Dernières découvertes" bleed>
          <Carousel snap={160}>
            {recent.map((s) => (
              <SpeciesCard key={s.id} species={s} variant="tile" width={160} />
            ))}
          </Carousel>
        </Section>
      )}

      <Section title="Réglages">
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.setting}>
            <Txt variant="smallStrong">Apparence</Txt>
            <Segmented<ThemePreference>
              value={state.settings.theme}
              onChange={(theme) => state.updateSettings({ theme })}
              options={[
                { value: 'system', label: 'Système' },
                { value: 'dark', label: 'Sombre' },
                { value: 'light', label: 'Clair' },
              ]}
            />
          </View>
          <SettingRow
            label="Retours haptiques"
            hint="Vibrations légères au toucher et aux réponses."
            value={state.settings.haptics}
            onChange={(haptics) => state.updateSettings({ haptics })}
          />
          <SettingRow
            label="Masquer les araignées"
            hint="Mode arachnophobie : photos et silhouettes d’araignées et autres arachnides remplacées par des images toutes douces."
            value={state.settings.hideSpiders === true}
            onChange={(hideSpiders) => state.updateSettings({ hideSpiders })}
          />
          <SettingRow
            label="Charger les sons automatiquement"
            hint="Sur les fiches d’oiseaux et d’espèces vocales. Désactivez pour économiser vos données."
            value={state.settings.sounds}
            onChange={(sounds) => state.updateSettings({ sounds })}
          />
        </View>
        <View style={styles.links}>
          <LinkRow icon="share-variant" label="Partager l’application" onPress={() => router.push('/share')} />
          <LinkRow icon="information-outline" label="À propos, sources et crédits" onPress={() => router.push('/about')} />
          <LinkRow icon="restore" label="Réinitialiser ma progression" danger onPress={() => setConfirmReset(true)} />
        </View>
      </Section>

      <Modal visible={confirmReset} transparent animationType="fade" onRequestClose={() => setConfirmReset(false)}>
        <View style={[styles.modalBg, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modal, { backgroundColor: colors.surfaceRaised }]}>
            <Txt variant="heading">Tout effacer ?</Txt>
            <Txt variant="small" tone="secondary">
              Découvertes, XP, badges, séries et favoris seront supprimés. Vos réglages sont conservés.
            </Txt>
            <View style={styles.modalActions}>
              <Tap onPress={() => setConfirmReset(false)} style={[styles.modalBtn, { backgroundColor: colors.surface }]}>
                <Txt variant="smallStrong">Annuler</Txt>
              </Tap>
              <Tap
                onPress={() => {
                  state.resetProgress();
                  setConfirmReset(false);
                }}
                style={[styles.modalBtn, { backgroundColor: alpha(colors.danger, 0.2) }]}>
                <Txt variant="smallStrong" color={colors.danger}>
                  Réinitialiser
                </Txt>
              </Tap>
            </View>
          </View>
        </View>
      </Modal>
    </TabScreen>
  );
}

function Mini({ icon, value, color }: { icon: string; value: string; color: string }) {
  return (
    <View style={styles.mini}>
      <Icon icon={mci(icon)} size={15} color={color} />
      <Txt variant="smallStrong">{value}</Txt>
    </View>
  );
}

function SettingRow({ label, hint, value, onChange }: { label: string; hint: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.flex}>
        <Txt variant="smallStrong">{label}</Txt>
        <Txt variant="caption" tone="muted">
          {hint}
        </Txt>
      </View>
      <Toggle value={value} onChange={onChange} label={label} />
    </View>
  );
}

function LinkRow({ icon, label, onPress, danger }: { icon: string; label: string; onPress: () => void; danger?: boolean }) {
  const { colors } = useTheme();
  const color = danger ? colors.danger : colors.text;
  return (
    <Tap onPress={onPress} style={[styles.link, { borderBottomColor: colors.border }]} scaleTo={0.99}>
      <Icon icon={mci(icon)} size={20} color={color} />
      <Txt variant="smallStrong" color={color} style={styles.flex}>
        {label}
      </Txt>
      <Icon icon={mci('chevron-right')} size={18} color={colors.textMuted} />
    </Tap>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: Gutter, marginBottom: 16, gap: 2 },
  block: { paddingHorizontal: Gutter },
  flex: { flex: 1 },
  profile: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 16, borderRadius: Radius.xl, borderWidth: StyleSheet.hairlineWidth },
  miniStats: { flexDirection: 'row', gap: 14, marginTop: 10 },
  mini: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  card: { padding: 14, gap: 4, borderRadius: Radius.xl, borderWidth: StyleSheet.hairlineWidth },
  groupRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7 },
  groupLabel: { width: 118 },
  groupCount: { width: 44, textAlign: 'right' },
  empty: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: Radius.lg, borderWidth: 1, borderStyle: 'dashed' },
  badges: { gap: 10 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: Radius.lg, borderWidth: StyleSheet.hairlineWidth },
  badgeIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  badgeProgress: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  setting: { gap: 10, paddingVertical: 8 },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  links: { marginTop: 12 },
  link: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  modalBg: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  modal: { width: '100%', maxWidth: 380, padding: 20, gap: 10, borderRadius: Radius.xl },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  modalBtn: { flex: 1, alignItems: 'center', paddingVertical: 13, borderRadius: Radius.md },
});
