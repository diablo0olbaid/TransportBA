# BA Transit Live

Dashboard web de monitoreo en tiempo real del transporte público de la Ciudad de Buenos
Aires: subte + Premetro, colectivos, trenes metropolitanos y Ecobici sobre un mapa a pantalla
completa.

La especificación completa del proyecto vive en [`SPEC.md`](./SPEC.md) y es la fuente de
verdad. Se construye por milestones (M0 → M7).

## Arquitectura

Monorepo pnpm con tres paquetes:

| Paquete           | Rol                                                                    |
| ----------------- | ---------------------------------------------------------------------- |
| `packages/shared` | Tipos de dominio compartidos entre web y worker (§6).                  |
| `packages/proxy`  | Cloudflare Worker (Hono) que normaliza los feeds del GCBA a JSON (§5). |
| `packages/web`    | Frontend React + Vite + Tailwind (§9–§13).                             |

La API del GCBA no habilita CORS y exige credenciales, por eso **todo el tráfico pasa por el
proxy**, que además decodifica los feeds GTFS-Realtime a JSON tipado. La app es 100%
desarrollable sin credenciales gracias a una capa de mocks.

## Requisitos

- Node ≥ 20
- pnpm 10 (`corepack enable`)

## Puesta en marcha

```bash
pnpm install
pnpm dev        # levanta web (http://localhost:5173) + worker (http://localhost:8787) en paralelo
```

## Scripts

| Comando          | Descripción                           |
| ---------------- | ------------------------------------- |
| `pnpm dev`       | Web + worker en paralelo.             |
| `pnpm build`     | Build de todos los paquetes.          |
| `pnpm test`      | Tests (Vitest) de todos los paquetes. |
| `pnpm typecheck` | `tsc --noEmit` en todos los paquetes. |
| `pnpm lint`      | ESLint.                               |
| `pnpm format`    | Prettier `--write`.                   |

## Datos estáticos

Las 7 líneas (estaciones, orden, trazas, combinaciones) se generan desde el GTFS oficial de
SBASE, vendorizado en `packages/web/scripts/gtfs/` (ver `SOURCE.md` ahí y
[`docs/api-notes.md`](./docs/api-notes.md)). Para regenerar:

```bash
pnpm --filter @ba-transit/web build:static
```

El output (`packages/web/src/data/static/lines.json`) está versionado, así el build no depende
de la red. Las trazas de 8 líneas de colectivo (para el simulador de mocks) se generan aparte:

```bash
pnpm --filter @ba-transit/web build:colectivos
```

## Fuente de datos (mock / live)

La UI consume datos sólo a través de `data/adapter.ts`. La implementación se elige con
`VITE_DATA_SOURCE` (`mock` por defecto, `live` desde M6). El mock es determinista con
`VITE_MOCK_SEED`.

## Atajos de teclado

`/` buscar · `1–7` aislar línea (A–H, P) · `Esc` limpiar y cerrar panel · `L` capa colectivos ·
`?` ayuda. El estado (líneas, estación, capas, colectivos) se refleja en la URL y es
compartible/restaurable.

## Configuración

- **Web:** copiar `packages/web/.env.example` a `.env`. `VITE_DATA_SOURCE=mock` (default) no
  requiere proxy ni credenciales.
- **Proxy:** copiar `packages/proxy/.dev.vars.example` a `packages/proxy/.dev.vars`. Sin
  credenciales el worker opera en modo mock. Las credenciales reales del GCBA se cargan como
  secrets de Wrangler, nunca en el repo.

## Deploy

### Proxy (Cloudflare Workers)

```bash
cd packages/proxy
pnpm wrangler login
# Credenciales del GCBA como secrets (nunca en el repo):
pnpm wrangler secret put TRANSIT_CLIENT_ID
pnpm wrangler secret put TRANSIT_CLIENT_SECRET
# Origen permitido para CORS en producción:
pnpm wrangler deploy --var ALLOWED_ORIGIN:https://tu-dominio.com
```

Sin credenciales el Worker responde fixtures, así que se puede desplegar y probar igual.

### Web en Vercel + proxy en Cloudflare (recomendado)

Al ser un monorepo, la forma recomendada es apuntar el proyecto de Vercel a `packages/web`.
Config incluida en `packages/web/vercel.json` (framework Vite, output `dist`, rewrites SPA).
Pasos:

1. **Deploy del proxy en Cloudflare** (ver arriba). Anotá su URL, ej.
   `https://ba-transit-proxy.tu-cuenta.workers.dev`.
