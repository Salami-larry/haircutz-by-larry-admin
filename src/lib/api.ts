import { clearToken, getToken, setToken } from "./auth";
import type {
  AdminMe,
  Appointment,
  AppointmentStatus,
  Hairstyle,
  LoginResponse,
  Paginated,
} from "./types";

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
    public code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function parseError(res: Response): Promise<{ message: string; code?: string }> {
  const text = await res.text();
  if (text) {
    try {
      const data = JSON.parse(text) as { error?: string; code?: string };
      if (data.error) {
        return { message: data.error, code: data.code };
      }
    } catch {
      // not JSON
    }
  }
  return { message: text.trim() || res.statusText || "Request failed" };
}

async function throwApiError(res: Response): Promise<never> {
  const body = await parseError(res);
  throw new ApiError(body.message, res.status, body.code);
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${baseURL()}/api/v1/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    await throwApiError(res);
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
    await throwApiError(res);
  }
  return (await res.json()) as AdminMe;
}

export async function listHairstyles(params?: {
  q?: string;
  active?: boolean;
  page?: number;
  page_size?: number;
}): Promise<Paginated<Hairstyle>> {
  const search = new URLSearchParams();
  if (params?.q) search.set("q", params.q);
  if (params?.active !== undefined) search.set("active", String(params.active));
  if (params?.page !== undefined) search.set("page", String(params.page));
  if (params?.page_size !== undefined) search.set("page_size", String(params.page_size));

  const qs = search.toString();
  const res = await apiFetch(`/api/v1/admin/hairstyles${qs ? `?${qs}` : ""}`);
  if (!res.ok) {
    await throwApiError(res);
  }
  return (await res.json()) as Paginated<Hairstyle>;
}

export async function getHairstyle(id: string): Promise<Hairstyle> {
  const res = await apiFetch(`/api/v1/admin/hairstyles/${id}`);
  if (!res.ok) {
    await throwApiError(res);
  }
  return (await res.json()) as Hairstyle;
}

export async function createHairstyle(body: unknown): Promise<Hairstyle> {
  const res = await apiFetch("/api/v1/admin/hairstyles", {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    await throwApiError(res);
  }
  return (await res.json()) as Hairstyle;
}

export async function updateHairstyle(id: string, body: unknown): Promise<Hairstyle> {
  const res = await apiFetch(`/api/v1/admin/hairstyles/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    await throwApiError(res);
  }
  return (await res.json()) as Hairstyle;
}

export async function deleteHairstyle(id: string): Promise<void> {
  const res = await apiFetch(`/api/v1/admin/hairstyles/${id}`, { method: "DELETE" });
  if (!res.ok) {
    await throwApiError(res);
  }
}

export async function uploadHairstyleImage(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);

  const res = await apiFetch("/api/v1/admin/uploads", {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    await throwApiError(res);
  }

  const data = (await res.json()) as { url: string };
  return data.url;
}

export async function uploadHairstyleVideo(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);

  const res = await apiFetch("/api/v1/admin/uploads/video", {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    await throwApiError(res);
  }

  const data = (await res.json()) as { url: string };
  return data.url;
}

export async function listAppointments(params?: {
  status?: AppointmentStatus;
  date?: string;
  page?: number;
  page_size?: number;
}): Promise<Paginated<Appointment>> {
  const search = new URLSearchParams();
  if (params?.status) search.set("status", params.status);
  if (params?.date) search.set("date", params.date);
  if (params?.page !== undefined) search.set("page", String(params.page));
  if (params?.page_size !== undefined) search.set("page_size", String(params.page_size));

  const qs = search.toString();
  const res = await apiFetch(`/api/v1/admin/appointments${qs ? `?${qs}` : ""}`);
  if (!res.ok) {
    await throwApiError(res);
  }
  return (await res.json()) as Paginated<Appointment>;
}

export async function getAppointment(id: string): Promise<Appointment> {
  const res = await apiFetch(`/api/v1/admin/appointments/${id}`);
  if (!res.ok) {
    await throwApiError(res);
  }
  return (await res.json()) as Appointment;
}

export async function markAppointmentPaid(id: string, note?: string): Promise<Appointment> {
  const res = await apiFetch(`/api/v1/admin/appointments/${id}/mark-paid`, {
    method: "POST",
    body: JSON.stringify({ note: note ?? "" }),
  });
  if (!res.ok) {
    await throwApiError(res);
  }
  return (await res.json()) as Appointment;
}

export async function updateAppointmentStatus(
  id: string,
  status: AppointmentStatus,
  note?: string,
): Promise<Appointment> {
  const res = await apiFetch(`/api/v1/admin/appointments/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, note: note ?? "" }),
  });
  if (!res.ok) {
    await throwApiError(res);
  }
  return (await res.json()) as Appointment;
}
