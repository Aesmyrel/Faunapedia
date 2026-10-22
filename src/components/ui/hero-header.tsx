import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { alpha, Gutter, Radius } from '@/constants/theme';
import type { IconRef } from '@/data/reference';

import { Icon } from './icon';
import { Txt } from './text';

export interface HeroHeaderProps {
  icon: IconRef;
  color: string;
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
}

/** En-tête coloré des pages de groupe, de collection et de mode de jeu. */
export function HeroHeader({ icon, color, eyebrow, title, description, children }: HeroHeaderProps) {
  return (
    <View style={styles.wrap}>
      <LinearGradient colors={[alpha(color, 0.28), alpha(color, 0)]} style={styles.glow} />
      <View style={[styles.icon, { backgroundColor: alpha(color, 0.2), borderColor: alpha(color, 0.5) }]}>
        <Icon icon={icon} size={30} color={color} />
      </View>
      {eyebrow && (
        <Txt variant="label" color={color}>
          {eyebrow}
        </Txt>
      )}
      <Txt variant="display">{title}</Txt>
      {description && (
        <Txt variant="body" tone="secondary">
          {description}
        </Txt>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: Gutter, gap: 8, marginBottom: 24 },
  glow: { position: 'absolute', top: -140, left: 0, right: 0, height: 320 },
  icon: {
    width: 64,
    height: 64,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 8,
  },
});
