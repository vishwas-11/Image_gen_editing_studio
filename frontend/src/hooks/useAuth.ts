"use client";

import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api/auth";
import { ROUTES } from "@/lib/constants";
import { useAuthStore } from "@/store/authStore";

export function useAuth() {
  const router = useRouter();
  const { setAuth, clearAuth } = useAuthStore();

  const login = async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    setAuth(res.user, res.access_token);
    router.replace(ROUTES.STUDIO);
  };

  const register = async (username: string, email: string, password: string) => {
    const res = await authApi.register({ username, email, password });
    setAuth(res.user, res.access_token);
    router.replace(ROUTES.STUDIO);
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Logout should still complete locally even if the server token is expired.
    } finally {
      clearAuth();
      router.replace(ROUTES.LOGIN);
      router.refresh();
    }
  };

  return { login, register, logout };
}
