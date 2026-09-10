import { Link, useNavigate } from "react-router-dom";

import { LoginForm } from "../components/auth/LoginForm";

export function LoginPage() {
  const navigate = useNavigate();
  return (
    <div className="mx-auto flex max-w-sm flex-col gap-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
        <p className="mt-1 text-sm text-gray-500">Log in to see your favorites and history.</p>
      </div>
      <LoginForm onSuccess={() => navigate("/")} />
      <p className="text-center text-sm text-gray-500">
        No account?{" "}
        <Link to="/register" className="font-medium text-brand-600 hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
