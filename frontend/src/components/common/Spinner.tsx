interface SpinnerProps {
  label?: string;
  className?: string;
}

export function Spinner({ label = "Loading…", className = "" }: SpinnerProps) {
  return (
    <div className={`flex flex-col items-center gap-3 py-8 text-gray-500 ${className}`}>
      <span
        className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600"
        aria-hidden="true"
      />
      <p className="text-sm">{label}</p>
    </div>
  );
}
