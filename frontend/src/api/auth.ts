import { apiGet, apiPost } from './client';
import type { UserDto, LoginRequest, DevUserDto } from '@/types';

export async function login(request: LoginRequest): Promise<UserDto> {
  return apiPost<UserDto>('/auth/login', request);
}

export async function logout(): Promise<void> {
  await apiPost('/auth/logout');
}

export async function me(signal?: AbortSignal): Promise<UserDto> {
  return apiGet<UserDto>('/auth/me', undefined, signal);
}

export async function getDevUsers(signal?: AbortSignal): Promise<DevUserDto[]> {
  return apiGet<DevUserDto[]>('/auth/dev-users', undefined, signal);
}

export interface AuthConfig {
  relaxedAuth: boolean;
  mode: string;
}

export async function getAuthConfig(signal?: AbortSignal): Promise<AuthConfig> {
  return apiGet<AuthConfig>('/auth/config', undefined, signal);
}