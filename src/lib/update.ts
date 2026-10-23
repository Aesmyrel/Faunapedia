/** Détection des nouvelles versions publiées (APK Android distribué hors Play Store). */

export interface RemoteVersion {
  /** Numéro de compilation, croissant à chaque publication. */
  build: number;
  /** Résumé des nouveautés (titre du dernier changement). */
  notes?: string;
  date?: string;
}

/** Lit le fichier `version.json` publié avec l’APK ; `null` s’il est illisible. */
export function parseVersion(json: unknown): RemoteVersion | null {
  if (!json || typeof json !== 'object') return null;
  const { build, notes, date } = json as Record<string, unknown>;
  const n = typeof build === 'string' ? Number(build) : build;
  if (typeof n !== 'number' || !Number.isInteger(n) || n <= 0) return null;
  return {
    build: n,
    notes: typeof notes === 'string' && notes.trim() ? notes.trim() : undefined,
    date: typeof date === 'string' ? date : undefined,
  };
}

/** Vrai si la version publiée est plus récente que celle installée (0 = version de développement). */
export function isNewer(remote: RemoteVersion | null, current: number): remote is RemoteVersion {
  return remote !== null && current > 0 && remote.build > current;
}
