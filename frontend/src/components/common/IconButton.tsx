import type { ButtonHTMLAttributes, ReactNode } from "react";

type IconButtonVariant = "ghost" | "solid" | "outline";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  "aria-label": string;
  variant?: IconButtonVariant;
  children: ReactNode;
}

const VARIANT_CLASSES: Record<IconButtonVariant, string> = {
  ghost: "bg-white/90 text-cream-700 hover:bg-white",
  solid: "bg-brand-600 text-white hover:bg-brand-700",
  outline: "border border-cream-200 bg-white text-cream-700 hover:border-brand-300",
};

/** Icon-only control with a guaranteed 44px touch target, used for
 * favorite/remove/share affordances. Always pass an aria-label. */
export function IconButton({
  variant = "ghost",
  className = "",
  children,
  ...rest
}: IconButtonProps) {
  return (
    <button
      type="button"
      className={`flex h-11 w-11 flex-none items-center justify-center rounded-full shadow-soft transition-all duration-150 active:scale-90 disabled:cursor-not-allowed disabled:opacity-50 ${VARIANT_CLASSES[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
