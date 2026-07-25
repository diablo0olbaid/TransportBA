import { useEffect, useRef, useState } from 'react';
import { easeInOutCubic } from '../lib/track.js';

export interface Positioned {
  id: string;
  coord: [number, number];
  bearing?: number;
}

export interface Interpolated<T> {
  item: T;
  coord: [number, number];
  bearing: number;
  /** 0..1 para fade-in de nuevos y fade-out de removidos (§10). */
  opacity: number;
}

const FADE_MS = 400;

interface Anim<T> {
  item: T;
  from: [number, number];
  to: [number, number];
  fromBearing: number;
  toBearing: number;
  startedAt: number;
  bornAt: number;
  removedAt: number | null;
}

function shortestAngle(from: number, to: number): number {
  let d = ((to - from + 540) % 360) - 180;
  if (d === -180) d = 180;
  return from + d;
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * Interpola posiciones entre updates con `requestAnimationFrame` y easing
 * cúbico sobre `updateIntervalMs` (§10). Fade-in de nuevos, fade-out de
 * removidos. Respeta `prefers-reduced-motion` (updates discretos).
 */
export function useInterpolatedPositions<T extends Positioned>(
  targets: T[],
  updateIntervalMs: number,
): Interpolated<T>[] {
  const animsRef = useRef<Map<string, Anim<T>>>(new Map());
  const [, forceRender] = useState(0);
  const reduced = prefersReducedMotion();

  // Reconciliar objetivos entrantes con el estado de animación.
  useEffect(() => {
    const now = performance.now();
    const anims = animsRef.current;
    const incoming = new Set(targets.map((t) => t.id));

    for (const t of targets) {
      const existing = anims.get(t.id);
      if (existing) {
        existing.from = currentCoord(existing, now, updateIntervalMs, reduced);
        existing.fromBearing = currentBearing(existing, now, updateIntervalMs, reduced);
        existing.to = t.coord;
        existing.toBearing = shortestAngle(existing.fromBearing, t.bearing ?? existing.toBearing);
        existing.item = t;
        existing.startedAt = now;
        existing.removedAt = null;
      } else {
        anims.set(t.id, {
          item: t,
          from: t.coord,
          to: t.coord,
          fromBearing: t.bearing ?? 0,
          toBearing: t.bearing ?? 0,
          startedAt: now,
          bornAt: now,
          removedAt: null,
        });
      }
    }
    // Marcar removidos para fade-out.
    for (const [id, anim] of anims) {
      if (!incoming.has(id) && anim.removedAt === null) anim.removedAt = now;
    }
  }, [targets, updateIntervalMs, reduced]);

  useEffect(() => {
    if (reduced) {
      forceRender((n) => n + 1);
      return;
    }
    let raf = 0;
    const loop = () => {
      const now = performance.now();
      const anims = animsRef.current;
      for (const [id, anim] of anims) {
        if (anim.removedAt !== null && now - anim.removedAt > FADE_MS) anims.delete(id);
      }
      forceRender((n) => n + 1);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [reduced]);

  const now = performance.now();
  const result: Interpolated<T>[] = [];
  for (const anim of animsRef.current.values()) {
    result.push({
      item: anim.item,
      coord: currentCoord(anim, now, updateIntervalMs, reduced),
      bearing: currentBearing(anim, now, updateIntervalMs, reduced),
      opacity: currentOpacity(anim, now),
    });
  }
  return result;
}

function progress(anim: Anim<unknown>, now: number, interval: number, reduced: boolean): number {
  if (reduced) return 1;
  return Math.min(1, (now - anim.startedAt) / interval);
}

function currentCoord<T>(
  anim: Anim<T>,
  now: number,
  interval: number,
  reduced: boolean,
): [number, number] {
  const t = easeInOutCubic(progress(anim, now, interval, reduced));
  return [
    anim.from[0] + (anim.to[0] - anim.from[0]) * t,
    anim.from[1] + (anim.to[1] - anim.from[1]) * t,
  ];
}

function currentBearing<T>(anim: Anim<T>, now: number, interval: number, reduced: boolean): number {
  const t = easeInOutCubic(progress(anim, now, interval, reduced));
  return (anim.fromBearing + (anim.toBearing - anim.fromBearing) * t + 360) % 360;
}

function currentOpacity(anim: Anim<unknown>, now: number): number {
  if (anim.removedAt !== null) return Math.max(0, 1 - (now - anim.removedAt) / FADE_MS);
  return Math.min(1, (now - anim.bornAt) / FADE_MS);
}
