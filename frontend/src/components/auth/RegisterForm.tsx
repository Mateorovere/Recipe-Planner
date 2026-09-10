import { useState } from "react";

import { Button } from "../common/Button";
import { ErrorState } from "../common/ErrorState";
import { useLogin, useRegister } from "../../hooks/useAuth";

export function RegisterForm({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const register = useRegister();
  const login = useLogin();

  const isPending = register.isPending || login.isPending;
  const error = register.error ?? login.error;

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        register.mutate(
          { email, password, ...(fullName.trim() ? { full_name: fullName.trim() } : {}) },
          { onSuccess: () => login.mutate({ email, password }, { onSuccess }) },
        );
      }}
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="register-name" className="text-sm font-medium text-gray-700">
          Full name (optional)
        </label>
        <input
          id="register-name"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="register-email" className="text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          id="register-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="register-password" className="text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          id="register-password"
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
        />
        <p className="text-xs text-gray-400">At least 8 characters.</p>
      </div>
      {error && <ErrorState error={error} title="Couldn't create your account" />}
      <Button type="submit" size="lg" isLoading={isPending}>
        Create account
      </Button>
    </form>
  );
}
