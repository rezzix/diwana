import { apiGet, apiPut } from './client';

export interface JobConfigDto {
  id: number;
  name: string;
  enabled: boolean;
  lastRunAt: string | null;
}

export function listJobs(): Promise<JobConfigDto[]> {
  return apiGet<JobConfigDto[]>('/admin/jobs');
}

export function toggleJob(id: number): Promise<JobConfigDto> {
  return apiPut<JobConfigDto>(`/admin/jobs/${id}/toggle`);
}

export function updateJob(id: number, enabled: boolean): Promise<JobConfigDto> {
  return apiPut<JobConfigDto>(`/admin/jobs/${id}`, { enabled });
}
