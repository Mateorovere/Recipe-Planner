import { Link, useNavigate } from "react-router-dom";

import { RegisterForm } from "../components/auth/RegisterForm";

export function RegisterPage() {
  const navigate = useNavigate();
  return (
    <div className="mx-auto flex max-w-sm flex-col gap-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
        <p className="mt-1 text-sm text-gray-500">
          Save recipes and keep track of your ingredients across visits.
        </p>
      </div>
      <RegisterForm onSuccess={() => navigate("/")} />
      <p className="text-center text-sm text-gray-500">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-brand-600 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
