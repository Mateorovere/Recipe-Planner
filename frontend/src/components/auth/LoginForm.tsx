import { useState } from "react";

import { Button } from "../common/Button";
import { ErrorState } from "../common/ErrorState";
import { toast } from "../common/toastClient";
import { useLogin } from "../../hooks/useAuth";

const FIELD_CLASSES =
  "rounded-xl border border-cream-200 bg-white px-4 py-2.5 text-sm text-cream-900 transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200";

export function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const login = useLogin();

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        login.mutate(
          { email, password },
          {
            onSuccess: () => {
              toast.success("Welcome back!");
              onSuccess();
            },
          },
        );
      }}
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="login-email" className="text-sm font-medium text-cream-700">
          Email
        </label>
        <input
          id="login-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={FIELD_CLASSES}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="login-password" className="text-sm font-medium text-cream-700">
          Password
        </label>
        <input
          id="login-password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={FIELD_CLASSES}
        />
      </div>
      {login.isError && <ErrorState error={login.error} title="Couldn't log in" />}
      <Button type="submit" size="lg" isLoading={login.isPending}>
        Log in
      </Button>
    </form>
  );
}
