"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Download, Edit, FolderPlus, Heart, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn, downloadBlob, formatRelative, parseTags } from "@/lib/utils";
import { galleryApi } from "@/lib/api/gallery";
import { OPERATIONS_LABELS, ROUTES } from "@/lib/constants";
import type { ImageRecord } from "@/types";

interface GalleryCardProps {
  image: ImageRecord;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  onFavoriteChange: (id: string, val: boolean) => void;
  onDelete: (id: string) => void;
  onAddToCollection?: (id: string) => void;
}

export function GalleryCard({
  image,
  selected,
  onToggleSelect,
  onFavoriteChange,
  onDelete,
  onAddToCollection,
}: GalleryCardProps) {
  const router = useRouter();
  const [isFav, setIsFav] = useState(image.is_favorite);
  const [favLoading, setFavLoading] = useState(false);

  useEffect(() => {
    setIsFav(image.is_favorite);
  }, [image.is_favorite]);

  const tags = parseTags(image.tags);
  const operationLabel = image.operation ? OPERATIONS_LABELS[image.operation] ?? image.operation : null;

  const toggleFav = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setFavLoading(true);

    try {
      const res = await galleryApi.toggleFavorite(image.id);
      setIsFav(res.is_favorite);
      onFavoriteChange(image.id, res.is_favorite);
      toast.success(res.is_favorite ? "Added to favorites" : "Removed from favorites");
    } catch {
      toast.error("Failed to update favorite");
    } finally {
      setFavLoading(false);
    }
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      const blob = await galleryApi.download(image.id, "png", "original");
      downloadBlob(blob, `ai_studio_${image.id.slice(0, 8)}.png`);
    } catch {
      window.open(image.image_url, "_blank", "noopener,noreferrer");
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(image.id);
  };

  return (
    <div
      className={cn(
        "group relative mb-3 overflow-hidden rounded-xl border transition-all duration-200",
        selected
          ? "border-studio-blue ring-1 ring-studio-blue"
          : "border-studio-border hover:border-studio-blue/50"
      )}
      onClick={() => router.push(ROUTES.IMAGE(image.id))}
    >
      <div className="relative">
        <Image
          src={image.thumbnail_url ?? image.image_url}
          alt={image.prompt ?? "Gallery image"}
          width={800}
          height={800}
          className="h-auto w-full"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          unoptimized
        />

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect(image.id);
          }}
          className={cn(
            "absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-md border transition-all duration-150 backdrop-blur-sm",
            selected
              ? "border-studio-blue bg-studio-blue text-white"
              : "border-white/20 bg-black/50 opacity-0 group-hover:opacity-100"
          )}
          aria-label={selected ? "Deselect image" : "Select image"}
        >
          {selected ? <CheckCircle2 size={13} /> : <div className="h-3 w-3 rounded-sm border border-white/50" />}
        </button>

        <div className="absolute right-2 top-2 flex items-center gap-2">
          {operationLabel && (
            <span className="rounded bg-black/60 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-studio-subtle backdrop-blur-sm">
              {operationLabel}
            </span>
          )}
          {isFav && (
            <Heart size={13} className="text-red-400" fill="#f87171" />
          )}
        </div>
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <div className="absolute inset-x-0 bottom-0 space-y-2 p-3">
          {image.prompt && (
            <p className="line-clamp-2 font-mono text-[10px] leading-relaxed text-white/80">
              {image.prompt}
            </p>
          )}

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tags.slice(0, 4).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/10 bg-white/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-white/70"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-[9px] text-white/50">
              {formatRelative(image.created_at)}
            </span>

            <div className="flex items-center gap-1">
              <ActionButton onClick={toggleFav} active={isFav} disabled={favLoading}>
                {favLoading ? <Loader2 size={11} className="animate-spin" /> : <Heart size={11} fill={isFav ? "currentColor" : "none"} />}
              </ActionButton>
              <ActionButton
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`${ROUTES.EDITOR}?id=${image.id}`);
                }}
              >
                <Edit size={11} />
              </ActionButton>
              <ActionButton onClick={handleDownload}>
                <Download size={11} />
              </ActionButton>
              {onAddToCollection && (
                <ActionButton onClick={(e) => { e.stopPropagation(); onAddToCollection(image.id); }}>
                  <FolderPlus size={11} />
                </ActionButton>
              )}
              <ActionButton onClick={handleDelete} danger>
                <Trash2 size={11} />
              </ActionButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  active,
  danger,
  disabled,
}: {
  children: React.ReactNode;
  onClick: (e: React.MouseEvent) => void;
  active?: boolean;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex h-6 w-6 items-center justify-center rounded border transition-colors",
        danger
          ? "border-white/10 bg-black/60 text-white/70 hover:bg-red-500/20 hover:text-red-300"
          : active
            ? "border-studio-blue bg-studio-blue text-white"
            : "border-white/10 bg-black/60 text-white/70 hover:bg-black/80 hover:text-white",
        disabled && "cursor-not-allowed opacity-60"
      )}
    >
      {children}
    </button>
  );
}

export default GalleryCard;
