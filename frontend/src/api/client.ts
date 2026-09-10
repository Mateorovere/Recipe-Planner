import { useAuthStore } from "../state/authStore";

const API_BASE_URL =
  (import.meta.env["VITE_API_BASE_URL"] as string | undefined) ?? "http://localhost:8000";

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "DELETE" | "PUT";
  body?: unknown;
  formData?: FormData;
  query?: Record<string, string | number | string[] | undefined>;
  auth?: boolean;
}

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const url = new URL(API_BASE_URL + path);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined) continue;
      if (Array.isArray(value)) {
        for (const v of value) url.searchParams.append(key, v);
      } else {
        url.searchParams.append(key, String(value));
      }
    }
  }
  return url.toString();
}

async function parseErrorResponse(response: Response): Promise<ApiError> {
  try {
    const data = (await response.json()) as { error?: { code: string; message: string } };
    if (data.error) {
      return new ApiError(response.status, data.error.code, data.error.message);
    }
  } catch {
    // fall through to the generic error below
  }
  return new ApiError(
    response.status,
    "unknown_error",
    response.status >= 500
      ? "Something went wrong on our end. Please try again shortly."
      : "The request could not be completed.",
  );
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};
  const token = options.auth === false ? null : useAuthStore.getState().token;
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let body: BodyInit | undefined;
  if (options.formData) {
    body = options.formData;
  } else if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.body);
  }

  let response: Response;
  try {
    response = await fetch(buildUrl(path, options.query), {
      method: options.method ?? "GET",
      headers,
      body: body ?? null,
    });
  } catch {
    throw new ApiError(0, "network_error", "Couldn't reach the server. Check your connection.");
  }

  if (!response.ok) {
    throw await parseErrorResponse(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}
