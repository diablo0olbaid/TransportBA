/** Normaliza texto para búsqueda: minúsculas y sin tildes/diacríticos (§9). */
export function normalizeText(input: string): string {
  return input.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

/**
 * Fuzzy match tolerante a tildes: `true` si todos los caracteres de `query`
 * aparecen en orden dentro de `target` (subsecuencia). Ignora acentos.
 */
export function fuzzyMatch(query: string, target: string): boolean {
  const q = normalizeText(query);
  if (q === '') return true;
  const t = normalizeText(target);
  let qi = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti += 1) {
    if (t[ti] === q[qi]) qi += 1;
  }
  return qi === q.length;
}

/** Puntaje simple para ordenar resultados: prefijo > substring > fuzzy. */
export function matchScore(query: string, target: string): number {
  const q = normalizeText(query);
  const t = normalizeText(target);
  if (q === '') return 0;
  if (t.startsWith(q)) return 3;
  if (t.includes(q)) return 2;
  return fuzzyMatch(query, target) ? 1 : 0;
}
