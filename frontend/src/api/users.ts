import { apiGet, apiPost, apiDelete, apiGetPaginated } from './client';
import type { UserDto } from '@/types';

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'DECLARANT' | 'CONTROLLER';
  companyId?: number | null;
}

export async function listUsers(params?: Record<string, string | number>) {
  return apiGetPaginated<UserDto>('/users', params);
}

export async function getUser(id: number): Promise<UserDto> {
  return apiGet<UserDto>(`/users/${id}`);
}

export async function createUser(request: CreateUserRequest): Promise<UserDto> {
  return apiPost<UserDto>('/users', request);
}

export async function deactivateUser(id: number): Promise<void> {
  await apiDelete(`/users/${id}`);
}
