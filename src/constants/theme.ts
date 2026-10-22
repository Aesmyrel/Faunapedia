/**
 * Système de design de Faunapedia.
 *
 * Esthétique « muséum d’histoire naturelle la nuit » : fonds très sombres
 * (écrans OLED), typographie éditoriale (Fraunces) pour les titres, Inter
 * pour l’interface, et une couleur d’accent propre à chaque groupe animal.
 */
import { Platform } from 'react-native';

export type ThemeName = 'dark' | 'light';

export interface Palette {
  background: string;
  surface: string;
  surfaceRaised: string;
  surfaceGlass: string;
  border: string;
  borderStrong: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentSoft: string;
  onAccent: string;
  success: string;
  danger: string;
  warning: string;
  overlay: string;
}

export const Palettes: Record<ThemeName, Palette> = {
  dark: {
    background: '#07090B',
    surface: '#101418',
    surfaceRaised: '#171C21',
    surfaceGlass: 'rgba(22, 27, 32, 0.72)',
    border: 'rgba(255,255,255,0.07)',
    borderStrong: 'rgba(255,255,255,0.14)',
    text: '#F4F1EA',
    textSecondary: '#B9B4A8',
    textMuted: '#7D7A72',
    accent: '#E8B04B',
    accentSoft: 'rgba(232,176,75,0.14)',
    onAccent: '#1A1206',
    success: '#34D399',
    danger: '#F87171',
    warning: '#FBBF24',
    overlay: 'rgba(0,0,0,0.55)',
  },
  light: {
    background: '#F6F3EC',
    surface: '#FFFFFF',
    surfaceRaised: '#FFFFFF',
    surfaceGlass: 'rgba(255,255,255,0.78)',
    border: 'rgba(20,18,12,0.08)',
    borderStrong: 'rgba(20,18,12,0.16)',
    text: '#17150F',
    textSecondary: '#55524A',
    textMuted: '#8C887E',
    accent: '#B7791F',
    accentSoft: 'rgba(183,121,31,0.12)',
    onAccent: '#FFFFFF',
    success: '#059669',
    danger: '#DC2626',
    warning: '#D97706',
    overlay: 'rgba(0,0,0,0.4)',
  },
};

export const Fonts = {
  display: 'Fraunces_600SemiBold',
  displayItalic: 'Fraunces_600SemiBold_Italic',
  displayBold: 'Fraunces_800ExtraBold',
  serifItalic: 'Fraunces_400Regular_Italic',
  body: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  mono: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
} as const;

export const Space = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  xxl: 28,
  pill: 999,
} as const;

/** Marge latérale standard des écrans. */
export const Gutter = 20;

/**
 * Espace à réserver sous le contenu des onglets. Sur iOS et Android, les
 * onglets natifs gèrent eux-mêmes l’encart ; sur le web, la barre flotte.
 */
export const TabBarInset = Platform.select({ web: 112, default: 28 }) ?? 28;

export const MaxContentWidth = 720;

/** Ajoute une opacité (0–1) à une couleur hexadécimale #RRGGBB. */
export function alpha(hex: string, opacity: number): string {
  const a = Math.round(Math.min(1, Math.max(0, opacity)) * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex.slice(0, 7)}${a}`;
}
