import { useRef, useState } from "react";
import type { DragEvent } from "react";

import { Button } from "../common/Button";

interface ImageUploaderProps {
  onSubmit: (file: File) => void;
  isSubmitting: boolean;
}

export function ImageUploader({ onSubmit, isSubmitting }: ImageUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function selectFile(next: File) {
    setFile(next);
    setPreviewUrl(URL.createObjectURL(next));
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) selectFile(dropped);
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`flex min-h-48 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-6 text-center transition-colors ${
          isDragOver ? "border-brand-500 bg-brand-50" : "border-gray-300 bg-white"
        }`}
      >
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Selected ingredients preview"
            className="max-h-48 rounded-lg object-contain"
          />
        ) : (
          <>
            <span className="text-4xl" aria-hidden="true">
              📷
            </span>
            <p className="font-medium text-gray-700">Tap to take or upload a photo</p>
            <p className="text-sm text-gray-400">or drag and drop an image here</p>
          </>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const selected = e.target.files?.[0];
          if (selected) selectFile(selected);
        }}
      />
      <Button
        size="lg"
        isLoading={isSubmitting}
        disabled={!file || isSubmitting}
        onClick={() => file && onSubmit(file)}
      >
        Identify ingredients
      </Button>
    </div>
  );
}
