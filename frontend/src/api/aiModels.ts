import { apiGet, apiPost, apiPut, apiDelete } from './client';

export interface AiModelDto {
  id: number;
  provider: string;
  model: string;
  url: string;
  apiKey: string;
  type: string;
  active: boolean;
  deployment: string | null;
  callOrder: number | null;
}

export interface CreateAiModelRequest {
  provider: string;
  model: string;
  url: string;
  apiKey: string;
  type: string;
  active: boolean;
  deployment: string | null;
  callOrder: number | null;
}

export interface UpdateAiModelRequest {
  provider: string;
  model: string;
  url: string;
  apiKey: string;
  type: string;
  active: boolean;
  deployment: string | null;
  callOrder: number | null;
}

export function listAiModels(): Promise<AiModelDto[]> {
  return apiGet<AiModelDto[]>('/ai-models');
}

export function getAiModel(id: number): Promise<AiModelDto> {
  return apiGet<AiModelDto>(`/ai-models/${id}`);
}

export function createAiModel(data: CreateAiModelRequest): Promise<AiModelDto> {
  return apiPost<AiModelDto>('/ai-models', data);
}

export function updateAiModel(id: number, data: UpdateAiModelRequest): Promise<AiModelDto> {
  return apiPut<AiModelDto>(`/ai-models/${id}`, data);
}

export function deleteAiModel(id: number): Promise<void> {
  return apiDelete(`/ai-models/${id}`);
}

export async function getModelResponseTimes(): Promise<Record<string, number>> {
  return apiGet<Record<string, number>>('/ai-models/response-times');
}
