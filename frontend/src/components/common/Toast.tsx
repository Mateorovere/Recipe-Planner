import { Toaster } from "sonner";

/** Mounted once in AppShell. Themed to match the warm design system. */
export function AppToaster() {
  return (
    <Toaster
      position="top-center"
      gap={8}
      toastOptions={{
        classNames: {
          toast:
            "!rounded-2xl !border !border-cream-200 !bg-white !shadow-lifted !font-sans !text-sm !text-cream-900",
          success: "!text-success-700",
          error: "!text-red-700",
          actionButton: "!bg-brand-600 !text-white",
        },
      }}
    />
  );
}
