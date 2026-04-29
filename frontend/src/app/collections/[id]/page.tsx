"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Download, Trash2, Plus, FolderOpen } from "lucide-react";
import { toast } from "sonner";
import { AuthGuard, PageLoading, EmptyState } from "@/components/shared/index";
import { Button } from "@/components/ui/button";
import { MasonryGrid } from "@/components/gallery/MasonryGrid";
import { collectionsApi, galleryApi, downloadApi } from "@/lib/api/gallery";
import { getErrorMessage } from "@/lib/api/client";
import { ROUTES } from "@/lib/constants";
import type { Collection, ImageRecord } from "@/types";

export default function CollectionDetailPage() {
  return <AuthGuard><CollectionDetailContent /></AuthGuard>;
}

function CollectionDetailContent() {
  const { id }   = useParams<{ id: string }>();
  const router   = useRouter();

  const [collection, setCollection] = useState<Collection | null>(null);
  const [images, setImages]         = useState<ImageRecord[]>([]);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading]       = useState(true);
  const [selected, setSelected]     = useState<Set<string>>(new Set());

  const fetchCollection = async (p = 1) => {
    setLoading(true);
    try {
      const res = await collectionsApi.get(id, p);
      setCollection(res.collection);
      setImages(p === 1 ? res.images : (prev) => [...prev, ...res.images]);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch {
      toast.error("Collection not found");
      router.push(ROUTES.COLLECTIONS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCollection(1); }, [id]);

  const toggleSelect = (imgId: string) =>
    setSelected((prev) => { const n = new Set(prev); n.has(imgId) ? n.delete(imgId) : n.add(imgId); return n; });

  const handleRemoveSelected = async () => {
    if (!confirm(`Remove ${selected.size} image(s) from this collection?`)) return;
    try {
      await collectionsApi.removeImages(id, [...selected]);
      setImages((p) => p.filter((img) => !selected.has(img.id)));
      setTotal((p) => p - selected.size);
      setSelected(new Set());
      toast.success("Removed from collection");
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const handleDownloadZip = async () => {
    try {
      toast.info("Preparing ZIP…");
      const blob = await collectionsApi.downloadZip(id, "png");
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `${collection?.name ?? "collection"}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Download started");
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const handleDeleteImage = async (imgId: string) => {
    if (!confirm("Delete image permanently?")) return;
    try {
      await galleryApi.delete(imgId);
      setImages((p) => p.filter((i) => i.id !== imgId));
      setTotal((p) => p - 1);
      toast.success("Image deleted");
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  if (loading && !collection) return <PageLoading />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <button
            onClick={() => router.push(ROUTES.COLLECTIONS)}
            className="flex items-center gap-1.5 font-mono text-xs text-studio-subtle hover:text-white mb-3 transition-colors"
          >
            <ArrowLeft size={13} /> Collections
          </button>
          <h1 className="font-display text-3xl text-white">{collection?.name}</h1>
          {collection?.description && (
            <p className="font-mono text-sm text-studio-subtle mt-1">{collection.description}</p>
          )}
          <p className="font-mono text-xs text-studio-subtle mt-1">{total} image{total !== 1 ? "s" : ""}</p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {selected.size > 0 && (
            <Button variant="destructive" size="sm" onClick={handleRemoveSelected} className="gap-1.5">
              <Trash2 size={12} /> Remove {selected.size}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleDownloadZip} className="gap-1.5">
            <Download size={13} /> Download ZIP
          </Button>
        </div>
      </div>

      {/* Grid */}
      {loading && images.length === 0 ? (
        <PageLoading />
      ) : images.length === 0 ? (
        <EmptyState
          icon={<FolderOpen size={24} />}
          title="This collection is empty"
          description="Add images from your gallery to this collection"
          action={<Button onClick={() => router.push(ROUTES.GALLERY)} className="gap-2"><Plus size={14} />Browse Gallery</Button>}
        />
      ) : (
        <>
          <MasonryGrid
            images={images}
            selected={selected}
            onToggleSelect={toggleSelect}
            onFavoriteChange={() => {}}
            onDelete={handleDeleteImage}
          />
          {page < totalPages && (
            <div className="flex justify-center mt-8">
              <Button variant="outline" onClick={() => { const n = page + 1; setPage(n); fetchCollection(n); }} loading={loading}>
                Load more
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
