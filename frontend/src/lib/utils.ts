import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function formatDate(dateStr: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

export function formatRelative(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const diffMs = date.getTime() - Date.now();
    const absSeconds = Math.abs(Math.round(diffMs / 1000));

    const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

    if (absSeconds < 60) {
      return rtf.format(diffMs < 0 ? -absSeconds : absSeconds, "second");
    }

    const absMinutes = Math.abs(Math.round(diffMs / (60 * 1000)));
    if (absMinutes < 60) {
      return rtf.format(diffMs < 0 ? -absMinutes : absMinutes, "minute");
    }

    const absHours = Math.abs(Math.round(diffMs / (60 * 60 * 1000)));
    if (absHours < 24) {
      return rtf.format(diffMs < 0 ? -absHours : absHours, "hour");
    }

    const absDays = Math.abs(Math.round(diffMs / (24 * 60 * 60 * 1000)));
    if (absDays < 30) {
      return rtf.format(diffMs < 0 ? -absDays : absDays, "day");
    }

    return formatDate(dateStr);
  } catch {
    return dateStr;
  }
}

export function truncate(str: string, n: number): string {
  return str.length > n ? str.slice(0, n - 1) + "…" : str;
}

export function slugify(str: string): string {
  return str.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "");
}

export function parseTags(tags: string | null): string[] {
  if (!tags) return [];
  return tags.split(",").map((t) => t.trim()).filter(Boolean);
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function dataURLtoBlob(dataURL: string): Blob {
  const [header, data] = dataURL.split(",");
  const mime = header.match(/:(.*?);/)![1];
  const binary = atob(data);
  const arr = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

export function getAspectRatioDimensions(ar: string): { w: number; h: number } {
  const map: Record<string, { w: number; h: number }> = {
    "1:1":  { w: 1024, h: 1024 },
    "16:9": { w: 1792, h: 1024 },
    "9:16": { w: 1024, h: 1792 },
    "4:3":  { w: 1365, h: 1024 },
    "3:2":  { w: 1536, h: 1024 },
    "2:3":  { w: 1024, h: 1536 },
  };
  return map[ar] ?? { w: 1024, h: 1024 };
}
