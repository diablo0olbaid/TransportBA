# BA Transit Live — Especificación de construcción

> **Instrucciones para Claude Code:** este documento es la fuente de verdad del proyecto.
> Leelo entero antes de escribir código. Ejecutá los milestones **en orden**, uno por vez,
> y frená al final de cada uno para que yo revise. No adelantes trabajo de milestones
> posteriores. Si algo de este spec choca con la realidad (un endpoint que no existe, una
> librería deprecada), **paráme y avisáme en vez de improvisar una alternativa silenciosa**.

---

## 1. Qué estamos construyendo

Un dashboard web de monitoreo en tiempo real del transporte público de la Ciudad de Buenos
Aires. Mapa a pantalla completa con:

- Las 6 líneas de subte + Premetro, seleccionables individualmente.
- Formaciones de subte moviéndose en vivo, interpoladas suavemente entre updates.
- Colectivos en vivo, filtrables por línea.
- Trenes metropolitanos (Mitre, Sarmiento, Roca, San Martín, Belgrano Sur, Urquiza).
- Estaciones de Ecobici con disponibilidad de bicis y anclajes.
- Alertas de servicio, arribos por estación y métricas operativas.

El target visual y de calidad es **producto de operaciones profesional** (Citymapper cruzado
con Datadog), no prototipo. Densidad de información alta, cero elementos decorativos vacíos.

---

## 2. Restricciones técnicas que definen la arquitectura

Estas son las razones por las que el proyecto tiene la forma que tiene. No las cambies sin
avisar.

1. **La API del GCBA no habilita CORS** y exige `client_id` + `client_secret` como query
   params. No se puede llamar desde el browser: rompería por CORS y expondría el secret.
   → **Todo el tráfico pasa por un proxy propio.**
2. **Varios feeds son GTFS-Realtime en protobuf**, no JSON. Hay que decodificarlos.
   El decode se hace **en el proxy**, no en el cliente: el browser recibe siempre JSON limpio
   y tipado.
3. **Las credenciales tardan días en aprobarse.** La app tiene que ser 100% desarrollable y
   demostrable sin ellas → capa de mocks realistas desde el día uno, activable por flag.
4. **Los feeds actualizan cada ~30s**, pero la UI tiene que verse fluida. → interpolación de
   posiciones en el cliente, nunca marcadores que saltan.

---

## 3. Stack

| Capa | Elección | Por qué |
|---|---|---|
| Monorepo | pnpm workspaces | dos paquetes, sin overhead de Turborepo |
| Frontend | React 18 + TypeScript **strict** + Vite | |
| Estilos | Tailwind CSS | |
| Mapa | MapLibre GL JS via `react-map-gl/maplibre` | sin API key, sin vendor lock |
| Tiles | CARTO `dark-matter-gl-style` / `positron-gl-style` | gratis, sin token, dos temas |
| Estado servidor | TanStack Query v5 | refetch, stale, retry, dedupe resueltos |
| Estado UI | Zustand | selección de líneas, capas, panel abierto |
| Charts | Recharts | |
| Iconos | lucide-react | |
| Proxy | Cloudflare Workers + Hono | edge, gratis, deploy en un comando |
| GTFS-RT | `gtfs-realtime-bindings` | decode en el Worker |
| Tests | Vitest + Testing Library + MSW | |
| Lint | ESLint + Prettier | |

**Prohibido:** `any` sin comentario justificando, `fetch` directo desde un componente,
librerías de UI genéricas (MUI, Chakra, shadcn) — el diseño es propio.

---

## 4. Estructura del repo

