import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Radius } from '@/constants/theme';
import { useRemote } from '@/hooks/use-remote';
import { useTheme } from '@/hooks/use-theme';
import { getWikiArticle, type WikiSection, wikiPageUrl } from '@/lib/api';

import { Icon, mci } from '../ui/icon';
import { EmptyState, Loading } from '../ui/states';
import { Tap } from '../ui/tap';
import { Txt } from '../ui/text';

/** Article Wikipédia complet, découpé en sections dépliables. */
export function WikiReader({ title }: { title: string }) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const article = useRemote(open ? `wiki-${title}` : null, () => getWikiArticle(title));

  if (!open) {
    return (
      <Tap onPress={() => setOpen(true)} style={[styles.cta, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Icon icon={mci('wikipedia')} size={22} color={colors.text} />
        <View style={styles.flex}>
          <Txt variant="subtitle">Lire l’article encyclopédique</Txt>
          <Txt variant="caption" tone="muted">
            Description, comportement, reproduction… (Wikipédia)
          </Txt>
        </View>
        <Icon icon={mci('chevron-down')} size={20} color={colors.textMuted} />
      </Tap>
    );
  }
  if (article.loading) return <Loading label="Chargement de l’article…" />;
  if (article.error || !article.data) {
    return (
      <EmptyState
        icon={mci('wifi-off')}
        title="Article indisponible"
        message="Vérifiez votre connexion pour lire l’article complet."
        action={{ label: 'Réessayer', onPress: article.reload }}
      />
    );
  }
  const pageTitle = article.data.title;
  return (
    <Animated.View entering={FadeIn} style={styles.article}>
      {article.data.sections.map((s, i) => (
        <WikiSectionView key={`${s.title}-${i}`} section={s} />
      ))}
      <Tap onPress={() => WebBrowser.openBrowserAsync(wikiPageUrl(pageTitle))} style={styles.source}>
        <Txt variant="caption" tone="muted">
          Texte : « {pageTitle} », Wikipédia — licence CC BY-SA 4.0.
        </Txt>
        <Txt variant="caption" tone="accent">
          Ouvrir sur Wikipédia ↗
        </Txt>
      </Tap>
    </Animated.View>
  );
}

function WikiSectionView({ section }: { section: WikiSection }) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const isSub = section.level > 2;
  if (!section.text) {
    return (
      <Txt variant={isSub ? 'subtitle' : 'heading'} style={styles.sectionTitle}>
        {section.title}
      </Txt>
    );
  }
  return (
    <View style={[styles.section, { borderColor: colors.border }, isSub && styles.subSection]}>
      <Tap onPress={() => setExpanded((e) => !e)} style={styles.sectionHead} haptic="select" scaleTo={0.99}>
        <Txt variant={isSub ? 'smallStrong' : 'subtitle'} style={styles.flex}>
          {section.title}
        </Txt>
        <Icon icon={mci(expanded ? 'chevron-up' : 'chevron-down')} size={18} color={colors.textMuted} />
      </Tap>
      {expanded ? (
        <Animated.View entering={FadeIn.duration(200)}>
          <Txt variant="body" tone="secondary" selectable>
            {section.text}
          </Txt>
        </Animated.View>
      ) : (
        <Txt variant="small" tone="muted" numberOfLines={2}>
          {section.text}
        </Txt>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cta: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: Radius.lg, borderWidth: StyleSheet.hairlineWidth },
  flex: { flex: 1 },
  article: { gap: 4 },
  section: { borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: 12, gap: 6 },
  subSection: { paddingLeft: 12 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { marginTop: 14 },
  source: { marginTop: 14, gap: 4 },
});
