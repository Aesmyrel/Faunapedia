import { useStore } from '@/store';

/** Le mode arachnophobie est-il activé ? */
export function useHideSpiders(): boolean {
  return useStore((s) => s.settings.hideSpiders === true);
}
