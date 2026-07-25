import type { BikeStation } from '@ba-transit/shared';
import { seededRandom } from '../../lib/rng.js';
import { buenosAiresHour } from '../../lib/time.js';

const STATION_COUNT = 120;
// Área operativa aproximada de Ecobici dentro de CABA.
const LON_MIN = -58.49;
const LON_MAX = -58.36;
const LAT_MIN = -34.66;
const LAT_MAX = -34.55;

const BARRIOS = [
  'Palermo',
  'Recoleta',
  'Belgrano',
  'Caballito',
  'Almagro',
  'Villa Crespo',
  'San Telmo',
  'Retiro',
  'Constitución',
  'Chacarita',
  'Colegiales',
  'Núñez',
  'Boedo',
  'Flores',
  'Parque Patricios',
];

interface StationBase {
  id: string;
  name: string;
  coord: [number, number];
  capacity: number;
  /** 0 = céntrica (más demanda de día), 1 = residencial. */
  residential: number;
}

let baseCache: StationBase[] | null = null;
let baseCacheSeed: number | null = null;

function stationBases(seed: number): StationBase[] {
  if (baseCache && baseCacheSeed === seed) return baseCache;
  const rand = seededRandom(seed, 'ecobici-base');
  const bases: StationBase[] = [];
  for (let i = 0; i < STATION_COUNT; i += 1) {
    const lon = LON_MIN + rand() * (LON_MAX - LON_MIN);
    const lat = LAT_MIN + rand() * (LAT_MAX - LAT_MIN);
    const barrio = BARRIOS[Math.floor(rand() * BARRIOS.length)]!;
    bases.push({
      id: `eco-${i}`,
      name: `${barrio} ${100 + i}`,
      coord: [lon, lat],
      capacity: 12 + Math.floor(rand() * 20),
      // Más al norte/este ≈ más céntrica → menos residencial.
      residential: rand(),
    });
  }
  baseCache = bases;
  baseCacheSeed = seed;
  return bases;
}

/** Estaciones de Ecobici con disponibilidad que varía según la hora (§8). */
export function simulateBikeStations(nowMs: number, seed: number): BikeStation[] {
  const bases = stationBases(seed);
  const hour = buenosAiresHour(nowMs);
  // Ocupación céntrica: alta de día (llegan al centro), baja de noche.
  const dayFactor = Math.max(0, Math.sin(((hour - 6) / 24) * 2 * Math.PI) * 0.5 + 0.5);

  return bases.map((b) => {
    const rand = seededRandom(seed, `eco-${b.id}-${Math.floor(nowMs / (2 * 60 * 1000))}`);
    // Estaciones céntricas se llenan de día; residenciales, de noche.
    const fillBias = b.residential > 0.5 ? 1 - dayFactor : dayFactor;
    const fill = Math.min(1, Math.max(0, fillBias * 0.7 + rand() * 0.3));
    const total = Math.round(fill * b.capacity);
    const ebikes = Math.round(total * (0.15 + rand() * 0.15));
    const bikes = Math.max(0, total - ebikes);
    return {
      id: b.id,
      name: b.name,
      coord: b.coord,
      bikesAvailable: bikes,
      ebikesAvailable: ebikes,
      docksAvailable: Math.max(0, b.capacity - total),
      capacity: b.capacity,
      isRenting: rand() > 0.03,
      isReturning: rand() > 0.02,
      lastReported: nowMs - Math.floor(rand() * 90) * 1000,
    };
  });
}
