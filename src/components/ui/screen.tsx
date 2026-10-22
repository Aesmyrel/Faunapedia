import type { ReactNode } from 'react';
import { Platform, ScrollView, type ScrollViewProps, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MaxContentWidth, TabBarInset } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface TabScreenProps extends ScrollViewProps {
  children: ReactNode;
}

/**
 * Écran d’onglet défilant. Sur iOS, les onglets natifs ajustent eux-mêmes les
 * encarts (barre d’état et barre d’onglets) ; ailleurs on les applique ici.
 */
export function TabScreen({ children, contentContainerStyle, ...rest }: TabScreenProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const top = Platform.OS === 'ios' ? 8 : insets.top + 12;
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={[{ paddingTop: top, paddingBottom: TabBarInset }, contentContainerStyle]}
      showsVerticalScrollIndicator={false}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
      {...rest}>
      <View style={styles.inner}>{children}</View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  inner: { width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' },
});
