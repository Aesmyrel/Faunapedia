import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { isNewer, parseVersion, type RemoteVersion } from '@/lib/update';

/** Numéro de compilation inscrit par le workflow GitHub (0 en développement). */
export const BUILD_ID = Number(process.env.EXPO_PUBLIC_BUILD_ID ?? 0);

const RELEASE = 'https://github.com/Aesmyrel/Faunapedia/releases/download/android';
export const APK_URL = `${RELEASE}/Faunapedia.apk`;
const VERSION_URL = `${RELEASE}/version.json`;

/** Seul l’APK Android compilé par le workflow se met à jour par ce biais. */
const CAN_UPDATE = Platform.OS === 'android' && BUILD_ID > 0;

/** Version plus récente publiée, ou `null` (vérifiée une fois au lancement). */
export function useAppUpdate(): RemoteVersion | null {
  const [remote, setRemote] = useState<RemoteVersion | null>(null);
  useEffect(() => {
    if (!CAN_UPDATE) return;
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
