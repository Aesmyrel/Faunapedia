import { SPECIES } from '@/data';

import { formatCredit, formatLength, formatLifespan, formatNumber, formatWeight, frTypo, normalize } from '../format';
import { createSearch, editDistance } from '../search';

const search = createSearch(SPECIES);
const NNBSP = ' ';
const NBSP = ' ';

describe('format', () => {
  it('formate les nombres à la française', () => {
    expect(formatNumber(1234567)).toBe(`1${NNBSP}234${NNBSP}567`);
    expect(formatNumber(2.5)).toBe('2,5');
    expect(formatNumber(12.0)).toBe('12');
  });

  it('choisit des unités lisibles', () => {
    expect(formatLength([2400, 3000])).toBe(`24–30${NBSP}m`);
    expect(formatLength([0.75, 0.8])).toBe(`7,5–8${NBSP}mm`);
    expect(formatWeight([100000, 190000])).toBe(`100–190${NBSP}t`);
    expect(formatWeight([0.0017, 0.002])).toBe(`1,7–2${NBSP}g`);
    expect(formatLifespan([10, 14])).toBe(`10–14${NBSP}ans`);
    expect(formatLifespan([0.05, 0.1])).toMatch(/semaines/);
  });

  it('applique la typographie française', () => {
    expect(frTypo('Vrai ou faux ?')).toBe(`Vrai ou faux${NNBSP}?`);
    expect(frTypo("L'Aigle royal est une espèce d'oiseaux.")).toBe('L’Aigle royal est une espèce d’oiseaux.');
  });

  it('traduit les crédits photo en français', () => {
    expect(formatCredit('(c) Brian Gratwicke, some rights reserved (CC BY), uploaded by Brian Gratwicke')).toBe('© Brian Gratwicke · CC BY');
    expect(formatCredit('(c) seasav, some rights reserved (CC BY-NC-ND)', 'CC BY-NC-ND')).toBe('© seasav · CC BY-NC-ND');
    expect(formatCredit('no rights reserved, uploaded by Abhas Misraraj')).toBe('Abhas Misraraj · domaine public');
    expect(formatCredit('(c) Jo, all rights reserved')).toBe('© Jo');
    expect(formatCredit('© Boštjan Burger (Wikimedia Commons)', 'Public domain')).toBe('© Boštjan Burger (Wikimedia Commons) · domaine public');
  });

  it('normalise accents et apostrophes', () => {
    expect(normalize('Éléphant d’Asie')).toBe('elephant d asie');
  });
});

describe('recherche', () => {
  it('trouve par nom français, même sans accents', () => {
    expect(search('elephant')[0].group).toBe('mammals');
    expect(search('guepard')[0].id).toBe('guepard');
  });

  it('trouve par nom scientifique et nom alternatif', () => {
    expect(search('Panthera leo')[0].id).toBe('lion');
    expect(search('orignal')[0].id).toBe('elan');
  });

  it('tolère les fautes de frappe', () => {
    expect(search('axolot')[0].id).toBe('axolotl');
    expect(search('ornitorynque')[0].id).toBe('ornithorynque');
  });

  it('filtre par groupe et statut', () => {
    const res = search('', { groups: ['birds'], statuses: ['CR'] });
    expect(res.length).toBeGreaterThan(0);
    expect(res.every((s) => s.group === 'birds' && s.status === 'CR')).toBe(true);
  });

  it('calcule une distance d’édition bornée', () => {
    expect(editDistance('lion', 'lino', 2)).toBe(2);
    expect(editDistance('abc', 'abcdefgh', 2)).toBe(3);
  });
});
