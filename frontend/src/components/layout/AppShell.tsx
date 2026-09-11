import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { ChefHat, Heart, History, House, UserRound } from "lucide-react";
import { NavLink } from "react-router-dom";

import { AppToaster } from "../common/Toast";
import { useAuthStore } from "../../state/authStore";

const NAV_ITEMS = [
  { to: "/", label: "Home", Icon: House },
  { to: "/favorites", label: "Favorites", Icon: Heart },
  { to: "/history", label: "History", Icon: History },
];

export function AppShell({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-cream-100">
      <header
        className={`sticky top-0 z-30 border-b bg-white/85 backdrop-blur-md transition-shadow duration-200 ${
          scrolled ? "border-cream-200 shadow-soft" : "border-transparent"
        }`}
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <NavLink
            to="/"
            className="flex items-center gap-2 font-display text-xl font-semibold text-cream-900"
          >
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500 text-white shadow-soft"
              aria-hidden="true"
            >
              <ChefHat className="h-5 w-5" />
            </span>
            <span>Recipe AI</span>
          </NavLink>
          <nav className="hidden items-center gap-1 text-sm font-medium sm:flex">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className="relative px-3 py-2"
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.span
                        layoutId="nav-active-pill"
                        className="absolute inset-0 rounded-full bg-brand-50"
                        transition={{ type: "spring", stiffness: 380, damping: 32 }}
                      />
                    )}
                    <span
                      className={`relative ${isActive ? "font-semibold text-brand-700" : "text-cream-600 hover:text-cream-900"}`}
                    >
                      {item.label}
                    </span>
                  </>
                )}
              </NavLink>
            ))}
            {isAuthenticated ? (
              <NavLink to="/profile" className="relative px-3 py-2">
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.span
                        layoutId="nav-active-pill"
                        className="absolute inset-0 rounded-full bg-brand-50"
                        transition={{ type: "spring", stiffness: 380, damping: 32 }}
                      />
                    )}
                    <span
                      className={`relative ${isActive ? "font-semibold text-brand-700" : "text-cream-600 hover:text-cream-900"}`}
                    >
                      {user?.full_name ?? user?.email ?? "Profile"}
                    </span>
                  </>
                )}
              </NavLink>
            ) : (
              <NavLink
                to="/login"
                className="ml-2 rounded-xl bg-brand-600 px-4 py-2 font-semibold text-white shadow-soft transition-colors hover:bg-brand-700"
              >
                Log in
              </NavLink>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-28 pt-6 sm:px-6 sm:pb-10">
        {children}
      </main>

      <nav
        className="fixed bottom-0 left-0 right-0 z-30 flex border-t border-cream-200 bg-white/95 backdrop-blur-md sm:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Primary"
      >
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors ${
                isActive ? "text-brand-600" : "text-cream-500"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.Icon
                  className={`h-5 w-5 transition-transform duration-150 ${isActive ? "scale-110" : ""}`}
                  fill={isActive && item.Icon === Heart ? "currentColor" : "none"}
                  aria-hidden="true"
                />
                {item.label}
              </>
            )}
          </NavLink>
        ))}
        <NavLink
          to={isAuthenticated ? "/profile" : "/login"}
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors ${
              isActive ? "text-brand-600" : "text-cream-500"
            }`
          }
        >
          {({ isActive }) => (
            <>
              <UserRound
                className={`h-5 w-5 transition-transform duration-150 ${isActive ? "scale-110" : ""}`}
                aria-hidden="true"
              />
              {isAuthenticated ? "Profile" : "Log in"}
            </>
          )}
        </NavLink>
      </nav>

      <AppToaster />
    </div>
  );
}
