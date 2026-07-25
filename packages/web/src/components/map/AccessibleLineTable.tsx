import { LINES } from '../../data/static/index.js';
import { useTransitStore } from '../../store/useTransitStore.js';

/**
 * Tabla alternativa accesible del mapa (§12): expone en texto, sólo para
 * lectores de pantalla, las estaciones de la(s) línea(s) seleccionada(s). Si no
 * hay selección, resume las líneas disponibles.
 */
export function AccessibleLineTable(): JSX.Element {
  const selectedLines = useTransitStore((s) => s.selectedLines);
  const lines = selectedLines.length ? LINES.filter((l) => selectedLines.includes(l.id)) : LINES;

  return (
    <div className="sr-only">
      <h2>Datos del mapa (tabla accesible)</h2>
      {selectedLines.length === 0 && (
        <p>Mostrando las {LINES.length} líneas. Seleccioná una línea para ver sus estaciones.</p>
      )}
      {lines.map((line) => (
        <table key={line.id}>
          <caption>
            Línea {line.shortName} — {line.longName}. {line.stations.length} estaciones.
          </caption>
          <thead>
            <tr>
              <th scope="col">Orden</th>
              <th scope="col">Estación</th>
              <th scope="col">Accesible</th>
              <th scope="col">Combinaciones</th>
            </tr>
          </thead>
          <tbody>
            {line.stations.map((s) => (
              <tr key={s.id}>
                <td>{s.order + 1}</td>
                <td>{s.name}</td>
                <td>{s.accessible ? 'Sí' : 'No'}</td>
                <td>{s.transfers.length ? s.transfers.join(', ') : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ))}
    </div>
  );
}
