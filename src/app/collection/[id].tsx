import { useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';

import { SpeciesGrid } from '@/components/species/species-grid';
import { HeroHeader } from '@/components/ui/hero-header';
import { StackScreen } from '@/components/ui/stack-screen';
import { EmptyState } from '@/components/ui/states';
import { SPECIES } from '@/data';
import { COLLECTIONS } from '@/data/reference';

export default function CollectionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const collection = COLLECTIONS.find((c) => c.id === id);
  const members = useMemo(() => (collection ? SPECIES.filter(collection.filter) : []), [collection]);

  if (!collection) {
    return (
      <StackScreen>
        <EmptyState title="Collection introuvable" />
      </StackScreen>
    );
  }

  return (
    <StackScreen>
      <HeroHeader
        icon={collection.icon}
        color={collection.color}
        eyebrow={`${members.length} espèces · ${collection.subtitle}`}
        title={collection.title}
        description={collection.description}
      />
      <SpeciesGrid species={members} />
    </StackScreen>
  );
}
