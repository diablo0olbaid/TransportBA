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
de la red.

## Configuración

- **Web:** copiar `packages/web/.env.example` a `.env`. `VITE_DATA_SOURCE=mock` (default) no
  requiere proxy ni credenciales.
- **Proxy:** copiar `packages/proxy/.dev.vars.example` a `packages/proxy/.dev.vars`. Sin
  credenciales el worker opera en modo mock. Las credenciales reales del GCBA se cargan como
  secrets de Wrangler, nunca en el repo.

## Estado del proyecto

- [x] **M0 · Andamiaje** — monorepo, TS strict, ESLint/Prettier, Vitest, Tailwind con el
      sistema visual, `pnpm dev` levantando web + worker.
- [x] **M1 · Datos estáticos** — GTFS oficial de SBASE vendorizado, script generador
      (`build:static`), JSON tipado de las 7 líneas con estaciones ordenadas, shapes,
      combinaciones y accesibilidad. Test de invariantes (bbox CABA, orden, colores).
- [ ] M2 · Mapa base
- [ ] M3 · Adapter + mocks
- [ ] M4 · UI completa
- [ ] M5 · Proxy
- [ ] M6 · Live
- [ ] M7 · Pulido
