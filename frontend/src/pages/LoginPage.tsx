import { ChefHat } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { LoginForm } from "../components/auth/LoginForm";

export function LoginPage() {
  const navigate = useNavigate();
  return (
    <div className="mx-auto flex max-w-sm flex-col gap-6 py-6">
      <div className="text-center">
        <span
          className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-500 text-white shadow-soft"
          aria-hidden="true"
        >
          <ChefHat className="h-6 w-6" />
        </span>
        <h1 className="font-display text-2xl font-semibold text-cream-900">Welcome back</h1>
        <p className="mt-1 text-sm text-cream-600">Log in to see your favorites and history.</p>
      </div>
      <div className="rounded-2xl border border-cream-200 bg-white p-6 shadow-soft">
        <LoginForm onSuccess={() => navigate("/")} />
      </div>
      <p className="text-center text-sm text-cream-600">
        No account?{" "}
        <Link to="/register" className="font-semibold text-brand-600 hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
