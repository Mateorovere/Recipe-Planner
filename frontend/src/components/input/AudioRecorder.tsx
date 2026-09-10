import { useRef, useState } from "react";

import { Button } from "../common/Button";

interface AudioRecorderProps {
  onSubmit: (audio: Blob) => void;
  isSubmitting: boolean;
}

type RecordingState = "idle" | "recording" | "recorded" | "unsupported";

export function AudioRecorder({ onSubmit, isSubmitting }: AudioRecorderProps) {
  const [state, setState] = useState<RecordingState>(
    typeof MediaRecorder === "undefined" ? "unsupported" : "idle",
  );
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
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
        <p className="text-sm text-gray-500">
          Recording isn't supported in this browser. Upload an audio file instead.
        </p>
      ) : (
        <>
          <button
            type="button"
            onClick={state === "recording" ? stopRecording : startRecording}
            disabled={isSubmitting}
            aria-pressed={state === "recording"}
            className={`flex h-24 w-24 items-center justify-center rounded-full text-4xl text-white shadow-lg transition-transform active:scale-95 ${
              state === "recording" ? "animate-pulse bg-red-500" : "bg-brand-600"
            }`}
          >
            <span aria-hidden="true">{state === "recording" ? "⏹" : "🎙️"}</span>
          </button>
          <p className="text-sm text-gray-500">
            {state === "recording"
              ? "Recording… tap to stop"
              : state === "recorded"
                ? "Got it! Tap the mic to re-record."
                : "Tap the mic and describe what you have"}
          </p>
        </>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex w-full items-center gap-2 text-xs text-gray-400">
        <div className="h-px flex-1 bg-gray-200" />
        or
        <div className="h-px flex-1 bg-gray-200" />
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
            setState("recorded");
          }
        }}
      />

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
