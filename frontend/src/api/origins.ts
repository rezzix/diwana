import { apiGet } from './client';

export interface OriginDto {
  id: number;
  code: string;
  name: string;
}

let originsCache: OriginDto[] | null = null;

export async function getOrigins(signal?: AbortSignal): Promise<OriginDto[]> {
  if (originsCache) return originsCache;
  const data = await apiGet<OriginDto[]>('/origins', undefined, signal);
  originsCache = data;
  return data;
}