/**
 * Generador de datos estáticos del subte + Premetro (M1, §7 del SPEC).
 *
 * Lee el GTFS estático oficial de SBASE (vendorizado en `scripts/gtfs/`, ver
 * `scripts/gtfs/SOURCE.md`) y produce `src/data/static/lines.json` tipado como
 * `TransitLine[]`.
 *
 * Fuente de verdad geográfica: el GTFS. NO se inventan coordenadas, orden ni
 * shapes (§7). Lo único que este script "corrige" son los diacríticos y el
 * casing de los NOMBRES de estación, que en el feed vienen inconsistentes
 * (ej. "Peru", "Constitucion", "angel Gallardo"), llevándolos a su forma
 * oficial con tildes vía `OFFICIAL_NAME` — que es justamente lo que pide el
 * §7 ("respetá tildes y nombres oficiales"). El mapa es auditable acá abajo.
 *
 * Ejecutar con: `pnpm --filter @ba-transit/web build:static`
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import type { LineId, Station, TransitLine } from '@ba-transit/shared';

const __dirname = dirname(fileURLToPath(import.meta.url));
const GTFS_DIR = join(__dirname, 'gtfs');
const OUT_FILE = join(__dirname, '..', 'src', 'data', 'static', 'lines.json');

// ---------------------------------------------------------------------------
// Parser CSV mínimo (RFC 4180): comillas, comas embebidas, CRLF y BOM.
// ---------------------------------------------------------------------------
type Row = Record<string, string>;

function parseCsv(text: string): Row[] {
  const clean = text.replace(/^\uFEFF/, '');
  const rows: string[][] = [];
  let field = '';
  let record: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < clean.length; i += 1) {
    const ch = clean[i];
    if (inQuotes) {
      if (ch === '"') {
        if (clean[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      record.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && clean[i + 1] === '\n') i += 1;
      record.push(field);
      field = '';
      if (record.length > 1 || record[0] !== '') rows.push(record);
      record = [];
    } else {
      field += ch;
    }
  }
  if (field !== '' || record.length > 0) {
    record.push(field);
    if (record.length > 1 || record[0] !== '') rows.push(record);
  }

  const header = rows.shift();
  if (!header) return [];
  return rows.map((cells) => {
    const obj: Row = {};
    header.forEach((key, idx) => {
      obj[key.trim()] = (cells[idx] ?? '').trim();
    });
    return obj;
  });
}

function readGtfs(name: string): Row[] {
  return parseCsv(readFileSync(join(GTFS_DIR, `${name}.txt`), 'utf8'));
}

// ---------------------------------------------------------------------------
// Metadata por línea. Los colores son los OFICIALES del §13 (los del GTFS no
// coinciden y el SPEC manda los suyos). El Premetro del feed viene partido en
// dos ramales (PM-Civico / PM-Savio); el tipo `TransitLine` tiene una sola
// traza y una lista de estaciones ordenada, así que se representa la línea 'P'
// con el ramal Cívico (Saguier → Centro Cívico), el troncal completo. Decisión
// documentada en el resumen de M1.
// ---------------------------------------------------------------------------
interface LineMeta {
  id: LineId;
  routeId: string;
  shortName: string;
  longName: string;
  color: string;
  textColor: string;
}

const LINE_META: LineMeta[] = [
  { id: 'A', routeId: 'LineaA', shortName: 'A', longName: 'Plaza de Mayo - San Pedrito', color: '#18CCCC', textColor: '#0B0E14' }, // prettier-ignore
  { id: 'B', routeId: 'LineaB', shortName: 'B', longName: 'Leandro N. Alem - Juan Manuel de Rosas', color: '#EB0909', textColor: '#FFFFFF' }, // prettier-ignore
  { id: 'C', routeId: 'LineaC', shortName: 'C', longName: 'Retiro - Constitución', color: '#2A7AC4', textColor: '#FFFFFF' }, // prettier-ignore
  { id: 'D', routeId: 'LineaD', shortName: 'D', longName: 'Catedral - Congreso de Tucumán', color: '#01823F', textColor: '#FFFFFF' }, // prettier-ignore
  { id: 'E', routeId: 'LineaE', shortName: 'E', longName: 'Retiro - Plaza de los Virreyes', color: '#6C2C8E', textColor: '#FFFFFF' }, // prettier-ignore
  { id: 'H', routeId: 'LineaH', shortName: 'H', longName: 'Facultad de Derecho - Hospitales', color: '#FFD800', textColor: '#0B0E14' }, // prettier-ignore
  { id: 'P', routeId: 'PM-Civico', shortName: 'P', longName: 'Premetro: Intendente Saguier - Centro Cívico', color: '#9CCB3B', textColor: '#0B0E14' }, // prettier-ignore
];

/**
 * Corrección de nombres del feed → forma oficial con tildes (§7). Sólo se
 * listan los que cambian; el resto del feed ya es correcto. No altera qué
 * estación es, sólo su ortografía.
 */
