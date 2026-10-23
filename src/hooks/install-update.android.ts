import { Directory, File, Paths } from 'expo-file-system';
import { startActivityAsync } from 'expo-intent-launcher';

import { APK_URL } from '@/constants/release';

export type InstallStep = { phase: 'download'; progress: number } | { phase: 'install' };

/** `Intent.FLAG_GRANT_READ_URI_PERMISSION` : l’installateur doit pouvoir lire le fichier. */
const FLAG_GRANT_READ_URI_PERMISSION = 1;
const APK_MIME = 'application/vnd.android.package-archive';
const APK_NAME = /^Faunapedia-(\d+)\.apk$/;

/**
 * Télécharge l’APK dans le cache de l’application, puis ouvre la fenêtre
 * d’installation d’Android (que l’utilisateur confirme).
 */
export async function installUpdate(build: number, onStep: (step: InstallStep) => void): Promise<void> {
  const file = new File(Paths.cache, `Faunapedia-${build}.apk`);
  if (file.exists) file.delete();
  const task = File.createDownloadTask(APK_URL, file, {
    onProgress: ({ bytesWritten, totalBytes }) => onStep({ phase: 'download', progress: totalBytes > 0 ? bytesWritten / totalBytes : 0 }),
  });
  const apk = await task.downloadAsync();
  if (!apk) throw new Error('Téléchargement interrompu');
  onStep({ phase: 'install' });
  await startActivityAsync('android.intent.action.VIEW', { data: apk.contentUri, flags: FLAG_GRANT_READ_URI_PERMISSION, type: APK_MIME });
}

/** Supprime les APK des versions déjà installées. */
export function cleanupUpdates(currentBuild: number): void {
  try {
    for (const item of new Directory(Paths.cache).list()) {
      const match = item instanceof File ? APK_NAME.exec(item.name) : null;
      if (match && Number(match[1]) <= currentBuild) item.delete();
    }
  } catch {
    // Cache inaccessible : rien de grave, Android le videra de lui-même.
  }
}
