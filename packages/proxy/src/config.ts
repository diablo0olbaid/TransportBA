/** Configuración de upstreams del GCBA y TTLs de cache (§5). */
export const UPSTREAM_BASE = 'https://apitransporte.buenosaires.gob.ar';

/**
 * Rutas de los upstreams (§5). ⚠️ Los nombres han cambiado entre versiones de
 * la API; verificar contra la documentación oficial vigente. En este entorno el
 * dominio del GCBA está bloqueado por la política de red, así que no se pudieron
 * validar en vivo (ver docs/api-notes.md). El Worker cae a fixtures sin
 * credenciales.
 */
export const UPSTREAM = {
  subteForecast: '/subtes/forecastGTFS',
  subteAlerts: '/subtes/serviceAlerts',
  colectivosPositions: '/colectivos/vehiclePositions',
  colectivosPositionsSimple: '/colectivos/vehiclePositionsSimple',
  trenesPositions: '/trenes/vehiclePositions',
  ecobiciInformation: '/ecobici/gbfs/stationInformation',
  ecobiciStatus: '/ecobici/gbfs/stationStatus',
} as const;

/** TTL de cache por tipo de dato, en segundos (§5). */
export const TTL = {
  positions: 15,
  arrivals: 15,
  alerts: 60,
  stationInformation: 3600,
  stationStatus: 15,
} as const;

/** Timeout por upstream, en milisegundos (§5). */
export const UPSTREAM_TIMEOUT_MS = 8000;

/** Rate limit por IP (§5). */
export const RATE_LIMIT = { max: 60, windowMs: 60_000 } as const;
