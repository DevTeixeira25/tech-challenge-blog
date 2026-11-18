export type Role = "TEACHER" | "STUDENT";
export type User = { id: string; name: string; email: string; role: Role };
export type Post = {
  id: string;
  title: string;
  content: string;
  author: string;
  createdAt: string;
  updatedAt: string;
};
export type Page<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};
export const API_URL = (
  process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000"
).replace(/\/$/, "");
let token: string | null = null;
let onUnauthorized: (() => void) | null = null;
export function configureSession(value: string | null, callback?: () => void) {
  token = value;
  if (callback) onUnauthorized = callback;
}
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const requestToken = token;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(requestToken ? { Authorization: `Bearer ${requestToken}` } : {}),
        ...options.headers,
      },
    });
    if (response.status === 204) return undefined as T;
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (
        response.status === 401 &&
        requestToken &&
        requestToken === token &&
        path !== "/auth/login"
      )
        onUnauthorized?.();
      const details =
        body.details && typeof body.details === "object"
          ? Object.values(body.details).flat().filter(Boolean).join(". ")
          : "";
      throw new ApiError(
        response.status,
        `${body.message || "Não foi possível concluir a solicitação."}${details ? `: ${details}` : ""}`,
      );
    }
    return body as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new Error(
      "Não foi possível conectar ao servidor. Confira sua conexão e tente novamente.",
    );
  } finally {
    clearTimeout(timer);
  }
}
export function message(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Ocorreu um erro. Tente novamente.";
}
export const json = (method: string, body?: unknown): RequestInit => ({
  method,
  ...(body ? { body: JSON.stringify(body) } : {}),
});
export const pathId = (id: string) => encodeURIComponent(id);
