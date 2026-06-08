import { create } from 'zustand';
import axios from 'axios';
import type { UserDto } from '@/types';
import * as authApi from '@/api/auth';

interface AuthState {
  user: UserDto | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  version: string | null;
  setVersion: (v: string) => void;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkSession: (signal?: AbortSignal) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  version: null,
  isLoading: true,
  error: null,
  isAuthenticated: false,

  setVersion: (v) => set({ version: v }),

  login: async (username, password) => {
    set({ isLoading: true, error: null });
    try {
      const user = await authApi.login({ username, password });
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (err: unknown) {
      let message = 'An error occurred. Please try again.';
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        if (!err.response) {
          message = 'Unable to connect. Please check your connection.';
        } else if (status === 400 || status === 401 || status === 422) {
          message = 'Invalid username or password. Please try again.';
        }
      }
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    try {
      await authApi.logout();
    } finally {
      set({ user: null, isAuthenticated: false });
    }
  },

  checkSession: async (signal?: AbortSignal) => {
    const wasAuthenticated = get().isAuthenticated;
    if (!wasAuthenticated) set({ isLoading: true });
    try {
      const user = await authApi.me(signal);
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (err) {
      if (axios.isCancel(err)) return;
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));