import { clearToken, getToken, setToken } from "./auth";
import type { AdminMe, LoginResponse } from "./types";

function baseURL(): string {
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (!base) {
    throw new Error("NEXT_PUBLIC_API_URL is not set");
  }
  return base.replace(/\/$/, "");
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function parseError(res: Response): Promise<string> {
  const text = await res.text();
  if (text) {
    try {
      const data = JSON.parse(text) as { error?: string };
      if (data.error) {
        return data.error;
      }
    } catch {
      // not JSON
    }
  }
  return text.trim() || res.statusText || "Request failed";
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${baseURL()}/api/v1/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    throw new ApiError(await parseError(res), res.status);
  }

  const data = (await res.json()) as LoginResponse;
  setToken(data.token);
  return data;
}

export function logout(): void {
  clearToken();
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = getToken();
  const headers = new Headers(init.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${baseURL()}${path}`, { ...init, headers });

  if (res.status === 401) {
    clearToken();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }

  return res;
}

export async function fetchMe(): Promise<AdminMe> {
  const res = await apiFetch("/api/v1/admin/me");
  if (!res.ok) {
    throw new ApiError(await parseError(res), res.status);
  }
  return (await res.json()) as AdminMe;
}