2. **Importá el repo en Vercel** y en **Settings → Build and Deployment → Root Directory** poné
   `packages/web` (dejá activado "Include files outside the root directory" para que instale el
   workspace). Framework Preset: Vite; Build/Output en default (los toma del vercel.json). Si
   Vercel no respeta pnpm 10, activá corepack con `ENABLE_EXPERIMENTAL_COREPACK=1`.
3. **Variables de entorno en Vercel** (Production), antes de buildear — Vite las inyecta en build:
   - `VITE_DATA_SOURCE=live`
   - `VITE_PROXY_URL=https://ba-transit-proxy.tu-cuenta.workers.dev`
4. **Deploy en Vercel** y anotá el dominio, ej. `https://tu-app.vercel.app`.
5. **CORS**: reconfigurá el Worker para permitir ese dominio y redesplegalo:
   `pnpm wrangler deploy --var ALLOWED_ORIGIN:https://tu-app.vercel.app`.
6. Redeploy en Vercel si cambiaste variables después del primer build.

Sin credenciales del GCBA en el Worker, la app igual funciona: el proxy sirve fixtures y la web
muestra el aviso de fuente de datos. Para modo 100% mock sin backend, poné `VITE_DATA_SOURCE=mock`
y omití el proxy.

### Web (otros hostings estáticos / Cloudflare Pages)

```bash
cd packages/web
# Apuntar al proxy desplegado y activar datos en vivo:
echo "VITE_DATA_SOURCE=live" > .env.production
echo "VITE_PROXY_URL=https://ba-transit-proxy.tu-cuenta.workers.dev" >> .env.production
pnpm --filter @ba-transit/web build   # genera dist/ en la raíz del repo
```

Servir `dist/` en cualquier hosting estático (Cloudflare Pages, Netlify, Vercel, S3+CDN). En
Cloudflare Pages: build command `pnpm --filter @ba-transit/web build`, output `dist`.

## Accesibilidad y performance

- Navegación completa por teclado, `aria-label` en los controles, focus rings visibles y una
  tabla alternativa `sr-only` con las estaciones de la línea seleccionada.
- Respeta `prefers-reduced-motion` (sin interpolación ni animaciones).
- Vehículos renderizados como capas GeoJSON de MapLibre (GPU), escalables a 300+ marcadores.

## Estado del proyecto

- [x] **M0 · Andamiaje** — monorepo, TS strict, ESLint/Prettier, Vitest, Tailwind con el
      sistema visual, `pnpm dev` levantando web + worker.
- [x] **M1 · Datos estáticos** — GTFS oficial de SBASE vendorizado, script generador
      (`build:static`), JSON tipado de las 7 líneas con estaciones ordenadas, shapes,
      combinaciones y accesibilidad. Test de invariantes (bbox CABA, orden, colores).
- [x] **M2 · Mapa base** — MapLibre + CARTO (dark-matter/positron por tema), trazas y
      estaciones de las 7 líneas, selección con atenuación y `fitBounds`, store Zustand,
      toggle de tema. Sin datos en vivo.
- [x] **M3 · Adapter + mocks** — interface del adapter (`data/adapter.ts`), simulador
      determinista (subte con frecuencia por franja horaria, arribos, alertas rotativas,
      Ecobici por hora, colectivos sobre 8 trazas reales) e interpolación suave de trenes
      (`useInterpolatedPositions`, §10). La app se ve viva sin credenciales.
- [x] **M4 · UI completa** — header (reloj AR, frescura, auto-refresh), sidebar (líneas con
      estado y conteo, capas, colectivos, buscador fuzzy), panel de 4 tabs (Estado/Estación/
      Formación/Métricas con Recharts), ticker de alertas, atajos de teclado, estado en la URL
      y responsive. TanStack Query con polling pausable. Todo contra mocks.
- [x] **M5 · Proxy** — Cloudflare Worker (Hono) con todas las rutas del §5, decode GTFS-RT,
      mezcla GBFS de Ecobici, cache con TTL, CORS, rate limit, health y fixtures. Tests del
      decoder, la derivación y las rutas. `curl localhost:8787/v1/health` responde.
- [x] **M6 · Live** — adapter live contra el proxy, switch por `VITE_DATA_SOURCE`, caída
      elegante a mock con aviso visible cuando el proxy no está o no tiene credenciales, y
      badge de dato desactualizado.
- [x] **M7 · Pulido** — accesibilidad (teclado, `aria-label`, focus rings, tabla `sr-only`),
      `prefers-reduced-motion`, capas GeoJSON escalables y README con instrucciones de deploy.
