import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Camera, Clock, Heart, Mic, PenLine } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { AudioRecorder } from "../components/input/AudioRecorder";
import { ImageUploader } from "../components/input/ImageUploader";
import { TextInputForm } from "../components/input/TextInputForm";
import { ErrorState } from "../components/common/ErrorState";
import { CompactRecipeCard } from "../components/recipes/CompactRecipeCard";
import { RecipeRow } from "../components/recipes/RecipeRow";
import {
  useExtractFromAudio,
  useExtractFromImage,
  useExtractFromText,
} from "../hooks/useIngredientExtraction";
import { useFavorites } from "../hooks/useFavorites";
import { useAuthStore } from "../state/authStore";
import { useRecentlyViewedStore } from "../state/recentlyViewedStore";

type Mode = "image" | "audio" | "text";

const MODES: { id: Mode; label: string; description: string; Icon: typeof Camera }[] = [
  { id: "image", label: "Scan ingredients", description: "Snap or upload a photo", Icon: Camera },
  { id: "audio", label: "Describe ingredients", description: "Talk it out loud", Icon: Mic },
  { id: "text", label: "Enter ingredients", description: "Type your list", Icon: PenLine },
];

export function HomePage() {
  const [mode, setMode] = useState<Mode | null>(null);
  const navigate = useNavigate();

  const imageMutation = useExtractFromImage();
  const audioMutation = useExtractFromAudio();
  const textMutation = useExtractFromText();

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { data: favorites } = useFavorites();
  const recentlyViewed = useRecentlyViewedStore((s) => s.items);

  const goToReview = () => navigate("/review");

  return (
    <div className="flex flex-col gap-10">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-50 via-cream-50 to-brand-100 px-6 py-10 text-center sm:py-14">
        <div
          className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand-200/50 blur-2xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-12 -left-8 h-40 w-40 rounded-full bg-success-200/40 blur-2xl"
          aria-hidden="true"
        />
        <p className="relative mb-2 text-sm font-semibold uppercase tracking-wide text-brand-600">
          Your AI kitchen assistant
        </p>
        <h1 className="relative font-display text-3xl font-semibold text-cream-900 sm:text-4xl">
          What's in your kitchen today?
        </h1>
        <p className="relative mx-auto mt-2 max-w-md text-cream-600">
          Snap a photo, talk it out, or type your ingredients — I'll figure out what you can cook.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {MODES.map((m) => {
          const isSelected = mode === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id)}
              aria-pressed={isSelected}
              className={`group flex flex-col items-center gap-2 rounded-2xl border-2 p-5 text-center transition-all duration-200 active:scale-[0.98] ${
                isSelected
                  ? "border-brand-500 bg-brand-50 shadow-soft"
                  : "border-cream-200 bg-white hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-soft"
              }`}
            >
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors ${
                  isSelected
                    ? "bg-brand-500 text-white"
                    : "bg-brand-50 text-brand-600 group-hover:bg-brand-100"
                }`}
                aria-hidden="true"
              >
                <m.Icon className="h-6 w-6" />
              </span>
              <span className="font-semibold text-cream-900">{m.label}</span>
              <span className="text-xs text-cream-500">{m.description}</span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {mode && (
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="mx-auto w-full max-w-md rounded-2xl border border-cream-200 bg-white p-6 shadow-soft"
          >
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
          </motion.div>
        )}
      </AnimatePresence>

      {isAuthenticated && favorites && favorites.length > 0 && (
        <RecipeRow
          title="Continue where you left off"
          icon={<Heart className="h-5 w-5 text-brand-500" aria-hidden="true" />}
        >
          {favorites.slice(0, 8).map((recipe) => (
            <CompactRecipeCard key={recipe.id} {...recipe} />
          ))}
        </RecipeRow>
      )}

      {recentlyViewed.length > 0 && (
        <RecipeRow
          title="Recently viewed"
          icon={<Clock className="h-5 w-5 text-brand-500" aria-hidden="true" />}
        >
          {recentlyViewed.map((recipe) => (
            <CompactRecipeCard key={recipe.id} {...recipe} />
          ))}
        </RecipeRow>
      )}
    </div>
  );
}
