import { useRef, useState } from "react";
import { Mic, Square } from "lucide-react";

import { AIThinkingIndicator } from "../common/AIThinkingIndicator";
import { Button } from "../common/Button";

interface AudioRecorderProps {
  onSubmit: (audio: Blob) => void;
  isSubmitting: boolean;
}

type RecordingState = "idle" | "recording" | "recorded" | "unsupported";

const WAVE_BAR_COUNT = 5;

export function AudioRecorder({ onSubmit, isSubmitting }: AudioRecorderProps) {
  const [state, setState] = useState<RecordingState>(
    typeof MediaRecorder === "undefined" ? "unsupported" : "idle",
  );
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function startRecording() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        setState("recorded");
        for (const track of stream.getTracks()) track.stop();
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setState("recording");
    } catch {
      setError(
        "Microphone access was denied or unavailable. You can upload an audio file instead.",
      );
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {state === "unsupported" ? (
        <p className="text-sm text-cream-500">
          Recording isn't supported in this browser. Upload an audio file instead.
        </p>
      ) : (
        <>
          <div className="relative flex h-28 w-28 items-center justify-center">
            {state === "recording" && (
              <span
                className="absolute inset-0 rounded-full animate-pulse-ring"
                aria-hidden="true"
              />
            )}
            <button
              type="button"
              onClick={state === "recording" ? stopRecording : startRecording}
              disabled={isSubmitting}
              aria-pressed={state === "recording"}
              className={`relative flex h-24 w-24 items-center justify-center rounded-full text-white shadow-lifted transition-transform duration-150 active:scale-95 disabled:opacity-60 ${
                state === "recording" ? "bg-red-500" : "bg-brand-600 hover:bg-brand-700"
              }`}
            >
              {state === "recording" ? (
                <Square className="h-8 w-8" aria-hidden="true" fill="currentColor" />
              ) : (
                <Mic className="h-9 w-9" aria-hidden="true" />
              )}
            </button>
          </div>

          {state === "recording" && (
            <div className="flex h-8 items-end gap-1" aria-hidden="true">
              {Array.from({ length: WAVE_BAR_COUNT }, (_, i) => (
                <span
                  key={i}
                  className="w-1.5 animate-pulse rounded-full bg-red-400"
                  style={{
                    height: `${12 + ((i * 7) % 20)}px`,
                    animationDelay: `${i * 120}ms`,
                  }}
                />
              ))}
            </div>
          )}

          <p className="text-sm text-cream-500">
            {state === "recording"
              ? "Recording… tap to stop"
              : state === "recorded"
                ? "Got it! Tap the mic to re-record."
                : "Tap the mic and describe what you have"}
          </p>

          {state === "recorded" && audioUrl && (
            <audio controls src={audioUrl} className="h-10 w-full max-w-xs" />
          )}
        </>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex w-full items-center gap-2 text-xs text-cream-400">
        <div className="h-px flex-1 bg-cream-200" />
        or
        <div className="h-px flex-1 bg-cream-200" />
      </div>

      <Button
        variant="secondary"
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={isSubmitting}
      >
        Upload an audio file
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={(e) => {
          const selected = e.target.files?.[0];
          if (selected) {
            setAudioBlob(selected);
            setAudioUrl(URL.createObjectURL(selected));
            setState("recorded");
          }
        }}
      />

      {isSubmitting && <AIThinkingIndicator stages={["Uploading…", "Transcribing what you said…", "Finding ingredients…"]} className="w-full" />}

      <Button
        size="lg"
        className="w-full"
        isLoading={isSubmitting}
        disabled={!audioBlob || isSubmitting}
        onClick={() => audioBlob && onSubmit(audioBlob)}
      >
        Transcribe & find ingredients
      </Button>
    </div>
  );
}
