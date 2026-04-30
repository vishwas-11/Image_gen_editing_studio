"use client";

import { useEffect, useState, useCallback } from "react";
import type { ReactNode } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Download, FolderPlus, Heart, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AuthGuard, PageLoading, EmptyState } from "@/components/shared";
import { Button, ConfirmDialog } from "@/components/ui";
import { AddToCollectionDialog } from "@/components/gallery";
import { downloadBlob, formatBytes, formatRelative, parseTags } from "@/lib/utils";
import { galleryApi, collectionsApi } from "@/lib/api/gallery";
import { getErrorMessage } from "@/lib/api/client";
import { ROUTES, OPERATIONS_LABELS, PROVIDERS, STYLE_LABELS } from "@/lib/constants";
import type { Collection, ImageRecord } from "@/types";

export default function GalleryImagePage() {
  return (
    <AuthGuard>
      <GalleryImageContent />
    </AuthGuard>
  );
}

function GalleryImageContent() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [image, setImage] = useState<ImageRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [favLoading, setFavLoading] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [showAddToCollection, setShowAddToCollection] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const fetchCollections = useCallback(async () => {
    try {
      const cols = await collectionsApi.list();
      setCollections(cols);
    } catch {}
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchImage = async () => {
      setLoading(true);
      try {
        const res = await galleryApi.get(id);
        if (isMounted) setImage(res);
      } catch (err) {
        toast.error(getErrorMessage(err) || "Image not found");
        router.push(ROUTES.GALLERY);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (id) fetchImage();
    fetchCollections();

    return () => {
      isMounted = false;
    };
  }, [id, router, fetchCollections]);

  const toggleFavorite = async () => {
    if (!image) return;
    setFavLoading(true);

    try {
      const res = await galleryApi.toggleFavorite(image.id);
      setImage((prev) => (prev ? { ...prev, is_favorite: res.is_favorite } : prev));
      toast.success(res.is_favorite ? "Added to favorites" : "Removed from favorites");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setFavLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!image) return;

    try {
      const blob = await galleryApi.download(image.id, "png", "original");
      downloadBlob(blob, `ai_studio_${image.id.slice(0, 8)}.png`);
    } catch {
      window.open(image.image_url, "_blank", "noopener,noreferrer");
    }
  };

  const handleAddToCollection = () => {
    if (!image) return;
    setShowAddToCollection(true);
  };

  const handleDelete = () => {
    if (!image) return;
    setShowDeleteConfirm(true);
  };

  const performDelete = async () => {
    if (!image) return;
    try {
      await galleryApi.delete(image.id);
      toast.success("Image deleted");
      setShowDeleteConfirm(false);
      router.push(ROUTES.GALLERY);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (loading && !image) return <PageLoading />;

  if (!image) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-8">
        <EmptyState
          title="Image not found"
          description="The gallery item may have been deleted or the URL is invalid."
          action={
            <Button onClick={() => router.push(ROUTES.GALLERY)} className="gap-2">
              <ArrowLeft size={14} />
              Back to Gallery
            </Button>
          }
        />
      </div>
    );
  }

  const tags = parseTags(image.tags);
  const operationLabel = image.operation ? OPERATIONS_LABELS[image.operation] ?? image.operation : null;
  const styleLabel = image.style ? STYLE_LABELS[image.style] ?? image.style : null;
  const providerLabel = image.provider
    ? PROVIDERS[image.provider as keyof typeof PROVIDERS]?.label ?? image.provider
    : null;
  const resolution =
    image.width && image.height
      ? `${image.width} x ${image.height}`
      : image.width
        ? `${image.width}px wide`
        : image.height
          ? `${image.height}px tall`
          : "--";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => router.push(ROUTES.GALLERY)}
          className="flex items-center gap-1.5 font-mono text-xs text-studio-subtle transition-colors hover:text-white"
        >
          <ArrowLeft size={13} />
          Gallery
        </button>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={toggleFavorite} disabled={favLoading} className="gap-2">
            {favLoading ? <Loader2 size={13} className="animate-spin" /> : <Heart size={13} fill={image.is_favorite ? "currentColor" : "none"} />}
            {image.is_favorite ? "Unfavorite" : "Favorite"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleAddToCollection} className="gap-2">
            <FolderPlus size={13} />
            Add to Collection
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload} className="gap-2">
            <Download size={13} />
            Download
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDelete} className="gap-2">
            <Trash2 size={13} />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]">
        <div className="overflow-hidden rounded-2xl border border-studio-border bg-studio-surface shadow-2xl shadow-black/30">
          <div className="relative bg-black">
            <Image
              src={image.image_url}
              alt={image.prompt ?? "Gallery image"}
              width={1600}
              height={1600}
              className="h-auto w-full"
              sizes="(max-width: 1024px) 100vw, 70vw"
              unoptimized
            />
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-studio-border bg-black p-5">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-studio-subtle">Details</p>
            <h1 className="mt-2 font-display text-2xl text-white">Image {image.id.slice(0, 8)}</h1>
            <p className="mt-1 font-mono text-xs text-studio-subtle">{formatRelative(image.created_at)}</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Pill label="Operation" value={operationLabel ?? "--"} />
            <Pill label="Provider" value={providerLabel ?? "--"} />
          </div>

          <SectionCard title="Prompt">
            <DetailText value={image.prompt} placeholder="No prompt stored" />
          </SectionCard>

          <SectionCard title="Negative Prompt">
            <DetailText value={image.negative_prompt} placeholder="No negative prompt stored" />
          </SectionCard>

          {tags.length > 0 && (
            <SectionCard title="Tags">
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-white/70"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </SectionCard>
          )}

          <div className="grid grid-cols-2 gap-3 text-sm">
            <InfoItem label="Resolution" value={resolution} />
            <InfoItem label="Aspect Ratio" value={image.aspect_ratio ?? "--"} />
            <InfoItem label="Style" value={styleLabel ?? "--"} />
            <InfoItem label="Quality" value={image.quality ?? "--"} />
            <InfoItem label="Seed" value={image.seed ?? "--"} />
            <InfoItem label="Format" value={image.format ?? "--"} />
            <InfoItem label="Size" value={image.file_size ? formatBytes(image.file_size) : "--"} />
            <InfoItem label="Favorite" value={image.is_favorite ? "Yes" : "No"} />
          </div>
        </div>
      </div>

      <AddToCollectionDialog
        open={showAddToCollection}
        onOpenChange={setShowAddToCollection}
        collections={collections}
        imageIds={image ? [image.id] : []}
        onAdded={fetchCollections}
      />

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete image?"
        description="This will permanently delete the image from your gallery. This action cannot be undone."
        confirmLabel="Delete image"
        onConfirm={performDelete}
      />
    </div>
  );
}

function Pill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-studio-border bg-studio-surface px-3 py-2">
      <div className="font-mono text-[10px] uppercase tracking-wider text-studio-subtle">{label}</div>
      <div className="mt-1 font-mono text-xs text-white">{value}</div>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-studio-border bg-studio-surface px-3 py-2">
      <div className="font-mono text-[11px] uppercase tracking-wider text-studio-subtle">{title}</div>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function DetailText({ value, placeholder }: { value: string | null; placeholder: string }) {
  return value ? (
    <p className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-white/85">{value}</p>
  ) : (
    <p className="font-mono text-sm leading-relaxed text-white/45">{placeholder}</p>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-studio-border bg-studio-surface px-3 py-2">
      <div className="font-mono text-[11px] uppercase tracking-wider text-studio-subtle">{label}</div>
      <div className="mt-1 text-sm text-white">{value}</div>
    </div>
  );
}
