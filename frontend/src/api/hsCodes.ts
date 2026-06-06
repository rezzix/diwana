import { apiGet } from './client';

export interface HsCodeDto {
  id: number;
  code: string;
  description: string;
  chapter: string;
}

let hsCodesCache: HsCodeDto[] | null = null;

export async function getHsCodes(signal?: AbortSignal): Promise<HsCodeDto[]> {
  if (hsCodesCache) return hsCodesCache;
  const data = await apiGet<HsCodeDto[]>('/hs-codes', undefined, signal);
  hsCodesCache = data;
  return data;
}