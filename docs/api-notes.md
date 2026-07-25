# Notas de API y fuentes de datos

Registro de discrepancias entre el SPEC y la realidad de las APIs/fuentes, según pide el §5
("Si un endpoint devuelve 404, no inventes otro: registralo acá y avisáme").

## M1 · GTFS estático del subte — dominio del GCBA bloqueado por la red del entorno

**Fecha:** 2026-07-25.

El SPEC (§7) indica descargar el GTFS estático de subte del portal de datos abiertos del GCBA
(`data.buenosaires.gob.ar` / `cdn.buenosaires.gob.ar`). En este entorno de ejecución esos
dominios **están bloqueados por la política de red** (el proxy responde `403` al `CONNECT`;
diagnóstico vía `$HTTPS_PROXY/__agentproxy/status` → `connect_rejected` para
`cdn.buenosaires.gob.ar`). Lo mismo aplica a `apitransporte.buenosaires.gob.ar`, que hará
falta para M6.

**Resolución (aprobada por el usuario):** se usó la copia del **feed oficial de SBASE**
republicada por [Mobility Database](https://mobilitydatabase.org/) en su bucket público
`storage.googleapis.com/mdb-latest` (accesible desde el entorno):
`ar-buenos-aires-subterraneos-de-buenos-aires-subte-gtfs-6.zip`. El origen de los datos sigue
siendo el GTFS oficial de SBASE (feed version 2.0, publisher `GP-SBASE`); sólo cambió el punto
de descarga. Detalle en `packages/web/scripts/gtfs/SOURCE.md`.

**Pendiente para M6:** para consumir los feeds en vivo habrá que **habilitar
`apitransporte.buenosaires.gob.ar` en la política de red del environment** (además de tener las
credenciales del GCBA). Sin eso, el adapter `live` no podrá alcanzar el upstream y la app debe
caer a mock con aviso visible (§16, criterio de M6).

## M5 · Proxy — shapes de upstream no verificables

El dominio `apitransporte.buenosaires.gob.ar` está bloqueado por la política de red del entorno,
así que **no se pudieron validar en vivo los payloads del GCBA**. Consecuencias:

- **GTFS-RT** (colectivos/trenes `vehiclePositions`, `serviceAlerts`): el formato es el estándar
  GTFS-Realtime, así que el decoder (`gtfsrt.ts`) está implementado y testeado por
  roundtrip encode→decode. La ruta live queda lista para usarse con credenciales.
- **Ecobici GBFS** (`stationInformation` + `stationStatus`): GBFS es un estándar público; la
  mezcla (`ecobici.ts`) está implementada y testeada.
- **`subtes/forecastGTFS`** (JSON propietario del GCBA): **shape confirmado** contra la API real
  y conectado (`subteForecast.ts`). Formato: `{ Header, Entity: [{ Linea: { Trip_Id, Route_Id
("LineaA"…), Direction_ID, Estaciones: [{ stop_id ("1059N"), stop_name, arrival:{time,delay} }]
}}]}`. Los `stop_id` traen sufijo de andén (N/S/O/E) que se recorta para mapear a la estación.
  `/v1/subte/arrivals` y `/v1/subte/positions` (derivadas) devuelven datos reales con credenciales.

### Hallazgos con la API real (2026-07)

- **Colectivos** (`vehiclePositions`): el feed identifica las líneas con IDs internos numéricos
  (ej. `802`, `830`, `1738`), no con el número público de línea (7, 152…). Por eso el filtro por
  número común no matchea. La UI muestra **todos** los colectivos al prender la capa; el filtro por
  ID interno queda como opción.
- **Trenes** (`vehiclePositions`): el upstream responde **404** con estas credenciales (feed no
  disponible). El proxy devuelve lista vacía ("sin datos de trenes") en vez de error.

Sin credenciales, todas las rutas responden fixtures (modo mock del Worker, §5).

## Decisiones sobre los datos generados (§7)

- **Colores de línea:** se usan los oficiales del §13, no los del GTFS (que difieren).
- **Nombres de estación:** el feed trae varios sin tildes ("Peru", "Constitucion", "angel
  Gallardo"). Se corrigen a su forma oficial con tildes mediante un mapa curado y auditable en
  `build-static-data.ts` (`OFFICIAL_NAME`). No se alteran coordenadas, orden ni geometría.
- **Premetro:** el feed lo parte en dos ramales (`PM-Civico` / `PM-Savio`). Como
  `TransitLine` tiene una sola traza y lista de estaciones, la línea `P` se representa con el
  ramal Cívico (Intendente Saguier → Centro Cívico), el troncal completo. El ramal Savio
  queda fuera de la representación de M1.
- **Estaciones de paso alternado** (ej. Pasco/Alberti en la Línea A): se recolectan estaciones
  de ambos sentidos y se ordenan por proyección sobre la traza, para no perder ninguna.
