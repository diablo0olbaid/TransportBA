import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { HealthResponse } from '@ba-transit/shared';

/**
 * Bindings del Worker. Las credenciales del GCBA llegan como secrets de
 * Wrangler; `ALLOWED_ORIGIN` viene de `[vars]` en wrangler.toml.
 *
 * En M0 el proxy es un andamiaje: solo expone `/v1/health`. El router
 * completo (§5: posiciones, arribos, alertas, ecobici, decode GTFS-RT, cache,
 * rate limit) se implementa en M5.
 */
export interface Env {
  TRANSIT_CLIENT_ID?: string;
  TRANSIT_CLIENT_SECRET?: string;
  ALLOWED_ORIGIN?: string;
}

export const app = new Hono<{ Bindings: Env }>();

app.use('/v1/*', (c, next) => {
  const origin = c.env?.ALLOWED_ORIGIN ?? 'http://localhost:5173';
  return cors({ origin, allowMethods: ['GET', 'OPTIONS'] })(c, next);
});

app.get('/v1/health', (c) => {
  const hasCredentials = Boolean(c.env?.TRANSIT_CLIENT_ID && c.env?.TRANSIT_CLIENT_SECRET);
  // Sin credenciales el proxy opera en modo mock (§5): sano, pero avisa que
  // los upstreams reales todavía no se consultan.
  const body: HealthResponse = {
    ok: true,
    upstreams: {
      mode: hasCredentials ? 'ok' : 'degraded',
    },
  };
  return c.json(body);
});

export default app;
