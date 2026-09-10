import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";

import { useAuthStore } from "../../state/authStore";

const NAV_ITEMS = [
  { to: "/", label: "Home", icon: "🏠" },
  { to: "/favorites", label: "Favorites", icon: "❤️" },
  { to: "/history", label: "History", icon: "🕘" },
];

function navLinkClasses(isActive: boolean, extra = ""): string {
  return `${extra} ${isActive ? "text-brand-600" : "text-gray-500 hover:text-gray-800"}`;
}

export function AppShell({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="sticky top-0 z-20 border-b border-gray-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <NavLink to="/" className="flex items-center gap-2 text-lg font-bold text-gray-900">
            <span aria-hidden="true">🍳</span>
            <span>Recipe AI</span>
          </NavLink>
          <nav className="hidden items-center gap-6 text-sm font-medium sm:flex">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) => navLinkClasses(isActive)}
              >
                {item.label}
              </NavLink>
            ))}
            {isAuthenticated ? (
              <NavLink
                to="/profile"
                className={({ isActive }) => navLinkClasses(isActive, "font-semibold")}
              >
                {user?.full_name ?? user?.email ?? "Profile"}
              </NavLink>
            ) : (
              <NavLink to="/login" className={({ isActive }) => navLinkClasses(isActive)}>
                Log in
              </NavLink>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-24 pt-6 sm:px-6 sm:pb-10">
        {children}
      </main>

      <nav
        className="fixed bottom-0 left-0 right-0 z-20 flex border-t border-gray-200 bg-white sm:hidden"
        aria-label="Primary"
      >
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs ${
                isActive ? "text-brand-600" : "text-gray-500"
              }`
            }
          >
            <span className="text-lg" aria-hidden="true">
              {item.icon}
            </span>
            {item.label}
          </NavLink>
        ))}
        <NavLink
          to={isAuthenticated ? "/profile" : "/login"}
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs ${
              isActive ? "text-brand-600" : "text-gray-500"
            }`
          }
        >
          <span className="text-lg" aria-hidden="true">
            👤
          </span>
          {isAuthenticated ? "Profile" : "Log in"}
        </NavLink>
      </nav>
    </div>
  );
}
