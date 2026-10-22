import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { TaxonRow } from '@/components/taxon/taxon-row';
import { Chip } from '@/components/ui/chip';
import { HeroHeader } from '@/components/ui/hero-header';
import { Icon, mci } from '@/components/ui/icon';
import { Segmented } from '@/components/ui/segmented';
import { StackScreen } from '@/components/ui/stack-screen';
import { EmptyState, Loading } from '@/components/ui/states';
import { Tap } from '@/components/ui/tap';
import { Txt } from '@/components/ui/text';
import { alpha, Gutter, Radius } from '@/constants/theme';
import { GROUPS } from '@/data/reference';
import { useRemote } from '@/hooks/use-remote';
import { useTheme } from '@/hooks/use-theme';
import { getNearby } from '@/lib/api';
import { formatNumber } from '@/lib/format';
import { useStore } from '@/store';

interface Place {
  label: string;
  lat: number;
  lng: number;
}

/** Lieux emblématiques pour voyager virtuellement (ou si la localisation est refusée). */
const PLACES: Place[] = [
  { label: 'Paris', lat: 48.857, lng: 2.352 },
  { label: 'Camargue', lat: 43.53, lng: 4.5 },
  { label: 'Massif des Écrins', lat: 44.85, lng: 6.35 },
  { label: 'Guyane', lat: 4.55, lng: -52.2 },
  { label: 'Serengeti', lat: -2.33, lng: 34.83 },
  { label: 'Amazonie', lat: -3.1, lng: -60.0 },
  { label: 'Galápagos', lat: -0.74, lng: -90.31 },
  { label: 'Yellowstone', lat: 44.6, lng: -110.5 },
  { label: 'Grande Barrière', lat: -16.92, lng: 145.77 },
  { label: 'Bornéo', lat: 5.4, lng: 117.9 },
];

const FILTERS: { id: string; label: string; iconic?: string; color?: string }[] = [
  { id: 'all', label: 'Tous' },
  { id: 'Aves', label: 'Oiseaux', iconic: 'Aves', color: GROUPS.birds.color },
  { id: 'Mammalia', label: 'Mammifères', iconic: 'Mammalia', color: GROUPS.mammals.color },
  { id: 'Reptilia', label: 'Reptiles', iconic: 'Reptilia', color: GROUPS.reptiles.color },
  { id: 'Amphibia', label: 'Amphibiens', iconic: 'Amphibia', color: GROUPS.amphibians.color },
  { id: 'Insecta', label: 'Insectes', iconic: 'Insecta', color: GROUPS.insects.color },
  { id: 'Arachnida', label: 'Arachnides', iconic: 'Arachnida', color: GROUPS.arachnids.color },
  { id: 'Actinopterygii', label: 'Poissons', iconic: 'Actinopterygii', color: GROUPS.fishes.color },
  { id: 'Mollusca', label: 'Mollusques', iconic: 'Mollusca', color: GROUPS.molluscs.color },
];

type RadiusKm = '5' | '25' | '100';

