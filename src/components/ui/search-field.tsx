import { StyleSheet, TextInput, View } from 'react-native';

import { Fonts, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { Icon, mci } from './icon';
import { Tap } from './tap';

export interface SearchFieldProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

/** Champ de recherche arrondi avec bouton d’effacement. */
export function SearchField({ value, onChange, placeholder = 'Rechercher', autoFocus }: SearchFieldProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.field, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}>
      <Icon icon={mci('magnify')} size={20} color={colors.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        style={[styles.input, { color: colors.text }]}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
        clearButtonMode="never"
        autoFocus={autoFocus}
        accessibilityLabel={placeholder}
      />
      {value.length > 0 && (
        <Tap onPress={() => onChange('')} hitSlop={10} accessibilityLabel="Effacer" haptic="select">
          <Icon icon={mci('close-circle')} size={18} color={colors.textMuted} />
        </Tap>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    height: 48,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  input: { flex: 1, fontFamily: Fonts.medium, fontSize: 16, height: '100%', outlineWidth: 0 },
});
