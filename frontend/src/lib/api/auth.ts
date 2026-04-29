import apiClient from "./client";
import type { AuthToken, User } from "@/types";

export const authApi = {
  register: async (data: { username: string; email: string; password: string }): Promise<AuthToken> => {
    const res = await apiClient.post<AuthToken>("/api/auth/register", data);
    return res.data;
  },

  login: async (data: { email: string; password: string }): Promise<AuthToken> => {
    const res = await apiClient.post<AuthToken>("/api/auth/login", data);
    return res.data;
  },

  me: async (): Promise<User> => {
    const res = await apiClient.get<User>("/api/auth/me");
    return res.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post("/api/auth/logout");
  },
};