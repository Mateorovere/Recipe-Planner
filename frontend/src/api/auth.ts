import { apiRequest } from "./client";
import type { Token, User } from "../types/user";

export interface RegisterPayload {
  email: string;
  password: string;
  full_name?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export function register(payload: RegisterPayload): Promise<User> {
  return apiRequest<User>("/api/v1/auth/register", { method: "POST", body: payload, auth: false });
}

export function login(payload: LoginPayload): Promise<Token> {
  return apiRequest<Token>("/api/v1/auth/login", { method: "POST", body: payload, auth: false });
}

export function getCurrentUser(): Promise<User> {
  return apiRequest<User>("/api/v1/users/me");
}
