import { isNewer, parseVersion } from '../update';

describe('mises à jour', () => {
  it('lit le fichier de version publié', () => {
    expect(parseVersion({ build: 12, notes: ' Corrige les quiz ', date: '2026-10-23T08:00:00Z' })).toEqual({
      build: 12,
      notes: 'Corrige les quiz',
      date: '2026-10-23T08:00:00Z',
    });
    expect(parseVersion({ build: '7' })?.build).toBe(7);
  });

  it('ignore un fichier invalide', () => {
    expect(parseVersion(null)).toBeNull();
    expect(parseVersion('build 3')).toBeNull();
    expect(parseVersion({ build: -1 })).toBeNull();
    expect(parseVersion({ build: 2.5 })).toBeNull();
  });

  it('ne propose que des versions plus récentes, jamais en développement', () => {
    expect(isNewer({ build: 5 }, 4)).toBe(true);
    expect(isNewer({ build: 4 }, 4)).toBe(false);
    expect(isNewer({ build: 3 }, 4)).toBe(false);
    expect(isNewer({ build: 5 }, 0)).toBe(false);
    expect(isNewer(null, 4)).toBe(false);
  });
});