const OFFICIAL_NAME: Record<string, string> = {
  'Ana Diaz': 'Ana Díaz',
  'Ana Maria Janer': 'Ana María Janer',
  Bolivar: 'Bolívar',
  'Centro Civico': 'Centro Cívico',
  'Congreso de Tucuman': 'Congreso de Tucumán',
  Constitucion: 'Constitución',
  Cordoba: 'Córdoba',
  'De Los Incas - Parque Chas': 'De los Incas - Parque Chas',
  Echeverria: 'Echeverría',
  'Entre Rios': 'Entre Ríos',
  'Fernandez de la Cruz': 'Fernández de la Cruz',
  'General San Martin': 'General San Martín',
  'Humberto 1': 'Humberto I',
  Inclan: 'Inclán',
  'Jose Hernandez': 'José Hernández',
  'Jose Maria Moreno': 'José María Moreno',
  Larrazabal: 'Larrazábal',
  'Nicolas Descalzi': 'Nicolás Descalzi',
  'Ntra. Sra. de Fatima': 'Ntra. Sra. de Fátima',
  Peru: 'Perú',
  Pueyrredon: 'Pueyrredón',
  'Rio de Janeiro': 'Río de Janeiro',
  'Saenz Peña': 'Sáenz Peña',
  'San Jose': 'San José',
  'San Jose de Flores': 'San José de Flores',
  'Tronador - Villa Ortuzar': 'Tronador - Villa Ortúzar',
  'angel Gallardo': 'Ángel Gallardo',
};

const officialName = (raw: string): string => OFFICIAL_NAME[raw] ?? raw;

// ---------------------------------------------------------------------------
// Carga de tablas GTFS.
// ---------------------------------------------------------------------------
interface StopRow {
  id: string;
  name: string;
  lat: number;
  lon: number;
  locationType: string;
  parent: string;
  wheelchair: string;
}

function loadStops(): Map<string, StopRow> {
  const map = new Map<string, StopRow>();
  for (const r of readGtfs('stops')) {
    map.set(r.stop_id, {
      id: r.stop_id,
      name: r.stop_name,
      lat: Number(r.stop_lat),
      lon: Number(r.stop_lon),
      locationType: r.location_type,
      parent: r.parent_station,
      wheelchair: r.wheelchair_boarding,
    });
  }
  return map;
}

/** Estación física (location_type 1) a la que pertenece un stop cualquiera. */
function resolveStation(stopId: string, stops: Map<string, StopRow>): StopRow | null {
  const stop = stops.get(stopId);
  if (!stop) return null;
  if (stop.locationType === '1') return stop;
  if (stop.parent) return stops.get(stop.parent) ?? null;
  return stop;
}

