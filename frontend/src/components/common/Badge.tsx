import type { ReactNode } from "react";

type BadgeVariant = "brand" | "success" | "neutral" | "amber";

interface BadgeProps {
  variant?: BadgeVariant;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  brand: "bg-brand-50 text-brand-700",
  success: "bg-success-50 text-success-700",
  neutral: "bg-cream-100 text-cream-700",
  amber: "bg-amber-50 text-amber-800",
};

/** Small label used for difficulty, tags, cuisine, match-% badges. */
export function Badge({ variant = "neutral", icon, children, className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${VARIANT_CLASSES[variant]} ${className}`}
    >
      {icon}
      {children}
    </span>
  );
}
