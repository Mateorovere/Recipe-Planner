import { useRef, useState } from "react";
import type { DragEvent } from "react";
import { Camera, RefreshCw } from "lucide-react";

import { AIThinkingIndicator } from "../common/AIThinkingIndicator";
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
        onClick={() => !isSubmitting && inputRef.current?.click()}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !isSubmitting) inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`relative flex min-h-48 cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border-2 border-dashed p-6 text-center transition-all duration-200 ${
          isDragOver
            ? "scale-[1.01] border-brand-500 bg-brand-50"
            : "border-cream-300 bg-cream-50 hover:border-brand-300 hover:bg-brand-50/40"
        }`}
      >
        {previewUrl ? (
          <>
            <img
              src={previewUrl}
              alt="Selected ingredients preview"
              className="max-h-52 rounded-xl object-contain shadow-soft"
            />
            <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-brand-700 shadow-soft">
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              Replace photo
            </span>
          </>
        ) : (
          <>
            <span
              className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-brand-600"
              aria-hidden="true"
            >
              <Camera className="h-6 w-6" />
            </span>
            <p className="font-medium text-cream-800">Tap to take or upload a photo</p>
            <p className="text-sm text-cream-500">or drag and drop an image here</p>
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
      {isSubmitting && <AIThinkingIndicator />}
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
