import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { BUILD_ID, VERSION_URL } from '@/constants/release';
import { isNewer, parseVersion, type RemoteVersion } from '@/lib/update';

import { cleanupUpdates } from './install-update';

/** Seul l’APK Android compilé par le workflow se met à jour par ce biais. */
const CAN_UPDATE = Platform.OS === 'android' && BUILD_ID > 0;

/** Version plus récente publiée, ou `null` (vérifiée une fois au lancement). */
export function useAppUpdate(): RemoteVersion | null {
  const [remote, setRemote] = useState<RemoteVersion | null>(null);
  useEffect(() => {
    if (!CAN_UPDATE) return;
    cleanupUpdates(BUILD_ID);
    let alive = true;
    fetch(VERSION_URL, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((json: unknown) => {
        const version = parseVersion(json);
        if (alive && isNewer(version, BUILD_ID)) setRemote(version);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  return remote;
}
