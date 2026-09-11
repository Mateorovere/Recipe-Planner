import type { ReactNode } from "react";

interface RecipeRowProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
}

/** Horizontal snap-scroll row used for "Continue where you left off" and
 * "Recently viewed" on the home page. Renders nothing itself beyond the
 * chrome — callers decide when to omit the section entirely (empty data). */
export function RecipeRow({ title, icon, children }: RecipeRowProps) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-cream-900">
        {icon}
        {title}
      </h2>
      <div className="scroll-row -mx-4 flex gap-4 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6">
        {children}
      </div>
    </section>
  );
}
