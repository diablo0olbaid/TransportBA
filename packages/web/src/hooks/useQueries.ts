import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type {
  Arrival,
  BikeStation,
  ServiceAlert,
  TrainPosition,
  VehiclePosition,
} from '@ba-transit/shared';
import { getAdapter } from '../data/adapter.js';
import { useTransitStore } from '../store/useTransitStore.js';

function useRefetchInterval(): number | false {
  return useTransitStore((s) => s.autoRefresh) ?? false;
}

export function useSubtePositionsQuery(): UseQueryResult<TrainPosition[]> {
  const refetchInterval = useRefetchInterval();
  return useQuery({
    queryKey: ['subte', 'positions'],
    queryFn: () => getAdapter().getSubtePositions(),
    refetchInterval,
  });
}

export function useAlertsQuery(): UseQueryResult<ServiceAlert[]> {
  const refetchInterval = useRefetchInterval();
  return useQuery({
    queryKey: ['alerts'],
    queryFn: () => getAdapter().getAlerts(),
    refetchInterval: refetchInterval === false ? false : Math.max(refetchInterval, 60000),
  });
}

export function useArrivalsQuery(stationId: string | null): UseQueryResult<Arrival[]> {
  const refetchInterval = useRefetchInterval();
  return useQuery({
    queryKey: ['arrivals', stationId],
    queryFn: () => getAdapter().getArrivals(stationId ?? undefined),
    enabled: stationId !== null,
    refetchInterval,
  });
}

export function useBikeStationsQuery(enabled: boolean): UseQueryResult<BikeStation[]> {
  const refetchInterval = useRefetchInterval();
  return useQuery({
    queryKey: ['ecobici'],
    queryFn: () => getAdapter().getBikeStations(),
    enabled,
    refetchInterval,
  });
}

export function useBusPositionsQuery(
  lineIds: string[],
  enabled: boolean,
): UseQueryResult<VehiclePosition[]> {
  const refetchInterval = useRefetchInterval();
  return useQuery({
    queryKey: ['colectivos', [...lineIds].sort()],
    queryFn: () => getAdapter().getBusPositions(lineIds),
    // Con la capa activa se piden todos (lista vacía = todas las líneas).
    enabled,
    refetchInterval,
  });
}

export function useTrainPositionsQuery(enabled: boolean): UseQueryResult<VehiclePosition[]> {
  const refetchInterval = useRefetchInterval();
  return useQuery({
    queryKey: ['trenes'],
    queryFn: () => getAdapter().getTrainPositions(),
    enabled,
    refetchInterval,
  });
}
