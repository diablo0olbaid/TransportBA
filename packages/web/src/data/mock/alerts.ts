import type { ServiceAlert } from '@ba-transit/shared';
import { seededRandom } from '../../lib/rng.js';

const SUBTE_LINES = ['A', 'B', 'C', 'D', 'E', 'H', 'P'];

interface AlertTemplate {
  severity: ServiceAlert['severity'];
  mode: ServiceAlert['mode'];
  title: (line: string) => string;
  description: (line: string) => string;
  affects: (line: string) => string[];
}

const DELAY_TEMPLATE: AlertTemplate = {
  severity: 'warning',
  mode: 'subte',
  title: (l) => `Demoras en la Línea ${l}`,
  description: (l) =>
    `Servicio con demoras en la Línea ${l} por razones operativas. Se recomienda prever tiempo extra.`,
  affects: (l) => [l],
};

const OTHER_TEMPLATES: AlertTemplate[] = [
  {
    severity: 'info',
    mode: 'subte',
    title: (l) => `Servicio normal en la Línea ${l}`,
    description: (l) => `La Línea ${l} circula con normalidad en todo su recorrido.`,
    affects: (l) => [l],
  },
  {
    severity: 'severe',
    mode: 'subte',
    title: (l) => `Estación cerrada en la Línea ${l}`,
    description: (l) =>
      `Una estación de la Línea ${l} permanece cerrada por obras. Las formaciones no se detienen allí.`,
    affects: (l) => [l],
  },
  {
    severity: 'warning',
    mode: 'ecobici',
    title: () => 'Ecobici con disponibilidad reducida',
    description: () =>
      'Varias estaciones de Ecobici operan con disponibilidad reducida por redistribución de bicicletas.',
    affects: () => [],
  },
];

/**
 * Alertas de servicio activas en el instante `nowMs`, rotativas y deterministas.
 * Incluye demoras (~1–2 líneas) para que el estado "Demorado" aparezca (§8).
 */
export function activeAlerts(nowMs: number, seed: number): ServiceAlert[] {
  const bucket = Math.floor(nowMs / (5 * 60 * 1000)); // rota cada 5 min
  const rand = seededRandom(seed, `alerts-${bucket}`);
  const alerts: ServiceAlert[] = [];

  // 1–2 líneas demoradas.
  const delayedCount = 1 + (rand() < 0.5 ? 1 : 0);
  const shuffled = [...SUBTE_LINES].sort(() => rand() - 0.5);
  for (let i = 0; i < delayedCount; i += 1) {
    const line = shuffled[i]!;
    alerts.push(buildAlert(DELAY_TEMPLATE, line, `delay-${bucket}-${line}`, nowMs));
  }

  // Una alerta adicional variada.
  if (rand() < 0.6) {
    const tpl = OTHER_TEMPLATES[Math.floor(rand() * OTHER_TEMPLATES.length)]!;
    const line = shuffled[delayedCount] ?? 'D';
    alerts.push(buildAlert(tpl, line, `other-${bucket}`, nowMs));
  }

  return alerts;
}

function buildAlert(tpl: AlertTemplate, line: string, id: string, nowMs: number): ServiceAlert {
  return {
    id,
    mode: tpl.mode,
    affectedLines: tpl.affects(line),
    severity: tpl.severity,
    title: tpl.title(line),
    description: tpl.description(line),
    activeFrom: nowMs - 10 * 60 * 1000,
    activeUntil: null,
  };
}

/** Líneas con demora activa, derivadas de las alertas (§8, estado "Demorado"). */
export function delayedLinesFromAlerts(alerts: ServiceAlert[]): Set<string> {
  const set = new Set<string>();
  for (const a of alerts) {
    if (a.severity !== 'info' && a.mode === 'subte') {
      for (const l of a.affectedLines) set.add(l);
    }
  }
  return set;
}
