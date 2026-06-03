import axios from 'axios';
import type { ApiResponse, PaginatedResponse } from '@/types';

const client = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

export async function apiGet<T>(url: string, params?: Record<string, string | number>): Promise<T> {
  const res = await client.get<ApiResponse<T>>(url, { params });
  return res.data.data;
}

export async function apiPost<T>(url: string, data?: unknown): Promise<T> {
  const res = await client.post<ApiResponse<T>>(url, data);
  return res.data.data;
}

export async function apiPut<T>(url: string, data?: unknown): Promise<T> {
  const res = await client.put<ApiResponse<T>>(url, data);
  return res.data.data;
}

export async function apiDelete(url: string): Promise<void> {
  await client.delete(url);
}

export async function apiGetPaginated<T>(url: string, params?: Record<string, string | number>): Promise<PaginatedResponse<T>> {
  const res = await client.get<PaginatedResponse<T>>(url, { params });
  return res.data;
}

export default client;
