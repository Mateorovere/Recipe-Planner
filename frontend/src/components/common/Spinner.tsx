interface SpinnerProps {
  label?: string;
  className?: string;
}

export function Spinner({ label = "Loading…", className = "" }: SpinnerProps) {
  return (
    <div className={`flex flex-col items-center gap-3 py-8 text-cream-500 ${className}`}>
      <span className="relative flex h-9 w-9 items-center justify-center" aria-hidden="true">
        <span className="absolute inset-0 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
      </span>
      <p className="text-sm">{label}</p>
    </div>
  );
}
