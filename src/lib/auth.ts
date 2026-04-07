import { backendRoutes } from "@/lib/backend_routes";

const ACCESS_TOKEN_KEY = "auth.accessToken";
const REFRESH_TOKEN_KEY = "auth.refreshToken";

export interface AuthUser {
  id: number;
  username: string;
  email: string;
}

interface AuthResponse {
  user: AuthUser;
  access: string;
  refresh: string;
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(access: string, refresh: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, access);
  localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

async function parseJson<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      typeof payload === "object" && payload && "message" in payload
        ? String((payload as { message?: unknown }).message || "")
        : "";
    throw new Error(message || `Request failed with status ${response.status}`);
  }
  return payload as T;
}

export async function register(username: string, email: string, password: string): Promise<AuthUser> {
  const response = await fetch(backendRoutes.auth.register, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password }),
  });
  const payload = await parseJson<AuthResponse>(response);
  setTokens(payload.access, payload.refresh);
  return payload.user;
}

export async function login(username: string, password: string): Promise<AuthUser> {
  const response = await fetch(backendRoutes.auth.login, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const payload = await parseJson<AuthResponse>(response);
  setTokens(payload.access, payload.refresh);
  return payload.user;
}

export async function fetchMe(): Promise<AuthUser> {
  const access = getAccessToken();
  if (!access) {
    throw new Error("No active session");
  }
  const response = await fetch(backendRoutes.auth.me, {
    headers: { Authorization: `Bearer ${access}` },
  });
  const payload = await parseJson<{ user: AuthUser }>(response);
  return payload.user;
}

export async function logout(): Promise<void> {
  const refresh = getRefreshToken();
  if (refresh) {
    await fetch(backendRoutes.auth.logout, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    }).catch(() => undefined);
  }
  clearTokens();
}

let refreshPromise: Promise<string | null> | null = null;

export async function tryRefreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    const refresh = getRefreshToken();
    if (!refresh) {
      clearTokens();
      return null;
    }
    const response = await fetch(backendRoutes.auth.refresh, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });
    if (!response.ok) {
      clearTokens();
      return null;
    }
    const payload = (await response.json()) as { access: string; refresh: string };
    setTokens(payload.access, payload.refresh);
    return payload.access;
  })();
  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}
