import { useCallback, useEffect, useEffectEvent, useState } from 'react';

export interface Remote<T> {
  data: T | undefined;
  error: Error | undefined;
  loading: boolean;
  reload: () => void;
}

interface State<T> {
  key: string | null;
  nonce: number;
  data?: T;
  error?: Error;
}

/**
 * Charge une ressource distante ; `key` relance le chargement quand il change
 * (`null` = rien à charger). L’état « en cours » est dérivé, sans setState
 * synchrone dans l’effet.
 */
export function useRemote<T>(key: string | null, load: () => Promise<T>): Remote<T> {
  const [state, setState] = useState<State<T>>({ key: null, nonce: -1 });
  const [nonce, setNonce] = useState(0);
  const runLoad = useEffectEvent(load);

  useEffect(() => {
    if (key === null) return;
    let alive = true;
    runLoad()
      .then((data) => alive && setState({ key, nonce, data }))
      .catch((error: Error) => alive && setState({ key, nonce, error }));
    return () => {
      alive = false;
    };
  }, [key, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  if (key === null) return { data: undefined, error: undefined, loading: false, reload };
  const sameKey = state.key === key;
  const fresh = sameKey && state.nonce === nonce;
  return {
    // Lors d’un rechargement de la même ressource, on garde les données précédentes.
    data: sameKey ? state.data : undefined,
    error: fresh ? state.error : undefined,
    loading: !fresh,
    reload,
  };
}
