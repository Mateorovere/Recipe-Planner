import { UserRound } from "lucide-react";
import { Navigate } from "react-router-dom";

import { Button } from "../components/common/Button";
import { Spinner } from "../components/common/Spinner";
import { useCurrentUser, useLogout } from "../hooks/useAuth";
import { useAuthStore } from "../state/authStore";

export function ProfilePage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { data: user, isLoading } = useCurrentUser();
  const logout = useLogout();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (isLoading || !user) {
    return <Spinner label="Loading your profile…" />;
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col items-center gap-4 rounded-2xl border border-cream-200 bg-white p-8 text-center shadow-soft">
      <div
        className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-500 text-white shadow-soft"
        aria-hidden="true"
      >
        <UserRound className="h-9 w-9" />
      </div>
      <h1 className="font-display text-xl font-semibold text-cream-900">
        {user.full_name ?? "Your profile"}
      </h1>
      <p className="text-cream-600">{user.email}</p>
      <p className="text-xs text-cream-400">
        Member since {new Date(user.created_at).toLocaleDateString()}
      </p>
      <Button variant="secondary" onClick={logout}>
        Log out
      </Button>
    </div>
  );
}
