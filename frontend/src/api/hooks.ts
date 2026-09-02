import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from './client';
import { RoutePlanRequest } from '../types';

export const useDashboardSummary = () => {
  return useQuery({
    queryKey: ['dashboardSummary'],
    queryFn: api.getDashboardSummary,
    refetchInterval: 30000,
  });
};

export const useRoads = (filters?: any) => {
  return useQuery({
    queryKey: ['roads', filters],
    queryFn: () => api.getRoads(filters),
  });
};

export const useRoad = (id: number) => {
  return useQuery({
    queryKey: ['road', id],
    queryFn: () => api.getRoad(id),
    enabled: !!id,
  });
};

export const useIncidents = (filters?: any) => {
  return useQuery({
    queryKey: ['incidents', filters],
    queryFn: () => api.getIncidents(filters),
  });
};

export const useVehicles = () => {
  return useQuery({
    queryKey: ['vehicles'],
    queryFn: api.getVehicles,
    refetchInterval: 10000,
  });
};

export const useDeliveries = (filters?: any) => {
  return useQuery({
    queryKey: ['deliveries', filters],
    queryFn: () => api.getDeliveries(filters),
  });
};

export const useAlerts = () => {
  return useQuery({
    queryKey: ['alerts'],
    queryFn: api.getAlerts,
    refetchInterval: 15000,
  });
};

export const useEvents = (filters?: any) => {
  return useQuery({
    queryKey: ['events', filters],
    queryFn: () => api.getEvents(filters),
  });
};

export const useSystemHealth = () => {
  return useQuery({
    queryKey: ['systemHealth'],
    queryFn: api.getSystemHealth,
  });
};

export const useDataSources = () => {
  return useQuery({
    queryKey: ['dataSources'],
    queryFn: api.getDataSources,
  });
};

export const usePlanRoute = () => {
  return useMutation({
    mutationFn: (request: RoutePlanRequest) => api.planRoute(request),
  });
};

export const useVerifyIncident = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { status: string; notes?: string } }) =>
      api.verifyIncident(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
    },
  });
};

export const useAcknowledgeAlert = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.acknowledgeAlert(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
    },
  });
};