```
ba-transit-live/
├─ SPEC.md
├─ README.md
├─ pnpm-workspace.yaml
├─ packages/
│  ├─ shared/                    # tipos compartidos web ↔ worker
│  │  └─ src/types.ts
│  ├─ proxy/                     # Cloudflare Worker
│  │  ├─ src/index.ts            # router Hono
│  │  ├─ src/upstream.ts         # fetch a GCBA + inyección de credenciales
│  │  ├─ src/gtfsrt.ts           # decode protobuf → JSON tipado
│  │  ├─ src/cache.ts            # Cache API, TTL por endpoint
│  │  ├─ wrangler.toml
│  │  └─ .dev.vars.example
│  └─ web/
│     ├─ src/
│     │  ├─ main.tsx
│     │  ├─ App.tsx
│     │  ├─ data/
│     │  │  ├─ adapter.ts        # ÚNICA superficie de datos para la UI
│     │  │  ├─ live/             # implementación contra el proxy
│     │  │  ├─ mock/             # simulador
│     │  │  └─ static/           # líneas, estaciones, polylines
│     │  ├─ store/               # zustand
│     │  ├─ hooks/
│     │  ├─ components/
│     │  │  ├─ map/
│     │  │  ├─ sidebar/
│     │  │  ├─ detail/
│     │  │  └─ ui/               # primitivas propias
│     │  └─ lib/                 # geo, time, format
│     └─ .env.example
```

---

## 5. El proxy (packages/proxy)

### Contrato

Expone endpoints REST que devuelven **siempre JSON normalizado**, nunca el payload crudo del
GCBA. El cliente no sabe que existe GTFS-RT.

```
GET /v1/subte/positions      → TrainPosition[]
GET /v1/subte/arrivals       → Arrival[]        (todas las estaciones)
GET /v1/subte/alerts         → ServiceAlert[]
GET /v1/colectivos/positions?lines=7,29,152  → VehiclePosition[]
GET /v1/trenes/positions     → VehiclePosition[]
GET /v1/ecobici/stations     → BikeStation[]   (information + status ya mergeados)
GET /v1/health               → { ok, upstreams: Record<string, 'ok'|'degraded'|'down'> }
```

### Upstreams del GCBA

Base: `https://apitransporte.buenosaires.gob.ar`

| Ruta | Formato | Notas |
|---|---|---|
| `/subtes/forecastGTFS` | JSON | arribos por estación |
| `/subtes/serviceAlerts` | GTFS-RT | alertas |
| `/colectivos/vehiclePositionsSimple` | JSON | posiciones simplificadas |
| `/colectivos/vehiclePositions` | GTFS-RT | posiciones completas |
| `/colectivos/serviceAlerts` | GTFS-RT | |
| `/trenes/vehiclePositions` | GTFS-RT | |
| `/trenes/forecastGTFS` | JSON | |
| `/ecobici/gbfs/stationInformation` | JSON GBFS | estático-ish, TTL largo |
| `/ecobici/gbfs/stationStatus` | JSON GBFS | disponibilidad |

> ⚠️ **Verificá estos paths contra la documentación oficial vigente antes de implementar.**
> Los nombres han cambiado entre versiones de la API. Si un endpoint devuelve 404, no
> inventes otro: registralo en `docs/api-notes.md` y avisáme.
>
> Subte **no expone posiciones de vehículos** en algunas versiones de la API. Si es el caso:
> derivá las posiciones de las formaciones a partir de `forecastGTFS` (interpolando entre la
> estación anterior y la próxima según los tiempos de arribo) e implementalo en
> `packages/proxy/src/derive/subtePositions.ts`. Documentá que es una estimación y marcá
> cada `TrainPosition` con `source: 'derived'` para que la UI lo pueda indicar.

### Reglas del proxy

- Credenciales desde `env.TRANSIT_CLIENT_ID` / `env.TRANSIT_CLIENT_SECRET`
  (secrets de Wrangler). **Nunca en el repo.**
- CORS: `Access-Control-Allow-Origin` desde `env.ALLOWED_ORIGIN`, no `*`.
- Cache con la Cache API del Worker: TTL 15s para posiciones y arribos, 60s para alertas,
  1h para `stationInformation`.
