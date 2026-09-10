import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getCurrentUser, login as loginRequest, register as registerRequest } from "../api/auth";
import type { LoginPayload, RegisterPayload } from "../api/auth";
import { useAuthStore } from "../state/authStore";

export function useCurrentUser() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setUser = useAuthStore((s) => s.setUser);

  return useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const user = await getCurrentUser();
      setUser(user);
      return user;
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });
}

export function useLogin() {
  const setToken = useAuthStore((s) => s.setToken);
  const loginToStore = useAuthStore((s) => s.login);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: LoginPayload) => {
      const token = await loginRequest(payload);
      setToken(token.access_token); // so the authenticated /users/me call below works
      const user = await getCurrentUser();
      return { token, user };
    },
    onSuccess: ({ token, user }) => {
      loginToStore(token.access_token, user);
      void queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: (payload: RegisterPayload) => registerRequest(payload),
  });
}

export function useLogout() {
  const logout = useAuthStore((s) => s.logout);
  const queryClient = useQueryClient();
  return () => {
    logout();
    queryClient.clear();
  };
}
