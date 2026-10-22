import { NativeTabs } from 'expo-router/native-tabs';
import { DynamicColorIOS, Platform } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

/** Onglets natifs : Liquid Glass sur iOS 26, barre Material sur Android. */
export default function AppTabs() {
  const { colors } = useTheme();
  const tint = Platform.OS === 'ios' ? DynamicColorIOS({ dark: colors.accent, light: colors.accent }) : colors.accent;
  return (
    <NativeTabs
      tintColor={tint}
      backgroundColor={Platform.OS === 'android' ? colors.surface : undefined}
      indicatorColor={Platform.OS === 'android' ? colors.accentSoft : undefined}
      labelStyle={{ selected: { color: colors.accent } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Découvrir</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'leaf', selected: 'leaf.fill' }} md="eco" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="explorer">
        <NativeTabs.Trigger.Label>Explorer</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'binoculars', selected: 'binoculars.fill' }} md="travel_explore" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="quiz">
        <NativeTabs.Trigger.Label>Quiz</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'trophy', selected: 'trophy.fill' }} md="emoji_events" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="carnet">
        <NativeTabs.Trigger.Label>Carnet</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'book.closed', selected: 'book.closed.fill' }} md="menu_book" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
