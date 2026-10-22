import { useDeferredValue, useMemo, useState } from 'react';
import { FlatList, Modal, Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Gutter } from '@/constants/theme';
import { SPECIES } from '@/data';
import type { Species } from '@/data/types';
import { useTheme } from '@/hooks/use-theme';
import { createSearch } from '@/lib/search';

import { IconButton } from '../ui/icon-button';
import { mci } from '../ui/icon';
import { SearchField } from '../ui/search-field';
import { Txt } from '../ui/text';
import { SpeciesCard } from './species-card';

const search = createSearch(SPECIES);

/** Sélecteur d’espèce plein écran avec recherche. */
export function SpeciesPicker({
  visible,
  title,
  exclude,
  onPick,
  onClose,
}: {
  visible: boolean;
  title: string;
  exclude?: string;
  onPick: (s: Species) => void;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const deferred = useDeferredValue(query);
  const results = useMemo(() => search(deferred, {}, deferred ? 'relevance' : 'popularity').filter((s) => s.id !== exclude), [deferred, exclude]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'} onRequestClose={onClose}>
      <View style={[styles.sheet, { backgroundColor: colors.background, paddingTop: Platform.OS === 'ios' ? 14 : insets.top + 8 }]}>
        <View style={styles.head}>
          <Txt variant="title" style={styles.flex}>
            {title}
          </Txt>
          <IconButton icon={mci('close')} onPress={onClose} label="Fermer" size={38} />
        </View>
        <View style={styles.search}>
          <SearchField value={query} onChange={setQuery} placeholder="Rechercher une espèce" autoFocus={Platform.OS !== 'web'} />
        </View>
        <FlatList
          data={results}
          keyExtractor={(s) => s.id}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <SpeciesCard
                species={item}
                variant="row"
                onPress={() => {
                  onPick(item);
                  setQuery('');
                }}
              />
            </View>
          )}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          initialNumToRender={14}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: Gutter, paddingBottom: 10 },
  flex: { flex: 1 },
  search: { paddingHorizontal: Gutter, paddingBottom: 10 },
  item: { paddingHorizontal: Gutter },
});
