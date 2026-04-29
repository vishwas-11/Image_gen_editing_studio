import apiClient from "./client";
import type { GenerateRequest, GenerationResponse, VariationRequest } from "@/types";

export const generateApi = {
  generate: async (data: GenerateRequest): Promise<GenerationResponse> => {
    const res = await apiClient.post<GenerationResponse>("/api/generate", data);
    return res.data;
  },

  generateBatch: async (data: GenerateRequest & { batch: number }): Promise<GenerationResponse> => {
    const res = await apiClient.post<GenerationResponse>("/api/generate/batch", data);
    return res.data;
  },

  generateVariations: async (data: VariationRequest): Promise<GenerationResponse> => {
    const res = await apiClient.post<GenerationResponse>("/api/generate/variations", data);
    return res.data;
  },

  getStyles: async (): Promise<Array<{ id: string; name: string; prompt_suffix: string }>> => {
    const res = await apiClient.get("/api/styles");
    return res.data;
  },
};