import { apiGet } from './client';

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  byRole: Record<string, number>;
}

export interface DeclarantStats {
  totalDeclarations: number;
  byStatus: Record<string, number>;
}

export interface ControllerStats {
  totalPending: number;
  byStatus: Record<string, number>;
  officeName: string | null;
}

export interface DashboardStats {
  role: string;
  adminStats: AdminStats | null;
  declarantStats: DeclarantStats | null;
  controllerStats: ControllerStats | null;
}

export async function getDashboardStats(signal?: AbortSignal): Promise<DashboardStats> {
  return apiGet<DashboardStats>('/dashboard', undefined, signal);
}