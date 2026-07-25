import { describe, it, expect } from 'vitest';
import { normalizeText, fuzzyMatch, matchScore } from './text.js';

describe('lib/text', () => {
  it('normalizeText quita tildes y pasa a minúsculas', () => {
    expect(normalizeText('Perú')).toBe('peru');
    expect(normalizeText('Sáenz Peña')).toBe('saenz pena');
    expect(normalizeText('ÁNGEL')).toBe('angel');
  });

  it('fuzzyMatch ignora tildes y admite subsecuencias', () => {
    expect(fuzzyMatch('peru', 'Perú')).toBe(true);
    expect(fuzzyMatch('cong', 'Congreso de Tucumán')).toBe(true);
    expect(fuzzyMatch('xyz', 'Congreso')).toBe(false);
    expect(fuzzyMatch('', 'lo que sea')).toBe(true);
  });

  it('matchScore prioriza prefijo > substring > fuzzy', () => {
    expect(matchScore('cong', 'Congreso')).toBe(3);
    expect(matchScore('greso', 'Congreso')).toBe(2);
    expect(matchScore('cgo', 'Congreso')).toBe(1);
    expect(matchScore('zzz', 'Congreso')).toBe(0);
  });
});
