import axios from 'axios';
import type { ApiResponse, PaginatedResponse } from '@/types';

const client = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout: 600000, // 10 min — VLM calls can take minutes
});

export async function apiGet<T>(url: string, params?: Record<string, string | number>, signal?: AbortSignal): Promise<T> {
  const res = await client.get<ApiResponse<T>>(url, { params, signal });
  return res.data.data;
}

export async function apiPost<T>(url: string, data?: unknown, signal?: AbortSignal): Promise<T> {
  const res = await client.post<ApiResponse<T>>(url, data, { signal });
  return res.data.data;
}

export async function apiPut<T>(url: string, data?: unknown, signal?: AbortSignal): Promise<T> {
  const res = await client.put<ApiResponse<T>>(url, data, { signal });
  return res.data.data;
}

export async function apiDelete(url: string, signal?: AbortSignal): Promise<void> {
  await client.delete(url, { signal });
}

export async function apiGetPaginated<T>(url: string, params?: Record<string, string | number>, signal?: AbortSignal): Promise<PaginatedResponse<T>> {
  const res = await client.get<PaginatedResponse<T>>(url, { params, signal });
  return res.data;
}

export default client;