- Timeout de 8s por upstream. Si vence: devolvé el último valor cacheado con
  `X-Data-Stale: true`, y si no hay cache, `503` con body `{ error, upstream }`.
- Rate limiting básico por IP (60 req/min) para no quemar la cuota del GCBA.
- Modo mock del propio Worker: si no hay credenciales configuradas, respondé con fixtures
  para que `pnpm dev` funcione sin setup.

---

## 6. Modelo de dominio (packages/shared)

Definí estos tipos primero. Todo lo demás se construye sobre ellos.

```ts
export type LineId = 'A'|'B'|'C'|'D'|'E'|'H'|'P';
export type Mode = 'subte'|'colectivo'|'tren'|'ecobici';
export type ServiceStatus = 'normal'|'delayed'|'partial'|'interrupted'|'unknown';

export interface TransitLine {
  id: string; mode: Mode; shortName: string; longName: string;
  color: string; textColor: string;
  stations: Station[]; shape: [number, number][]; // [lon, lat]
}

export interface Station {
  id: string; name: string; lineId: string;
  coord: [number, number];
  order: number;
  accessible: boolean;
  transfers: string[];        // ids de otras líneas
}

export interface TrainPosition {
  id: string; lineId: string;
  coord: [number, number];
  bearing: number;            // grados, 0 = norte
  direction: 0 | 1;           // sentido según GTFS
  nextStationId: string | null;
  progress: number;           // 0..1 entre estación previa y próxima
  status: 'moving'|'at_station'|'unknown';
  source: 'realtime'|'derived';
  timestamp: number;          // epoch ms
}

export interface Arrival {
  stationId: string; lineId: string; direction: 0|1;
  destination: string;
  etaSeconds: number;
  tripId: string | null;
  isEstimate: boolean;
}

export interface ServiceAlert {
  id: string; mode: Mode; affectedLines: string[];
  severity: 'info'|'warning'|'severe';
  title: string; description: string;
  activeFrom: number; activeUntil: number | null;
}

export interface VehiclePosition {
  id: string; mode: Mode; lineId: string; lineLabel: string;
  coord: [number, number]; bearing: number | null;
  speedKmh: number | null; timestamp: number;
}

export interface BikeStation {
  id: string; name: string; coord: [number, number];
  bikesAvailable: number; ebikesAvailable: number;
  docksAvailable: number; capacity: number;
  isRenting: boolean; isReturning: boolean; lastReported: number;
}

export type FeedState<T> =
  | { status: 'loading' }
  | { status: 'ready'; data: T; fetchedAt: number; stale: boolean }
  | { status: 'error'; error: string; lastGood?: { data: T; fetchedAt: number } };
```

---

## 7. Datos estáticos (packages/web/src/data/static)

Necesito las **6 líneas de subte + Premetro** con datos reales:

- Colores oficiales exactos:
  `A #18CCCC` · `B #EB0909` · `C #2A7AC4` · `D #01823F` · `E #6C2C8E` · `H #FFD800` ·
  `Premetro #9CCB3B`
- Todas las estaciones de cada línea, en orden, con coordenadas y nombre correcto
  (respetá tildes y nombres oficiales: "Plaza de Mayo", "Catedral", "Perú", "Piedras",
  "Lima", "Sáenz Peña", "Congreso", …).
- La polyline del recorrido de cada línea.
- Combinaciones marcadas correctamente (ej. 9 de Julio ↔ Diagonal Norte ↔ Carlos Pellegrini).

**Cómo conseguirlos:** descargá el GTFS estático de subte del portal de datos abiertos del
GCBA y generá los archivos con un script en `packages/web/scripts/build-static-data.ts`
(`stops.txt`, `shapes.txt`, `routes.txt`, `trips.txt` → JSON tipado). Dejá el script
versionado y el output generado también, así el build no depende de la red.

