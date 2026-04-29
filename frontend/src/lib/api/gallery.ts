import apiClient from "./client";
import type {
  ImageRecord, ImageListResponse, GalleryFilters,
  UploadResponse, Collection, PromptTemplate,
  RandomPromptResponse, PromptEnhanceResponse,
  PromptHistoryItem,
} from "@/types";

// ─── Gallery ──────────────────────────────────────────────────────────────

export const galleryApi = {
  list: async (filters: GalleryFilters = {}): Promise<ImageListResponse> => {
    const res = await apiClient.get<ImageListResponse>("/api/gallery", { params: filters });
    return res.data;
  },

  get: async (id: string): Promise<ImageRecord> => {
    const res = await apiClient.get<ImageRecord>(`/api/gallery/${id}`);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/gallery/${id}`);
  },

  toggleFavorite: async (id: string): Promise<{ id: string; is_favorite: boolean }> => {
    const res = await apiClient.post(`/api/gallery/${id}/favorite`);
    return res.data;
  },

  setTags: async (id: string, tags: string[]): Promise<ImageRecord> => {
    const res = await apiClient.post<ImageRecord>(`/api/gallery/${id}/tags`, { tags });
    return res.data;
  },

  download: async (id: string, format: string, resolution: string): Promise<Blob> => {
    const res = await apiClient.get(`/api/gallery/${id}/download`, {
      params: { format, resolution },
      responseType: "blob",
    });
    return res.data;
  },

  history: async (page = 1, pageSize = 20): Promise<ImageListResponse> => {
    const res = await apiClient.get<ImageListResponse>("/api/history", {
      params: { page, page_size: pageSize },
    });
    return res.data;
  },
};

// ─── Upload ───────────────────────────────────────────────────────────────

export const uploadApi = {
  uploadFile: async (file: File, operation = "upload"): Promise<UploadResponse> => {
    const form = new FormData();
    form.append("file", file);
    form.append("operation", operation);
    const res = await apiClient.post<UploadResponse>("/api/upload", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  uploadMaskBase64: async (base64Data: string): Promise<UploadResponse> => {
    const form = new FormData();
    form.append("base64_data", base64Data);
    const res = await apiClient.post<UploadResponse>("/api/upload/mask", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  uploadFromUrl: async (imageUrl: string): Promise<UploadResponse> => {
    const form = new FormData();
    form.append("image_url", imageUrl);
    const res = await apiClient.post<UploadResponse>("/api/upload/url", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },
};

// ─── Collections ──────────────────────────────────────────────────────────

export const collectionsApi = {
  list: async (): Promise<Collection[]> => {
    const res = await apiClient.get<Collection[]>("/api/collections");
    return res.data;
  },

  get: async (id: string, page = 1): Promise<{
    collection: Collection;
    images: ImageRecord[];
    total: number;
    total_pages: number;
  }> => {
    const res = await apiClient.get(`/api/collections/${id}`, { params: { page } });
    return res.data;
  },

  create: async (data: { name: string; description?: string }): Promise<Collection> => {
    const res = await apiClient.post<Collection>("/api/collections", data);
    return res.data;
  },

  update: async (id: string, data: { name: string; description?: string }): Promise<Collection> => {
    const res = await apiClient.put<Collection>(`/api/collections/${id}`, data);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/collections/${id}`);
  },

  addImages: async (id: string, imageIds: string[]): Promise<void> => {
    await apiClient.post(`/api/collections/${id}/add`, { image_ids: imageIds });
  },

  removeImages: async (id: string, imageIds: string[]): Promise<void> => {
    await apiClient.delete(`/api/collections/${id}/remove`, { data: { image_ids: imageIds } });
  },

  downloadZip: async (id: string, format = "png"): Promise<Blob> => {
    const res = await apiClient.get(`/api/collections/${id}/download`, {
      params: { format },
      responseType: "blob",
    });
    return res.data;
  },
};

// ─── Batch download ───────────────────────────────────────────────────────

export const downloadApi = {
  batchDownload: async (imageIds: string[], format = "png", resolution = "original"): Promise<Blob> => {
    const res = await apiClient.post("/api/download/batch", {
      image_ids: imageIds,
      format,
      resolution,
    }, { responseType: "blob" });
    return res.data;
  },
};

// ─── Prompt ───────────────────────────────────────────────────────────────

export const promptApi = {
  enhance: async (prompt: string, style?: string): Promise<PromptEnhanceResponse> => {
    const res = await apiClient.post<PromptEnhanceResponse>("/api/prompt/enhance", {
      prompt,
      style,
    });
    return res.data;
  },

  random: async (): Promise<RandomPromptResponse> => {
    const res = await apiClient.get<RandomPromptResponse>("/api/prompt/random");
    return res.data;
  },

  templates: async (): Promise<PromptTemplate[]> => {
    const res = await apiClient.get<PromptTemplate[]>("/api/prompt/templates");
    return res.data;
  },

  history: async (limit = 30): Promise<PromptHistoryItem[]> => {
    const res = await apiClient.get<PromptHistoryItem[]>("/api/prompt/history", {
      params: { limit },
    });
    return res.data;
  },
};
