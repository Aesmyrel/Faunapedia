import { StyleSheet, View } from 'react-native';

import { alpha, Radius } from '@/constants/theme';
import { IUCN, IUCN_SCALE } from '@/data/reference';
import type { IucnStatus } from '@/data/types';
import { useTheme } from '@/hooks/use-theme';

import { Txt } from './text';

/** Pastille du statut UICN (code + libellé optionnel). */
export function StatusBadge({ status, label = false, small = false }: { status: IucnStatus; label?: boolean; small?: boolean }) {
  const info = IUCN[status];
  return (
    <View style={[styles.badge, small && styles.small, { backgroundColor: alpha(info.color, 0.18), borderColor: alpha(info.color, 0.55) }]}>
      <View style={[styles.dot, { backgroundColor: info.color }]} />
      <Txt variant={small ? 'caption' : 'smallStrong'} color={info.color}>
        {label ? info.label : status}
      </Txt>
    </View>
  );
}

/** Échelle complète de la Liste rouge, statut courant mis en avant. */
export function IucnScale({ status }: { status: IucnStatus }) {
  const { colors } = useTheme();
  const evaluated = IUCN_SCALE.includes(status);
  return (
    <View style={styles.scale}>
      {IUCN_SCALE.map((code) => {
        const active = code === status;
        const info = IUCN[code];
        return (
          <View key={code} style={styles.step}>
            <View
              style={[
                styles.segment,
                {
                  backgroundColor: active ? info.color : alpha(info.color, evaluated ? 0.22 : 0.12),
                  transform: [{ scaleY: active ? 1.35 : 1 }],
                },
              ]}
            />
            <Txt variant="caption" color={active ? info.color : colors.textMuted} style={active && styles.activeCode}>
              {code}
            </Txt>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  small: { paddingHorizontal: 7, paddingVertical: 3, gap: 4 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  scale: { flexDirection: 'row', gap: 4 },
  step: { flex: 1, alignItems: 'center', gap: 6 },
  segment: { height: 8, borderRadius: 4, alignSelf: 'stretch' },
  activeCode: { fontWeight: '700' },
});