**No inventes coordenadas a mano.** Si el GTFS no está disponible, paráme.

---

## 8. La capa adapter (packages/web/src/data/adapter.ts)

Es la **única** superficie de datos que consume la UI. Firma:

```ts
export interface TransitAdapter {
  getLines(): Promise<TransitLine[]>;
  getSubtePositions(): Promise<TrainPosition[]>;
  getArrivals(stationId?: string): Promise<Arrival[]>;
  getAlerts(): Promise<ServiceAlert[]>;
  getBusPositions(lineIds: string[]): Promise<VehiclePosition[]>;
  getTrainPositions(): Promise<VehiclePosition[]>;
  getBikeStations(): Promise<BikeStation[]>;
}
```

Se elige la implementación con `VITE_DATA_SOURCE=mock|live` (default `mock`).
Ningún componente importa `live/` ni `mock/` directamente.

### El simulador de mocks tiene que ser bueno

No sirven datos random. Requisitos:

- Formaciones que recorren la polyline real de su línea, terminal a terminal, y dan la vuelta.
- Frecuencia por línea y por franja horaria (pico 3 min, valle 7 min, nocturno n/a).
- Tiempo de detención en estación (~25s) y velocidad variable entre tramos.
- Un 5% de las corridas con demora inyectada, para que los estados "Demorado" aparezcan.
- Alertas de servicio rotativas plausibles en español.
- Ecobici con disponibilidad que varía según hora del día.
- Colectivos sobre trazas reales de al menos 8 líneas.
- **Determinismo opcional:** semilla fija vía `VITE_MOCK_SEED` para tests reproducibles.

---

## 9. UI

### Layout

```
┌────────────────────────────────────────────────────────────┐
│ HEADER 56px — logo · reloj AR · live dot · refresh · tema  │
├──────────┬─────────────────────────────────┬───────────────┤
│ SIDEBAR  │                                 │  PANEL        │
│ 320px    │           MAPA                  │  400px        │
│          │                                 │  (slide-in)   │
├──────────┴─────────────────────────────────┴───────────────┤
│ TICKER 36px — alertas de servicio en marquesina            │
└────────────────────────────────────────────────────────────┘
```

### Header
- Reloj en vivo `America/Argentina/Buenos_Aires`, formato `HH:mm:ss`, `tabular-nums`.
- Indicador de frescura: punto verde con `animate-pulse` + "hace 8 s". Pasa a ámbar >90s,
  rojo >180s.
- Selector de auto-refresh: 15s / 30s / 60s / manual.
- Toggle de tema oscuro/claro que también cambia el basemap de CARTO.

### Sidebar
- **Líneas de subte:** fila por línea con círculo del color oficial + letra, nombre,
  chip de estado, contador de formaciones activas. Click aísla la línea, cmd/ctrl+click
  agrega a la selección.
- **Capas:** switches para Subte / Colectivos / Trenes / Ecobici.
- **Colectivos:** input de líneas (chips agregables, ej. `7`, `29`, `152`).
- **Buscador:** autocomplete sobre estaciones de todas las líneas, con fuzzy match que
  ignore tildes. Enter selecciona y hace flyTo.
- Colapsable a 56px (solo iconos).

### Mapa
- `fitBounds` inicial sobre CABA.
- **Trenes:** marcadores con la interpolación descrita en §10. Rotan según `bearing`.
  Los `source: 'derived'` se dibujan con borde punteado y el tooltip lo aclara.
- **Estaciones:** círculos escalados por zoom. Las de combinación con doble anillo.
- **Trazas:** línea de 4px con el color oficial. Al seleccionar una línea, las demás bajan
  a `opacity: 0.12` y el mapa hace `fitBounds` a la seleccionada con padding.
