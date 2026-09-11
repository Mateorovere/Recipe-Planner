import { motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";

export function NotFoundPage() {
  const prefersReducedMotion = useReducedMotion();
  const wiggleProps = prefersReducedMotion
    ? {}
    : {
        animate: { rotate: [0, -8, 8, -4, 0] },
        transition: { duration: 1.2, ease: "easeInOut" as const },
      };

  return (
    <div className="flex flex-col items-center gap-3 py-20 text-center">
      <motion.span className="text-6xl" aria-hidden="true" {...wiggleProps}>
        🍳
      </motion.span>
      <h1 className="font-display text-2xl font-semibold text-cream-900">Page not found</h1>
      <p className="text-cream-600">
        This page must have fallen off the counter — we couldn't find what you were looking for.
      </p>
      <Link
        to="/"
        className="mt-2 inline-flex items-center justify-center rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-brand-700"
      >
        Back to Home
      </Link>
    </div>
  );
}
