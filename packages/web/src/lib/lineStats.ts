import type { ServiceAlert, ServiceStatus, TrainPosition } from '@ba-transit/shared';

export interface LineStat {
  count: number;
  status: ServiceStatus;
}

function statusFromAlerts(lineId: string, alerts: ServiceAlert[]): ServiceStatus | null {
  let worst: ServiceStatus | null = null;
  for (const a of alerts) {
    if (a.mode !== 'subte' || !a.affectedLines.includes(lineId)) continue;
    if (a.severity === 'severe') return 'partial';
    if (a.severity === 'warning') worst = 'delayed';
  }
  return worst;
}

/**
 * Formaciones activas y estado de servicio por línea. El estado sale de las
 * alertas (§8/§11); si no hay formaciones ni alerta, se considera `unknown`
 * (p. ej. horario nocturno).
 */
export function computeLineStats(
  lineIds: string[],
  positions: TrainPosition[],
  alerts: ServiceAlert[],
): Record<string, LineStat> {
  const counts = new Map<string, number>();
  for (const p of positions) counts.set(p.lineId, (counts.get(p.lineId) ?? 0) + 1);

  const out: Record<string, LineStat> = {};
  for (const id of lineIds) {
    const count = counts.get(id) ?? 0;
    const alertStatus = statusFromAlerts(id, alerts);
    out[id] = { count, status: alertStatus ?? (count > 0 ? 'normal' : 'unknown') };
  }
  return out;
}

export const STATUS_LABEL: Record<ServiceStatus, string> = {
  normal: 'Normal',
  delayed: 'Demorado',
  partial: 'Servicio parcial',
  interrupted: 'Interrumpido',
  unknown: 'Sin datos',
};
