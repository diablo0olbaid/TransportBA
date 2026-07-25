# Trazas de colectivos (mock, M3)

`shapes.csv` contiene las trazas (shapes GTFS) de **8 líneas reales de colectivo de CABA**,
usadas por el simulador de mocks para mover vehículos sobre recorridos reales (§8: "colectivos
sobre trazas reales de al menos 8 líneas").

## Procedencia

Extraídas del **GTFS estático oficial de colectivos del AMBA** (feed republicado en el
repositorio público [`GraffignaBracco/ELT_GTFS`](https://github.com/GraffignaBracco/ELT_GTFS),
`data/gtfs-static/`), accesible vía `raw.githubusercontent.com` desde este entorno. El portal
oficial del GCBA está bloqueado por la política de red (ver `docs/api-notes.md`).

Se tomó un shape representativo por línea:

| Línea | route_id | shape_id |
| ----- | -------- | -------- |
| 7     | 100      | 1        |
| 152   | 118      | 99       |
| 111   | 186      | 578      |
| 68    | 200      | 619      |
| 15    | 309      | 1418     |
| 29    | 320      | 1440     |
| 39    | 328      | 1452     |
| 5     | 48       | 1780     |

## Regenerar

`shapes.csv` está versionado, así el build no depende de la red. Para regenerar el JSON:

```bash
pnpm --filter @ba-transit/web build:colectivos
```

Genera `src/data/static/colectivo-lines.json`.
