import { Button } from "./Button";
import { ApiError } from "../../api/client";

interface ErrorStateProps {
  error: unknown;
  onRetry?: () => void;
  title?: string;
}

function messageFor(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Something went wrong. Please try again.";
}

export function ErrorState({ error, onRetry, title = "Something went wrong" }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-2xl border border-red-100 bg-red-50 p-6 text-center"
    >
      <span className="text-3xl" aria-hidden="true">
        ⚠️
      </span>
      <p className="font-semibold text-red-800">{title}</p>
      <p className="text-sm text-red-700">{messageFor(error)}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry} className="mt-1">
          Try again
        </Button>
      )}
    </div>
  );
}
