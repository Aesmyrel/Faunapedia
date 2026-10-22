import { Children, type ReactNode } from 'react';
import { Text, type TextProps, type TextStyle } from 'react-native';

import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { frTypo } from '@/lib/format';

export type TextVariant =
  | 'hero'
  | 'display'
  | 'title'
  | 'heading'
  | 'subtitle'
  | 'body'
  | 'bodyStrong'
  | 'small'
  | 'smallStrong'
  | 'caption'
  | 'label'
  | 'sci'
  | 'quote'
  | 'number';

const VARIANTS: Record<TextVariant, TextStyle> = {
  hero: { fontFamily: Fonts.displayBold, fontSize: 40, lineHeight: 44, letterSpacing: -0.6 },
  display: { fontFamily: Fonts.display, fontSize: 32, lineHeight: 38, letterSpacing: -0.4 },
  title: { fontFamily: Fonts.display, fontSize: 25, lineHeight: 31, letterSpacing: -0.2 },
  heading: { fontFamily: Fonts.display, fontSize: 20, lineHeight: 26 },
  subtitle: { fontFamily: Fonts.semibold, fontSize: 16, lineHeight: 22 },
  body: { fontFamily: Fonts.body, fontSize: 15.5, lineHeight: 24 },
  bodyStrong: { fontFamily: Fonts.semibold, fontSize: 15.5, lineHeight: 23 },
  small: { fontFamily: Fonts.medium, fontSize: 13, lineHeight: 18 },
  smallStrong: { fontFamily: Fonts.semibold, fontSize: 13, lineHeight: 18 },
  caption: { fontFamily: Fonts.medium, fontSize: 11.5, lineHeight: 15 },
  label: { fontFamily: Fonts.bold, fontSize: 10.5, lineHeight: 14, letterSpacing: 1.4, textTransform: 'uppercase' },
  sci: { fontFamily: Fonts.serifItalic, fontSize: 15, lineHeight: 20 },
  quote: { fontFamily: Fonts.displayItalic, fontSize: 19, lineHeight: 27 },
  number: { fontFamily: Fonts.displayBold, fontSize: 28, lineHeight: 32, fontVariant: ['tabular-nums'] },
};

export type TextTone = 'primary' | 'secondary' | 'muted' | 'accent' | 'inverse';

export interface TxtProps extends TextProps {
  variant?: TextVariant;
  tone?: TextTone;
  color?: string;
  align?: TextStyle['textAlign'];
  children?: ReactNode;
}

/** Texte de l’application : variantes typographiques + typographie française automatique. */
export function Txt({ variant = 'body', tone = 'primary', color, align, style, children, ...rest }: TxtProps) {
  const { colors } = useTheme();
  const toneColor = {
    primary: colors.text,
    secondary: colors.textSecondary,
    muted: colors.textMuted,
    accent: colors.accent,
    inverse: colors.background,
  }[tone];
  const content = Children.map(children, (c) => (typeof c === 'string' ? frTypo(c) : c));
  return (
    <Text style={[VARIANTS[variant], { color: color ?? toneColor, textAlign: align }, style]} {...rest}>
      {content}
    </Text>
  );
}