// ---------------------------------------------------------------------------
// Orden de estaciones por posición a lo largo de la traza. Recolectar de ambos
// sentidos garantiza incluir las estaciones de paso alternado (ej. Pasco en A),
// y proyectar sobre el shape da un orden consistente e independiente del trip.
// ---------------------------------------------------------------------------
function metersBetween(a: [number, number], b: [number, number]): number {
  const midLat = ((a[1] + b[1]) / 2) * (Math.PI / 180);
  const dx = (b[0] - a[0]) * Math.cos(midLat) * 111320;
  const dy = (b[1] - a[1]) * 110540;
  return Math.hypot(dx, dy);
}

/** Distancia de un punto a un segmento y fracción `t` (0..1) del pie sobre él. */
function projectOntoSegment(
  p: [number, number],
  a: [number, number],
  b: [number, number],
): { dist: number; t: number } {
  const midLat = ((a[1] + b[1]) / 2) * (Math.PI / 180);
  const kx = Math.cos(midLat) * 111320;
  const ky = 110540;
  const ax = a[0] * kx;
  const ay = a[1] * ky;
  const bx = b[0] * kx;
  const by = b[1] * ky;
  const px = p[0] * kx;
  const py = p[1] * ky;
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
  const fx = ax + t * dx;
  const fy = ay + t * dy;
  return { dist: Math.hypot(px - fx, py - fy), t };
}

/** Distancia acumulada de cada estación proyectada sobre la traza. */
function alongShapeDistance(coord: [number, number], shape: [number, number][]): number {
  let best = Infinity;
  let along = 0;
  let cumulative = 0;
  for (let i = 0; i < shape.length - 1; i += 1) {
    const seg = metersBetween(shape[i]!, shape[i + 1]!);
    const { dist, t } = projectOntoSegment(coord, shape[i]!, shape[i + 1]!);
    if (dist < best) {
      best = dist;
      along = cumulative + t * seg;
    }
    cumulative += seg;
  }
  return along;
}

