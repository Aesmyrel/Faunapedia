import type { ReactNode } from 'react';
import { ScrollView } from 'react-native';

import { Gutter } from '@/constants/theme';

/** Défilement horizontal avec marges et aimantation douce. */
export function Carousel({ children, gap = 12, snap }: { children: ReactNode; gap?: number; snap?: number }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: Gutter, gap }}
      decelerationRate="fast"
      snapToInterval={snap ? snap + gap : undefined}
      snapToAlignment="start">
      {children}
    </ScrollView>
  );
}
