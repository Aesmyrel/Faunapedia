import { useColorScheme } from 'react-native';

import { type Palette, Palettes, type ThemeName } from '@/constants/theme';
import { useStore } from '@/store';

export interface Theme {
  name: ThemeName;
  dark: boolean;
  colors: Palette;
}

/** Thème actif : préférence de l’utilisateur, sinon celle du système (sombre par défaut). */
export function useTheme(): Theme {
  const pref = useStore((s) => s.settings.theme);
  const system = useColorScheme();
  const name: ThemeName = pref === 'system' ? (system === 'light' ? 'light' : 'dark') : pref;
  return { name, dark: name === 'dark', colors: Palettes[name] };
}
