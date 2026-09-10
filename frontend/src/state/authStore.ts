import { create } from "zustand";

import type { User } from "../types/user";

const TOKEN_STORAGE_KEY = "recipe-ai:token";

function readStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  setToken: (token: string) => void;
  login: (token: string, user: User) => void;
  logout: () => void;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: readStoredToken(),
  user: null,
  isAuthenticated: readStoredToken() !== null,
  setToken: (token) => {
    try {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } catch {
      // localStorage unavailable (private mode, etc.) - session still works in-memory
    }
    set({ token, isAuthenticated: true });
  },
  login: (token, user) => {
    try {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } catch {
      // localStorage unavailable (private mode, etc.) - session still works in-memory
    }
    set({ token, user, isAuthenticated: true });
  },
  logout: () => {
    try {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch {
      // ignore
    }
    set({ token: null, user: null, isAuthenticated: false });
  },
  setUser: (user) => set({ user }),
}));
