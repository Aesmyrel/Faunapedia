import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { ScrollView, type ScrollViewProps, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Gutter, MaxContentWidth } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { mci } from './icon';
import { IconButton } from './icon-button';

export interface StackScreenProps extends ScrollViewProps {
  children: ReactNode;
  /** Boutons supplémentaires à droite de la barre. */
  actions?: ReactNode;
  /** Désactive le défilement (le contenu gère le sien). */
  static?: boolean;
}

/** Écran empilé : bouton retour flottant, encarts de sécurité et largeur maximale. */
export function StackScreen({ children, actions, static: isStatic, contentContainerStyle, ...rest }: StackScreenProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const bar = (
    <View style={[styles.bar, { top: insets.top + 6 }]} pointerEvents="box-none">
      <IconButton icon={mci('chevron-left')} onPress={back} label="Retour" />
      <View style={styles.actions}>{actions}</View>
    </View>
  );
  if (isStatic) {
    return (
      <View style={[styles.fill, { backgroundColor: colors.background, paddingTop: insets.top + 60 }]}>
        {children}
        {bar}
      </View>
    );
  }
  return (
    <View style={[styles.fill, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[{ paddingTop: insets.top + 60, paddingBottom: insets.bottom + 40 }, contentContainerStyle]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        {...rest}>
        <View style={styles.inner}>{children}</View>
      </ScrollView>
      {bar}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  inner: { width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' },
  bar: { position: 'absolute', left: 14, right: 14, flexDirection: 'row', justifyContent: 'space-between' },
  actions: { flexDirection: 'row', gap: 10 },
  // Utilisé par les écrans pour aligner leur contenu sur la marge standard.
  gutter: { paddingHorizontal: Gutter },
});