- **Colectivos:** marcadores más chicos, color derivado del hash del número de línea.
- **Ecobici:** círculos con relleno proporcional a `bikesAvailable / capacity`.
- **Clustering** de Ecobici y colectivos con `supercluster` por debajo de zoom 13.
- Click en tren → panel de formación. Click en estación → panel de estación.
- Hover en estación → tooltip con los 2 próximos arribos por sentido.

### Panel derecho (tabs)
1. **Estado** — las 7 líneas con semáforo, alertas activas expandibles, última actualización
   por feed.
2. **Estación** — nombre, línea, accesibilidad, combinaciones, tabla de arribos por sentido
   con cuenta regresiva viva en segundos que decrementa localmente entre fetches.
3. **Formación** — id, línea, sentido, próxima estación, ETA, velocidad, origen del dato.
4. **Métricas** — frecuencia promedio por línea últimos 60 min (sparklines Recharts),
   formaciones en circulación por línea (barras), heatmap de puntualidad por franja horaria,
   contadores con count-up animado.

### Ticker
Marquesina con las alertas activas, pausada en hover, oculta si no hay ninguna.
Usá una animación CSS con `transform`, no `left`.

---

## 10. Movimiento e interpolación (esto define si se ve pro o no)

- Los feeds llegan cada 15–30s. **Jamás** teletransportar un marcador.
- Implementá `useInterpolatedPositions(positions, updateInterval)`:
  guardá posición previa y objetivo, y animá con `requestAnimationFrame` usando easing
  `easeInOutCubic` sobre la duración del intervalo.
- Si un tren aparece nuevo, fade-in. Si desaparece, fade-out de 400ms antes de removerlo.
- Los marcadores se posicionan con `transform: translate3d()` para forzar compositing en GPU.
- Con >300 marcadores en pantalla, usá una capa de MapLibre (`symbol` layer con GeoJSON
  source y `setData`) en vez de marcadores DOM. Medí y decidí; documentá el umbral elegido.
- Respetá `prefers-reduced-motion`: sin interpolación, updates discretos.

---

## 11. Resiliencia

- Cada feed es independiente. Si Ecobici falla, el subte sigue andando.
- Estado degradado por capa: chip en el sidebar `Ecobici no disponible · Reintentar`.
- TanStack Query con `retry: 3`, backoff exponencial, `staleTime` acorde al TTL del proxy.
- Si el fetch falla pero hay dato previo, mostrá el previo con badge de "desactualizado" —
  nunca pantalla vacía.
- Error boundary por panel, no global. Un crash del panel de métricas no tumba el mapa.
- Pausar todos los polls cuando `document.hidden === true`; reanudar con refetch inmediato.

---

## 12. Detalles de calidad

- **Skeleton loaders con shimmer**, nunca spinners.
- Timestamps relativos en español rioplatense: `hace 12 s`, `hace 3 min`, `hace 1 h`.
- Todos los números en `tabular-nums`.
- Atajos: `/` buscar · `1-6` aislar línea · `Esc` limpiar selección y cerrar panel ·
  `L` toggle capas · `?` modal de atajos.
- Accesibilidad: navegación completa por teclado, `aria-label` en todos los controles,
  focus rings visibles, contraste AA. El mapa tiene una tabla alternativa accesible
  (`sr-only`) con los datos de la línea seleccionada.
- Responsive: <768px el sidebar es un bottom sheet arrastrable con snap points
  (colapsado / medio / completo) y el panel derecho pasa a full screen.
- URL como estado: `?lines=A,D&station=estacion-id&layers=subte,ecobici` — compartible y
  restaurable al recargar.

---

## 13. Sistema visual

**Oscuro (default)**
```
bg-base      #0B0E14
bg-surface   #141922
bg-elevated  #1B212C
border       #232A36
text-primary #E6EAF2
text-muted   #8B95A7
accent-ok    #34D399
accent-warn  #FBBF24
accent-bad   #F87171
```
**Claro:** `#FAFBFC` / `#FFFFFF` / `#E6E9EF` / `#0F1520` / `#5C6678`.

