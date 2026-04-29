"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types";
import { STORAGE_KEYS } from "@/lib/constants";
import { useGenerationStore } from "@/store/generationStore";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setAuth: (user, token) => {
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEYS.TOKEN, token);
          localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
        }
        set({ user, token, isAuthenticated: true });
        useGenerationStore.getState().setUserContext(user.id);
      },

      clearAuth: () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem(STORAGE_KEYS.TOKEN);
          localStorage.removeItem(STORAGE_KEYS.USER);
        }
        set({ user: null, token: null, isAuthenticated: false });
        useGenerationStore.getState().setUserContext(null);
      },
    }),
    {
      name: "ai-studio-auth",
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
    }
  )
);
