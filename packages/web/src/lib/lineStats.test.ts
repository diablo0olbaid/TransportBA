import { describe, it, expect } from 'vitest';
import type { ServiceAlert, TrainPosition } from '@ba-transit/shared';
import { computeLineStats, STATUS_LABEL } from './lineStats.js';

function train(lineId: string, id: string): TrainPosition {
  return {
    id,
    lineId,
    coord: [-58.4, -34.6],
    bearing: 0,
    direction: 0,
    nextStationId: null,
    progress: 0,
    status: 'moving',
    source: 'realtime',
    timestamp: 0,
  };
}

function alert(lineId: string, severity: ServiceAlert['severity']): ServiceAlert {
  return {
    id: `a-${lineId}`,
    mode: 'subte',
    affectedLines: [lineId],
    severity,
    title: 't',
    description: 'd',
    activeFrom: 0,
    activeUntil: null,
  };
}

describe('computeLineStats', () => {
  it('cuenta formaciones por línea', () => {
    const stats = computeLineStats(['A', 'B'], [train('A', '1'), train('A', '2')], []);
    expect(stats.A!.count).toBe(2);
    expect(stats.B!.count).toBe(0);
  });

  it('con formaciones y sin alerta → normal', () => {
    const stats = computeLineStats(['A'], [train('A', '1')], []);
    expect(stats.A!.status).toBe('normal');
  });

  it('sin formaciones ni alerta → unknown', () => {
    const stats = computeLineStats(['A'], [], []);
    expect(stats.A!.status).toBe('unknown');
  });

  it('alerta warning → delayed; severe → partial', () => {
    const warn = computeLineStats(['A'], [train('A', '1')], [alert('A', 'warning')]);
    expect(warn.A!.status).toBe('delayed');
    const severe = computeLineStats(['A'], [train('A', '1')], [alert('A', 'severe')]);
    expect(severe.A!.status).toBe('partial');
  });

  it('STATUS_LABEL en español', () => {
    expect(STATUS_LABEL.delayed).toBe('Demorado');
  });
});