- Los colores de línea son los **únicos** acentos saturados. Todo lo demás neutro.
- Tipografía Inter (variable, self-hosted vía `@fontsource-variable/inter`).
  Headings con `letter-spacing: -0.02em`.
- Radios: 12px cards, 8px controles, 6px chips.
- Sombras muy sutiles: `0 1px 2px rgba(0,0,0,.4)`. Nada de glows ni glassmorphism.
- Espaciado en múltiplos de 4px. Densidad alta pero con aire.
- Todo el texto de la UI en **español de Argentina**.

---

## 14. Tests

- Unitarios: interpolación geográfica, cálculo de bearing, formateo de tiempo relativo,
  parseo de GTFS-RT, derivación de posiciones de subte.
- Componentes: sidebar (selección de líneas), panel de arribos (countdown), estados
  degradados.
- MSW para simular respuestas del proxy, incluyendo `503` y timeouts.
- Un smoke test que monte la app completa con el adapter mock y verifique que renderiza
  mapa + sidebar sin errores de consola.
- Cobertura objetivo en `lib/` y `data/`: 80%.

---

## 15. Milestones — ejecutá en este orden y frená al final de cada uno

**M0 · Andamiaje**
Monorepo pnpm, los 3 paquetes, TS strict, ESLint/Prettier, Vitest, Tailwind con el sistema
visual del §13, `pnpm dev` levantando web + worker en paralelo.
*Listo cuando:* `pnpm dev` abre una página vacía estilada y `pnpm test` corre en verde.

**M1 · Datos estáticos**
Script de generación desde GTFS, JSONs de las 7 líneas con estaciones y shapes, tipos en
`shared`.
*Listo cuando:* un test verifica que las 7 líneas tienen ≥1 estación, coordenadas dentro del
bounding box de CABA y orden consistente.

**M2 · Mapa base**
MapLibre + CARTO, trazas de las líneas, estaciones, selección de línea con atenuación y
`fitBounds`. Todavía sin datos en vivo.
*Listo cuando:* puedo hacer click en cada línea y el mapa responde correctamente.

**M3 · Adapter + mocks**
Interface del adapter, simulador completo del §8, trenes moviéndose con interpolación del §10.
*Listo cuando:* la app se ve "viva" sin ninguna credencial ni el proxy corriendo.

**M4 · UI completa**
Sidebar, panel de 4 tabs, header, ticker, buscador, atajos, URL state, responsive.
Todo contra mocks.
*Listo cuando:* la app está feature-complete con datos simulados.

**M5 · Proxy**
Worker con Hono, todas las rutas del §5, decode GTFS-RT, cache, CORS, rate limit, health,
fixtures. Tests del decoder.
*Listo cuando:* `curl localhost:8787/v1/health` responde y todas las rutas devuelven JSON
válido con fixtures.

**M6 · Live**
Implementación live del adapter, switch por env var, estados degradados, badges de dato
desactualizado.
*Listo cuando:* con `VITE_DATA_SOURCE=live` y credenciales, la app muestra datos reales;
sin credenciales, cae elegante a mock con aviso visible.

**M7 · Pulido**
Accesibilidad, `prefers-reduced-motion`, performance (60fps con 300+ marcadores),
Lighthouse ≥90, README con instrucciones de deploy.

---

## 16. Cómo quiero que trabajes

- Un commit por unidad lógica, mensajes en español, formato convencional
  (`feat:`, `fix:`, `chore:`).
- Antes de cada milestone: decime brevemente el plan. Después: qué construiste y qué
  decisiones tomaste que no estaban en el spec.
- Si una librería o endpoint no funciona como el spec asume, **paráme y preguntá**.
  No sustituyas silenciosamente.
- Escribí el test junto con el código, no después.
- Nada de `TODO` ni funciones stub en código que declares terminado.
- El `README.md` se actualiza al cerrar cada milestone.
