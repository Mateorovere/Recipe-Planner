import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { AudioRecorder } from "../components/input/AudioRecorder";
import { ImageUploader } from "../components/input/ImageUploader";
import { TextInputForm } from "../components/input/TextInputForm";
import { ErrorState } from "../components/common/ErrorState";
import {
  useExtractFromAudio,
  useExtractFromImage,
  useExtractFromText,
} from "../hooks/useIngredientExtraction";

type Mode = "image" | "audio" | "text";

const MODES: { id: Mode; label: string; icon: string }[] = [
  { id: "image", label: "Scan ingredients", icon: "📷" },
  { id: "audio", label: "Describe ingredients", icon: "🎙️" },
  { id: "text", label: "Enter ingredients", icon: "📝" },
];

export function HomePage() {
  const [mode, setMode] = useState<Mode | null>(null);
  const navigate = useNavigate();

  const imageMutation = useExtractFromImage();
  const audioMutation = useExtractFromAudio();
  const textMutation = useExtractFromText();

  const goToReview = () => navigate("/review");

  return (
    <div className="flex flex-col gap-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          What's in your kitchen today?
        </h1>
        <p className="mt-2 text-gray-500">
          Snap a photo, talk it out, or type your ingredients — we'll find recipes that fit.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMode(m.id)}
            className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-5 text-center transition-colors ${
              mode === m.id
                ? "border-brand-500 bg-brand-50"
                : "border-gray-100 bg-white hover:border-brand-200"
            }`}
          >
            <span className="text-3xl" aria-hidden="true">
              {m.icon}
            </span>
            <span className="font-semibold text-gray-800">{m.label}</span>
          </button>
        ))}
      </div>

      {mode && (
        <div className="mx-auto w-full max-w-md rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          {mode === "image" && (
            <>
              <ImageUploader
                onSubmit={(file) => imageMutation.mutate(file, { onSuccess: goToReview })}
                isSubmitting={imageMutation.isPending}
              />
              {imageMutation.isError && (
                <ErrorState
                  error={imageMutation.error}
                  onRetry={() => imageMutation.reset()}
                  title="Couldn't read that photo"
                />
              )}
            </>
          )}
          {mode === "audio" && (
            <>
              <AudioRecorder
                onSubmit={(audio) => audioMutation.mutate(audio, { onSuccess: goToReview })}
                isSubmitting={audioMutation.isPending}
              />
              {audioMutation.isError && (
                <ErrorState
                  error={audioMutation.error}
                  onRetry={() => audioMutation.reset()}
                  title="Couldn't process that recording"
                />
              )}
            </>
          )}
          {mode === "text" && (
            <>
              <TextInputForm
                onSubmit={(text) => textMutation.mutate(text, { onSuccess: goToReview })}
                isSubmitting={textMutation.isPending}
              />
              {textMutation.isError && (
                <ErrorState
                  error={textMutation.error}
                  onRetry={() => textMutation.reset()}
                  title="Couldn't read your ingredients"
                />
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
