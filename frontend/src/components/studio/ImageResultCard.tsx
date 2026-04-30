"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Heart, Edit, Copy, Download, Sparkles, MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { galleryApi } from "@/lib/api/gallery";
import { ROUTES, OPERATIONS_LABELS } from "@/lib/constants";
import type { ImageRecord } from "@/types";

interface ImageResultCardProps {
  image: ImageRecord;
  onFavorite?: (id: string, val: boolean) => void;
  onEdit?: (image: ImageRecord) => void;
  onVariations?: (image: ImageRecord) => void;
  onDelete?: (id: string) => void;
  showOp?: boolean;
}

export default function ImageResultCard({
  image, onFavorite, onEdit, onVariations, onDelete, showOp = false,
}: ImageResultCardProps) {
  const router = useRouter();
  const [isFav, setIsFav] = useState(image.is_favorite);
  const [favLoading, setFavLoading] = useState(false);

  const toggleFav = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setFavLoading(true);
    try {
      const res = await galleryApi.toggleFavorite(image.id);
      setIsFav(res.is_favorite);
      onFavorite?.(image.id, res.is_favorite);
      toast.success(res.is_favorite ? "Added to favorites" : "Removed from favorites");
    } catch {
      toast.error("Failed to update favorite");
    } finally {
      setFavLoading(false);
    }
  };

  const copyPrompt = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (image.prompt) {
      navigator.clipboard.writeText(image.prompt);
      toast.success("Prompt copied!");
    }
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const blob = await galleryApi.download(image.id, "png", "original");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ai_studio_${image.id.slice(0, 8)}.png`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Downloading...");
    } catch {
      // Fallback: open direct URL
      window.open(image.image_url, "_blank");
    }
  };

  const ar = image.aspect_ratio ?? "1:1";
  const [aw, ah] = ar.split(":").map(Number);
  const paddingPct = ah && aw ? `${(ah / aw) * 100}%` : "100%";

  return (
    <div
      className="result-card group relative cursor-pointer overflow-hidden rounded-lg border border-studio-border bg-studio-surface transition-all duration-200 hover:border-studio-blue/40"
      onClick={() => router.push(ROUTES.IMAGE(image.id))}
    >
      {/* Image */}
      <div className="relative w-full bg-black/40" style={{ paddingBottom: paddingPct }}>
        <Image
          src={image.thumbnail_url ?? image.image_url}
          alt={image.prompt ?? "Generated image"}
          fill
          className="object-contain p-1.5"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          unoptimized
        />
      </div>

      {/* Hover overlay */}
      <div className="actions-overlay">
        {/* Prompt text */}
        {image.prompt && (
          <div className="absolute top-0 inset-x-0 p-2.5 bg-gradient-to-b from-black/80 to-transparent">
            <p className="font-mono text-[10px] text-white/80 line-clamp-2 leading-relaxed">
              {image.prompt}
            </p>
          </div>
        )}

        {/* Action row */}
        <div className="flex items-center gap-1.5 z-10">
          <ActionBtn onClick={toggleFav} title={isFav ? "Unfavorite" : "Favorite"} active={isFav}>
            <Heart size={13} fill={isFav ? "currentColor" : "none"} />
          </ActionBtn>
          {onEdit && (
            <ActionBtn onClick={(e) => { e.stopPropagation(); onEdit(image); }} title="Edit">
              <Edit size={13} />
            </ActionBtn>
          )}
          {onVariations && (
            <ActionBtn onClick={(e) => { e.stopPropagation(); onVariations(image); }} title="Variations">
              <Sparkles size={13} />
            </ActionBtn>
          )}
          <ActionBtn onClick={copyPrompt} title="Copy prompt">
            <Copy size={13} />
          </ActionBtn>
          <ActionBtn onClick={handleDownload} title="Download">
            <Download size={13} />
          </ActionBtn>
        </div>
      </div>

      {/* Op badge */}
      {showOp && image.operation && (
        <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-sm font-mono text-[9px] text-studio-subtle uppercase tracking-wider">
          {OPERATIONS_LABELS[image.operation] ?? image.operation}
        </div>
      )}
    </div>
  );
}

function ActionBtn({
  children, onClick, title, active,
}: {
  children: React.ReactNode;
  onClick: (e: React.MouseEvent) => void;
  title: string;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        "studio-chip w-8 h-8 rounded-lg flex items-center justify-center",
        "backdrop-blur-sm border",
        active
          ? "bg-studio-blue/80 border-studio-blue text-white shadow-[0_0_0_1px_rgba(59,130,246,0.14),0_0_18px_rgba(5,125,188,0.16)] scale-105"
          : "bg-black/60 border-white/10 text-white/70 hover:bg-black/80 hover:text-white"
      )}
    >
      {children}
    </button>
  );
}
