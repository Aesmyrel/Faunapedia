/** Numéro de compilation inscrit par le workflow GitHub (0 en développement). */
export const BUILD_ID = Number(process.env.EXPO_PUBLIC_BUILD_ID ?? 0);

/** Release GitHub où le workflow publie l’APK et son fichier de version. */
const RELEASE = 'https://github.com/Aesmyrel/Faunapedia/releases/download/android';
export const APK_URL = `${RELEASE}/Faunapedia.apk`;
export const VERSION_URL = `${RELEASE}/version.json`;
