/**
 * Generador de trazas de colectivos para el simulador de mocks (M3, §8).
 *
 * Lee `scripts/gtfs-colectivos/shapes.csv` (vendorizado, ver su SOURCE.md) y
 * produce `src/data/static/colectivo-lines.json`: 8 líneas reales de CABA con
 * su recorrido. Fuente de verdad geográfica: el GTFS oficial de colectivos.
 *
 * Ejecutar con: `pnpm --filter @ba-transit/web build:colectivos`
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CSV = join(__dirname, 'gtfs-colectivos', 'shapes.csv');
const OUT = join(__dirname, '..', 'src', 'data', 'static', 'colectivo-lines.json');

/** shape_id → etiqueta de línea (ver SOURCE.md). */
const SHAPE_TO_LINE: Record<string, string> = {
  '1': '7',
  '99': '152',
  '578': '111',
  '619': '68',
  '1418': '15',
  '1440': '29',
  '1452': '39',
  '1780': '5',
};

interface ColectivoLine {
  id: string;
  label: string;
  shape: [number, number][];
}

function main(): void {
  const text = readFileSync(CSV, 'utf8').replace(/^\uFEFF/, '');
  const lines = text.split(/\r?\n/).slice(1).filter(Boolean);

  const points = new Map<string, { seq: number; lon: number; lat: number }[]>();
  for (const row of lines) {
    const [shapeId, lat, lon, seq] = row.split(',');
    if (!shapeId || !SHAPE_TO_LINE[shapeId]) continue;
    const arr = points.get(shapeId) ?? [];
    arr.push({ seq: Number(seq), lon: Number(lon), lat: Number(lat) });
    points.set(shapeId, arr);
  }

  const result: ColectivoLine[] = [];
  for (const [shapeId, label] of Object.entries(SHAPE_TO_LINE)) {
    const pts = (points.get(shapeId) ?? []).sort((a, b) => a.seq - b.seq);
    if (pts.length < 2) throw new Error(`Shape ${shapeId} (línea ${label}) sin puntos`);
    result.push({
      id: `col-${label}`,
      label,
      shape: pts.map((p) => [p.lon, p.lat]),
    });
  }

  result.sort((a, b) => Number(a.label) - Number(b.label));
  writeFileSync(OUT, `${JSON.stringify(result, null, 2)}\n`, 'utf8');

  for (const l of result) console.log(`Línea ${l.label}: ${l.shape.length} puntos`);
  console.log(`\n✓ Generado ${OUT}`);
}

main();
