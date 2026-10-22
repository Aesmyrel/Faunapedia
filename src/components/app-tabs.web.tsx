import { TabList, type TabListProps, TabSlot, TabTrigger, type TabTriggerSlotProps, Tabs } from 'expo-router/ui';
import { Pressable, type PressableProps, StyleSheet, View } from 'react-native';

import { MaxContentWidth, Radius } from '@/constants/theme';
import type { IconRef } from '@/data/reference';
import { useTheme } from '@/hooks/use-theme';

import { Glass } from './ui/glass';
import { Icon, mci } from './ui/icon';
import { Txt } from './ui/text';

const TABS: { name: string; href: '/' | '/explorer' | '/quiz' | '/carnet'; label: string; icon: IconRef; active: IconRef }[] = [
  { name: 'index', href: '/', label: 'Découvrir', icon: mci('leaf'), active: mci('leaf') },
  { name: 'explorer', href: '/explorer', label: 'Explorer', icon: mci('binoculars'), active: mci('binoculars') },
  { name: 'quiz', href: '/quiz', label: 'Quiz', icon: mci('trophy-outline'), active: mci('trophy') },
  { name: 'carnet', href: '/carnet', label: 'Carnet', icon: mci('book-outline'), active: mci('book-open-variant') },
];

/** Version web : barre d’onglets flottante en verre dépoli. */
export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <FloatingBar>
          {TABS.map((t) => (
            <TabTrigger key={t.name} name={t.name} href={t.href} asChild>
              <TabButton label={t.label} icon={t.icon} activeIcon={t.active} />
            </TabTrigger>
          ))}
        </FloatingBar>
      </TabList>
    </Tabs>
  );
}

function FloatingBar(props: TabListProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <Glass style={[styles.bar, { borderColor: colors.borderStrong }]}>
        <View {...props} style={styles.row} />
      </Glass>
    </View>
  );
}

type TabButtonProps = TabTriggerSlotProps & { label: string; icon: IconRef; activeIcon: IconRef };

function TabButton({ label, icon, activeIcon, isFocused, ...props }: TabButtonProps) {
  const { colors } = useTheme();
  return (
    // Le type de `ref` fourni par TabTrigger ne correspond pas à celui de Pressable.
    <Pressable {...(props as PressableProps)} style={styles.item} accessibilityRole="tab" accessibilityState={{ selected: isFocused }}>
      <View style={[styles.pill, isFocused && { backgroundColor: colors.accentSoft }]}>
        <Icon icon={isFocused ? activeIcon : icon} size={22} color={isFocused ? colors.accent : colors.textSecondary} />
      </View>
      <Txt variant="caption" color={isFocused ? colors.accent : colors.textMuted}>
        {label}
      </Txt>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  bar: {
    width: '100%',
    maxWidth: MaxContentWidth - 120,
    borderRadius: Radius.xxl,
    borderWidth: StyleSheet.hairlineWidth,
  },
  row: { flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 6 },
  item: { flex: 1, alignItems: 'center', gap: 3 },
  pill: { paddingHorizontal: 18, paddingVertical: 4, borderRadius: Radius.pill },
});