function main(): void {
  const stops = loadStops();
  const trips = readGtfs('trips');
  const stopTimes = readGtfs('stop_times');
  const shapes = readGtfs('shapes');
  const transfers = readGtfs('transfers');

  // stop_times agrupados y ordenados por trip.
  const timesByTrip = new Map<string, Row[]>();
  for (const st of stopTimes) {
    const arr = timesByTrip.get(st.trip_id) ?? [];
    arr.push(st);
    timesByTrip.set(st.trip_id, arr);
  }
  for (const arr of timesByTrip.values()) {
    arr.sort((a, b) => Number(a.stop_sequence) - Number(b.stop_sequence));
  }

  // shapes agrupados y ordenados.
  const ptsByShape = new Map<string, [number, number][]>();
  for (const s of shapes) {
    const arr = ptsByShape.get(s.shape_id) ?? [];
    arr.push([Number(s.shape_pt_lon), Number(s.shape_pt_lat)]);
    ptsByShape.set(s.shape_id, arr);
  }
  // (shapes.txt ya viene ordenado por secuencia; se preserva el orden de lectura.)

  // Miembros por línea: qué líneas sirven cada estación física (para transbordos).
  const routeOfTrip = new Map<string, string>();
  for (const t of trips) routeOfTrip.set(t.trip_id, t.route_id);
  const routeToLine = new Map<string, LineId>();
  for (const m of LINE_META) routeToLine.set(m.routeId, m.id);
  // El ramal Savio también aporta a la línea 'P'.
  routeToLine.set('PM-Savio', 'P');

  const stationLines = new Map<string, Set<LineId>>();
  for (const [tripId, times] of timesByTrip) {
    const routeId = routeOfTrip.get(tripId);
    if (!routeId) continue;
    const line = routeToLine.get(routeId);
    if (!line) continue;
    for (const st of times) {
      const station = resolveStation(st.stop_id, stops);
      if (!station) continue;
      const set = stationLines.get(station.id) ?? new Set<LineId>();
      set.add(line);
      stationLines.set(station.id, set);
    }
  }

  // Vecinos por transbordo (transfers.txt), a nivel estación física.
  const transferNeighbors = new Map<string, Set<string>>();
  for (const tr of transfers) {
    const from = resolveStation(tr.from_stop_id, stops);
    const to = resolveStation(tr.to_stop_id, stops);
    if (!from || !to || from.id === to.id) continue;
    const set = transferNeighbors.get(from.id) ?? new Set<string>();
    set.add(to.id);
    transferNeighbors.set(from.id, set);
  }

  // Hijos accesibles: una estación es accesible si algún andén (location_type 0)
  // tiene wheelchair_boarding == 1.
  const accessibleStation = new Set<string>();
  for (const stop of stops.values()) {
    if (stop.locationType === '0' && stop.wheelchair === '1' && stop.parent) {
      accessibleStation.add(stop.parent);
    }
  }

  const transfersFor = (stationId: string, ownLine: LineId): string[] => {
    const lines = new Set<string>();
    for (const other of stationLines.get(stationId) ?? []) {
      if (other !== ownLine) lines.add(other);
    }
    for (const neighbor of transferNeighbors.get(stationId) ?? []) {
      for (const other of stationLines.get(neighbor) ?? []) {
        if (other !== ownLine) lines.add(other);
      }
    }
    return [...lines].sort();
  };

  // Trip representativo por línea: dirección 0, el de más paradas.
  const representativeTrip = (routeId: string): { tripId: string; shapeId: string } | null => {
    let best: { tripId: string; shapeId: string; count: number } | null = null;
    for (const t of trips) {
      if (t.route_id !== routeId || t.direction_id !== '0') continue;
      const count = timesByTrip.get(t.trip_id)?.length ?? 0;
      if (!best || count > best.count) best = { tripId: t.trip_id, shapeId: t.shape_id, count };
    }
    return best ? { tripId: best.tripId, shapeId: best.shapeId } : null;
  };

  // Estaciones físicas por route_id, recolectadas de todos sus trips (ambos
  // sentidos) para no perder estaciones de paso alternado.
  const stationsByRoute = new Map<string, Set<string>>();
  for (const t of trips) {
    const set = stationsByRoute.get(t.route_id) ?? new Set<string>();
    for (const st of timesByTrip.get(t.trip_id) ?? []) {
      const station = resolveStation(st.stop_id, stops);
      if (station) set.add(station.id);
    }
    stationsByRoute.set(t.route_id, set);
  }

  const lines: TransitLine[] = LINE_META.map((meta) => {
    const rep = representativeTrip(meta.routeId);
    if (!rep) throw new Error(`Sin trip representativo para ${meta.routeId}`);

    const shape = ptsByShape.get(rep.shapeId) ?? [];
    if (shape.length === 0) throw new Error(`Sin shape ${rep.shapeId} para ${meta.routeId}`);

    const stationIds = [...(stationsByRoute.get(meta.routeId) ?? [])];
    const ordered = stationIds
      .map((id) => {
        const s = stops.get(id)!;
        return { s, along: alongShapeDistance([s.lon, s.lat], shape) };
      })
      .sort((a, b) => a.along - b.along);

    const stations: Station[] = ordered.map(({ s }, order) => ({
      id: s.id,
      name: officialName(s.name),
      lineId: meta.id,
      coord: [s.lon, s.lat],
      order,
      accessible: accessibleStation.has(s.id),
      transfers: transfersFor(s.id, meta.id),
    }));

    return {
      id: meta.id,
      mode: 'subte',
      shortName: meta.shortName,
      longName: meta.longName,
      color: meta.color,
      textColor: meta.textColor,
      stations,
      shape,
    };
  });

  writeFileSync(OUT_FILE, `${JSON.stringify(lines, null, 2)}\n`, 'utf8');

  // Resumen por consola.
  for (const l of lines) {
    console.log(
      `Línea ${l.id}: ${l.stations.length} estaciones, ${l.shape.length} puntos de traza`,
    );
  }
  console.log(`\n✓ Generado ${OUT_FILE}`);
}

main();
