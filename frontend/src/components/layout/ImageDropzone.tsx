"use client";

import { Image, Upload } from "lucide-react";
import { useDropzone } from "react-dropzone";

import { cn } from "@/lib/utils";

interface ImageDropzoneProps {
  onFile: (file: File) => void;
  className?: string;
  label?: string;
}

export function ImageDropzone({
  onFile,
  className,
  label = "Drop image or click to upload",
}: ImageDropzoneProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp"] },
    maxFiles: 1,
    onDrop: (files) => files[0] && onFile(files[0]),
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-all duration-200",
        isDragActive
          ? "border-studio-blue bg-studio-blue/5 scale-[1.01]"
          : "border-studio-border hover:border-studio-blue/50 hover:bg-studio-hover",
        className
      )}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-2.5">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
            isDragActive
              ? "bg-studio-blue/20 text-studio-blue"
              : "bg-studio-surface text-studio-subtle"
          )}
        >
          {isDragActive ? <Image size={20} /> : <Upload size={20} />}
        </div>
        <p className="font-mono text-xs text-studio-subtle">{label}</p>
        <p className="font-mono text-xs text-studio-subtle/50">
          PNG, JPG, WEBP up to 20MB
        </p>
      </div>
    </div>
  );
}
