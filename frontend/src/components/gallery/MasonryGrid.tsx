"use client";
import Masonry from "react-masonry-css";
import type { ImageRecord } from "@/types";
import { GalleryCard } from "./GalleryCard";

const BREAKPOINTS = {
  default: 4,
  1280: 3,
  1024: 3,
  768: 2,
  640: 2,
  480: 1,
};

interface MasonryGridProps {
  images: ImageRecord[];
  selected: Set<string>;
  onToggleSelect: (id: string) => void;
  onFavoriteChange: (id: string, val: boolean) => void;
  onDelete: (id: string) => void;
  onAddToCollection?: (id: string) => void;
}

export function MasonryGrid({
  images,
  selected,
  onToggleSelect,
  onFavoriteChange,
  onDelete,
  onAddToCollection,
}: MasonryGridProps) {
  return (
    <Masonry breakpointCols={BREAKPOINTS} className="masonry-grid" columnClassName="masonry-grid-column">
      {images.map((image) => (
        <GalleryCard
          key={image.id}
          image={image}
          selected={selected.has(image.id)}
          onToggleSelect={onToggleSelect}
          onFavoriteChange={onFavoriteChange}
          onDelete={onDelete}
          onAddToCollection={onAddToCollection}
        />
      ))}
    </Masonry>
  );
}

export default MasonryGrid;
