# GTFS estático del subte (fuente de datos M1)

Estos archivos son el **GTFS estático oficial de SBASE** (Subterráneos de Buenos Aires),
usados para generar `src/data/static/lines.json` mediante `scripts/build-static-data.ts`.

## Procedencia

- **Publisher:** GP-SBASE — Subte de Buenos Aires (`agency.txt`, `feed_info.txt`).
- **Feed version:** 2.0.
- **Obtención:** copia hosteada por [Mobility Database](https://mobilitydatabase.org/)
  del feed oficial de SBASE, bucket público `mdb-latest`:
  `ar-buenos-aires-subterraneos-de-buenos-aires-subte-gtfs-6.zip`.

## Por qué un mirror y no el portal oficial

El portal de datos abiertos del GCBA (`data.buenosaires.gob.ar` / `cdn.buenosaires.gob.ar`)
está **bloqueado por la política de red de este entorno** (denegado en el CONNECT del proxy).
Mobility Database republica el feed oficial de SBASE y su bucket en `storage.googleapis.com`
sí es accesible, así que se usó esa copia. El origen de los datos sigue siendo el GTFS
oficial de SBASE; sólo cambió el punto de descarga. Decisión aprobada explícitamente.

Los archivos se versionan en el repo para que **regenerar los datos no dependa de la red**
(§7 del SPEC). Para actualizar el feed en el futuro, reemplazar estos `.txt` y correr
`pnpm --filter @ba-transit/web build:static`.

## Archivos incluidos

`agency.txt`, `feed_info.txt`, `routes.txt`, `trips.txt`, `stop_times.txt`, `stops.txt`,
`shapes.txt`, `transfers.txt`, `calendar.txt`.
