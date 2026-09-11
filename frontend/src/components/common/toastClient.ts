import { toast as sonnerToast } from "sonner";

/** Thin wrapper around sonner so call sites never import the library
 * directly — keeps the toast API (and its styling) centralized. */
export const toast = {
  success: (message: string) => sonnerToast.success(message),
  error: (message: string) => sonnerToast.error(message),
  info: (message: string, opts?: { action?: { label: string; onClick: () => void } }) =>
    sonnerToast(message, opts),
};
