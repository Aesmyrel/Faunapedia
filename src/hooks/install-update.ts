import { Linking } from 'react-native';

import { APK_URL } from '@/constants/release';

export type InstallStep = { phase: 'download'; progress: number } | { phase: 'install' };

/** Hors Android, aucune installation intégrée : on ouvre simplement le lien de l’APK. */
export async function installUpdate(build: number, onStep: (step: InstallStep) => void): Promise<void> {
  void build;
  void onStep;
  await Linking.openURL(APK_URL);
}

export function cleanupUpdates(currentBuild: number): void {
  void currentBuild;
}
