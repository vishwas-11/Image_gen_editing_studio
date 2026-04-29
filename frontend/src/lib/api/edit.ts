import apiClient from "./client";
import type {
  GenerationResponse, InpaintRequest, OutpaintRequest,
  RemoveBgRequest, Img2ImgRequest,
} from "@/types";

export const editApi = {
  inpaint: async (data: InpaintRequest): Promise<GenerationResponse> => {
    const res = await apiClient.post<GenerationResponse>("/api/edit/inpaint", data);
    return res.data;
  },

  outpaint: async (data: OutpaintRequest): Promise<GenerationResponse> => {
    const res = await apiClient.post<GenerationResponse>("/api/edit/outpaint", data);
    return res.data;
  },

  removeBg: async (data: RemoveBgRequest): Promise<GenerationResponse> => {
    const res = await apiClient.post<GenerationResponse>("/api/edit/remove-bg", data);
    return res.data;
  },

  img2img: async (data: Img2ImgRequest): Promise<GenerationResponse> => {
    const res = await apiClient.post<GenerationResponse>("/api/edit/img2img", data);
    return res.data;
  },

  styleTransfer: async (data: {
    source_image_url: string;
    style: string;
    prompt?: string;
    strength?: number;
  }): Promise<GenerationResponse> => {
    const res = await apiClient.post<GenerationResponse>("/api/edit/style-transfer", data);
    return res.data;
  },
};