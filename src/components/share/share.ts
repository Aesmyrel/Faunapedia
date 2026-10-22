import Constants from 'expo-constants';
import { Platform, Share } from 'react-native';

import { SPECIES } from '@/data';

/** Lien d’installation ou de présentation de l’application (`expo.extra.shareUrl` dans app.json). */
export const APP_URL: string | undefined = Constants.expoConfig?.extra?.shareUrl || undefined;

/** Lien sans protocole, pour l’affichage. */
export const APP_URL_LABEL = APP_URL?.replace(/^https?:\/\//, '').replace(/\/$/, '');

export const APP_SHARE_MESSAGE = `Faunapedia 🦉 — l’encyclopédie zoologique de poche : ${SPECIES.length} fiches de passionné, l’arbre du vivant complet et des quiz pour tous les niveaux. Gratuite, sans publicité ni compte.`;

export type ShareOutcome = 'shared' | 'dismissed' | 'copied' | 'failed';

export interface ShareInput {
  message: string;
  url?: string;
  title?: string;
}

/**
 * Ouvre la feuille de partage du système. iOS reçoit le lien à part (aperçu
 * enrichi), Android ne lit que le message ; sur un navigateur sans partage
 * natif, le texte est copié dans le presse-papiers.
 */
export async function shareContent({ message, url, title }: ShareInput): Promise<ShareOutcome> {
  const text = url && Platform.OS !== 'ios' ? `${message}\n${url}` : message;
  try {
    const result = await Share.share(Platform.OS === 'ios' ? { message, url, title } : { message: text, title }, {
      dialogTitle: title,
      subject: title,
    });
    return result?.action === Share.dismissedAction ? 'dismissed' : 'shared';
  } catch (error) {
    if ((error as Error | undefined)?.name === 'AbortError') return 'dismissed';
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(text);
        return 'copied';
      } catch {
        return 'failed';
      }
    }
    return 'failed';
  }
}

/** Partage l’application elle-même. */
export function shareApp(): Promise<ShareOutcome> {
  return shareContent({ message: APP_SHARE_MESSAGE, url: APP_URL, title: 'Faunapedia' });
}
