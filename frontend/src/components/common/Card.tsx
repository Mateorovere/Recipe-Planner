import type { ReactNode } from "react";
import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";

interface CardProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
  hover?: boolean;
}

/** Base surface used across the app: rounded-2xl, soft warm shadow, optional
 * hover-lift. Compose with existing utility classes via `className`. */
export function Card({ children, hover = false, className = "", ...rest }: CardProps) {
  const prefersReducedMotion = useReducedMotion();
  const hoverProps =
    hover && !prefersReducedMotion
      ? { whileHover: { y: -4, boxShadow: "0 16px 32px -12px rgb(120 60 20 / 0.22)" } }
      : {};

  return (
    <motion.div
      className={`rounded-2xl border border-cream-200 bg-white shadow-soft ${className}`}
      transition={{ duration: 0.2, ease: "easeOut" }}
      {...hoverProps}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
