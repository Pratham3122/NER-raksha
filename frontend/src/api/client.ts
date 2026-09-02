import axios from 'axios';
import {
  DashboardSummary,
  Road,
  Incident,
  Vehicle,
  Delivery,
  Alert,
  OperationalEvent,
  SystemHealth,
  DataSource,
  RoutePlanRequest,
  RoutePlanResponse,
  Paginated,
} from '../types';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    // You can add auth tokens here if needed
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const api = {
  getDashboardSummary: () =>
    apiClient.get<DashboardSummary>('/dashboard/summary').then((res) => res.data),

  getRoads: (filters?: any) =>
    apiClient.get<Paginated<Road>>('/roads', { params: filters }).then((res) => res.data),

  getRoad: (id: number) => apiClient.get<Road>(`/roads/${id}`).then((res) => res.data),

  getIncidents: (filters?: any) =>
    apiClient.get<Paginated<Incident>>('/incidents', { params: filters }).then((res) => res.data),

  createIncident: (data: Partial<Incident>) =>
    apiClient.post<Incident>('/incidents', data).then((res) => res.data),

  verifyIncident: (id: string, data: { status: string; notes?: string }) =>
    apiClient.post<Incident>(`/incidents/${id}/verify`, data).then((res) => res.data),

  getVehicles: () => apiClient.get<Vehicle[]>('/vehicles').then((res) => res.data),

  getDeliveries: (filters?: any) =>
    apiClient.get<Paginated<Delivery>>('/deliveries', { params: filters }).then((res) => res.data),

  getAlerts: () => apiClient.get<Alert[]>('/alerts').then((res) => res.data),

  acknowledgeAlert: (id: string) =>
    apiClient.post<Alert>(`/alerts/${id}/acknowledge`).then((res) => res.data),

  planRoute: (request: RoutePlanRequest) =>
    apiClient.post<RoutePlanResponse>('/routing/plan', request).then((res) => res.data),

  getEvents: (filters?: any) =>
    apiClient.get<Paginated<OperationalEvent>>('/events', { params: filters }).then((res) => res.data),

  getSystemHealth: () =>
    apiClient.get<SystemHealth>('/health/system').then((res) => res.data),

  getDataSources: () =>
    apiClient.get<DataSource[]>('/health/sources').then((res) => res.data),
};

export default api;
