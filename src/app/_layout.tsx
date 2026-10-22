import {
  Fraunces_400Regular_Italic,
  Fraunces_600SemiBold,
  Fraunces_600SemiBold_Italic,
  Fraunces_800ExtraBold,
} from '@expo-google-fonts/fraunces';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, type ErrorBoundaryProps, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { CelebrationHost } from '@/components/celebration-host';
import { mci } from '@/components/ui/icon';
import { EmptyState } from '@/components/ui/states';
import { Welcome } from '@/components/welcome';
import { useTheme } from '@/hooks/use-theme';
import { useHydrated, useStore } from '@/store';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const theme = useTheme();
  const [fontsLoaded, fontError] = useFonts({
    Fraunces_400Regular_Italic,
    Fraunces_600SemiBold,
    Fraunces_600SemiBold_Italic,
    Fraunces_800ExtraBold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const hydrated = useHydrated();
  const onboarded = useStore((s) => s.settings.onboarded);
  // On attend polices et sauvegarde locale : pas de « flash » de l’état par défaut.
  const ready = (fontsLoaded || Boolean(fontError)) && hydrated;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return null;

  const base = theme.dark ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...base,
    colors: {
      ...base.colors,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.text,
      border: theme.colors.border,
      primary: theme.colors.accent,
    },
  };

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ThemeProvider value={navTheme}>
        <StatusBar style={theme.dark ? 'light' : 'dark'} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: theme.colors.background },
            animation: 'slide_from_right',
          }}>
          <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
          <Stack.Screen name="quiz/[mode]" options={{ animation: 'slide_from_bottom', gestureEnabled: false }} />
          <Stack.Screen name="compare" options={{ animation: 'slide_from_bottom' }} />
        </Stack>
        <CelebrationHost />
        {!onboarded && <Welcome />}
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

/** Écran affiché si une erreur inattendue survient dans un écran. */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  const theme = useTheme();
  return (
    <View style={[styles.error, { backgroundColor: theme.colors.background }]}>
      <EmptyState
        icon={mci('alert-circle-outline')}
        title="Oups, un imprévu"
        message={`Cet écran a rencontré un problème.\n${error.message}`}
        action={{ label: 'Réessayer', onPress: retry }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  error: { flex: 1, justifyContent: 'center' },
});