export default function NearbyScreen() {
  const { colors } = useTheme();
  const bump = useStore((s) => s.bump);
  const [place, setPlace] = useState<Place | null>(null);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);
  const [radius, setRadius] = useState<RadiusKm>('25');
  const [filter, setFilter] = useState('all');
  const iconic = FILTERS.find((f) => f.id === filter)?.iconic;

  const lat = place?.lat ?? 0;
  const lng = place?.lng ?? 0;
  const results = useRemote(place ? `nearby-${lat}-${lng}-${radius}-${filter}` : null, () =>
    getNearby(lat, lng, Number(radius), iconic),
  );

  useEffect(() => {
    if (results.data?.length) bump('nearby');
  }, [results.data, bump]);

  const locate = async () => {
    setLocating(true);
    setLocError(null);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== 'granted') {
        setLocError('Localisation refusée. Choisissez plutôt un lieu ci-dessous.');
        return;
      }
      const pos =
        (await Location.getLastKnownPositionAsync({ maxAge: 10 * 60 * 1000 })) ??
        (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
      setPlace({ label: 'Ma position', lat: pos.coords.latitude, lng: pos.coords.longitude });
    } catch {
      setLocError('Position indisponible. Choisissez plutôt un lieu ci-dessous.');
    } finally {
      setLocating(false);
    }
  };

  return (
    <StackScreen>
      <HeroHeader
        icon={mci('map-marker-radius')}
        color="#22C55E"
        eyebrow="Observations iNaturalist en direct"
        title="Autour de moi"
        description="Les espèces animales réellement observées et validées par la communauté iNaturalist, près de vous ou dans un lieu emblématique."
      />
      <View style={styles.pad}>
        <Tap onPress={locate} style={[styles.locate, { backgroundColor: alpha('#22C55E', 0.16), borderColor: alpha('#22C55E', 0.5) }]}>
          <Icon icon={mci('crosshairs-gps')} size={20} color="#22C55E" />
          <Txt variant="subtitle" color="#22C55E">
            {locating ? 'Localisation…' : 'Utiliser ma position'}
          </Txt>
        </Tap>
        {locError && (
          <Txt variant="small" tone="muted">
            {locError}
          </Txt>
        )}
        <Txt variant="label" tone="muted">
          Ou partez en voyage
        </Txt>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.places}>
        {PLACES.map((p) => (
          <Chip key={p.label} label={p.label} icon={mci('map-marker')} selected={place?.label === p.label} color="#22C55E" onPress={() => setPlace(p)} />
        ))}
      </ScrollView>

      {place && (
        <View style={styles.pad}>
          <View style={[styles.controls, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.placeRow}>
              <Icon icon={mci('map-marker')} size={18} color="#22C55E" />
              <Txt variant="subtitle" style={styles.flex}>
                {place.label}
              </Txt>
              <Txt variant="caption" tone="muted">
                {formatNumber(place.lat, 2)}°, {formatNumber(place.lng, 2)}°
              </Txt>
            </View>
            <Segmented<RadiusKm>
              value={radius}
              onChange={setRadius}
              options={[
                { value: '5', label: '5 km' },
                { value: '25', label: '25 km' },
                { value: '100', label: '100 km' },
              ]}
            />
          </View>
        </View>
      )}

      {place && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.places}>
          {FILTERS.map((f) => (
            <Chip key={f.id} label={f.label} color={f.color} selected={filter === f.id} size="sm" onPress={() => setFilter(f.id)} />
          ))}
        </ScrollView>
      )}

      <View style={styles.pad}>
        {!place ? (
          <EmptyState
            icon={mci('binoculars')}
            title="Où partons-nous ?"
            message="Activez votre position ou choisissez un lieu pour découvrir sa faune."
          />
        ) : results.loading ? (
          <Loading label="Interrogation d’iNaturalist…" />
        ) : results.error ? (
          <EmptyState icon={mci('wifi-off')} title="Connexion nécessaire" action={{ label: 'Réessayer', onPress: results.reload }} />
        ) : !results.data?.length ? (
          <EmptyState title="Aucune observation" message="Essayez d’élargir le rayon ou de changer de filtre." />
        ) : (
          <>
            <Txt variant="smallStrong" tone="secondary" style={styles.count}>
              {results.data.length} espèces les plus observées dans un rayon de {radius} km
            </Txt>
            {results.data.map((r) => (
              <TaxonRow key={r.taxon.id} taxon={r.taxon} meta={`${formatNumber(r.count, 0)} observation${r.count > 1 ? 's' : ''}`} />
            ))}
          </>
        )}
      </View>
    </StackScreen>
  );
}

const styles = StyleSheet.create({
  pad: { paddingHorizontal: Gutter, gap: 10 },
  flex: { flex: 1 },
  locate: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 15, borderRadius: Radius.lg, borderWidth: 1 },
  places: { paddingHorizontal: Gutter, gap: 8, paddingVertical: 12 },
  controls: { padding: 14, gap: 12, borderRadius: Radius.xl, borderWidth: StyleSheet.hairlineWidth },
  placeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  count: { marginTop: 4, marginBottom: 4 },
});
