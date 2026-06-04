import { apiGet } from './client';

export interface OriginDto {
  id: number;
  code: string;
  name: string;
}

let originsCache: OriginDto[] | null = null;

export async function getOrigins(): Promise<OriginDto[]> {
  if (originsCache) return originsCache;
  const data = await apiGet<OriginDto[]>('/origins');
  originsCache = data;
  return data;
}
