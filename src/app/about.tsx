import * as WebBrowser from 'expo-web-browser';
import { StyleSheet, View } from 'react-native';

import { HeroHeader } from '@/components/ui/hero-header';
import { Icon, mci } from '@/components/ui/icon';
import { Section } from '@/components/ui/section';
import { StackScreen } from '@/components/ui/stack-screen';
import { Tap } from '@/components/ui/tap';
import { Txt } from '@/components/ui/text';
import { Radius } from '@/constants/theme';
import { SPECIES } from '@/data';
import { useTheme } from '@/hooks/use-theme';

const SOURCES = [
  {
    name: 'iNaturalist',
    url: 'https://www.inaturalist.org',
    icon: 'leaf',
    text: 'Classification, photos (licences Creative Commons, auteurs crédités sur chaque fiche), statuts UICN, enregistrements sonores et observations de terrain.',
  },
  {
    name: 'Wikipédia',
    url: 'https://fr.wikipedia.org',
    icon: 'wikipedia',
    text: 'Résumés et articles encyclopédiques en français, sous licence CC BY-SA 4.0.',
  },
  {
    name: 'GBIF',
    url: 'https://www.gbif.org',
    icon: 'earth',
    text: 'Système mondial d’information sur la biodiversité : cartes de répartition et nombre d’observations géolocalisées.',
  },
  {
    name: 'PhyloPic',
    url: 'https://www.phylopic.org',
    icon: 'shape',
    text: 'Silhouettes d’organismes partagées par la communauté scientifique (licences indiquées sur chaque fiche).',
  },
  {
    name: 'Liste rouge de l’UICN',
    url: 'https://www.iucnredlist.org',
    icon: 'alert-octagon',
    text: 'Référence mondiale sur le statut de conservation des espèces.',
  },
];

export default function AboutScreen() {
  const { colors } = useTheme();
  return (
    <StackScreen>
      <HeroHeader
        icon={mci('book-open-page-variant')}
        color="#E8B04B"
        eyebrow="Projet passion, sans publicité ni collecte de données"
        title="Faunapedia"
        description={`Une encyclopédie zoologique de poche pour les passionnés : ${SPECIES.length} fiches rédigées avec soin, et l’arbre du vivant complet consultable en direct.`}
      />
      <Section title="D’où viennent les données ?">
        <View style={styles.list}>
          {SOURCES.map((s) => (
            <Tap
              key={s.name}
              onPress={() => WebBrowser.openBrowserAsync(s.url)}
              style={[styles.source, { backgroundColor: colors.surface, borderColor: colors.border }]}
              scaleTo={0.99}>
              <Icon icon={mci(s.icon)} size={22} color={colors.accent} />
              <View style={styles.flex}>
                <Txt variant="subtitle">{s.name} ↗</Txt>
                <Txt variant="small" tone="secondary">
                  {s.text}
                </Txt>
              </View>
            </Tap>
          ))}
        </View>
      </Section>
      <Section title="Rédaction">
        <Txt variant="body" tone="secondary">
          Les mensurations, modes de vie, records et anecdotes ont été rédigés pour Faunapedia à partir de la littérature de
          référence. Les valeurs sont des ordres de grandeur pour des adultes à l’état sauvage ; elles varient selon les
          populations et les sources. Une erreur ? Les contributions sont les bienvenues sur le dépôt du projet.
        </Txt>
      </Section>
      <Section title="Vie privée">
        <Txt variant="body" tone="secondary">
          Votre progression (découvertes, favoris, scores) reste sur votre téléphone. Votre position n’est utilisée que pour
          interroger iNaturalist lorsque vous ouvrez « Autour de moi », et n’est jamais conservée.
        </Txt>
      </Section>
    </StackScreen>
  );
}

const styles = StyleSheet.create({
  list: { gap: 10 },
  source: { flexDirection: 'row', gap: 14, padding: 14, borderRadius: Radius.lg, borderWidth: StyleSheet.hairlineWidth },
  flex: { flex: 1, gap: 2 },
});
