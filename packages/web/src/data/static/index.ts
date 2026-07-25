import type { LineId, Station, TransitLine } from '@ba-transit/shared';
import linesData from './lines.json';

/**
 * Datos estáticos del subte + Premetro generados desde el GTFS oficial de SBASE
 * por `scripts/build-static-data.ts` (§7). No editar `lines.json` a mano:
 * regenerar con `pnpm --filter @ba-transit/web build:static`.
 *
 * El JSON pierde la tipificación de tuplas (`[lon, lat]` → `number[]`) al
 * serializarse; la aserción restituye el tipo de dominio. El generador ya
 * garantiza la forma correcta.
 */
export const LINES: TransitLine[] = linesData as unknown as TransitLine[];

export const LINE_IDS = LINES.map((l) => l.id as LineId);

export function getLine(id: string): TransitLine | undefined {
  return LINES.find((l) => l.id === id);
}

/** Todas las estaciones de todas las líneas, aplanadas. */
export function getAllStations(): Station[] {
  return LINES.flatMap((l) => l.stations);
}

/** Bounding box aproximado de CABA `[minLon, minLat, maxLon, maxLat]`. */
export const CABA_BOUNDS: [number, number, number, number] = [-58.55, -34.72, -58.3, -34.52];
