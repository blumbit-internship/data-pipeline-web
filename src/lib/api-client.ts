import { getAccessToken, tryRefreshAccessToken } from "@/lib/auth";

export async function fetchJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers ?? undefined);
  const access = getAccessToken();
  if (access && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${access}`);
  }

  let response = await fetch(input, { ...init, headers });
  if (response.status === 401) {
    const refreshed = await tryRefreshAccessToken();
    if (refreshed) {
      headers.set("Authorization", `Bearer ${refreshed}`);
      response = await fetch(input, { ...init, headers });
    }
  }

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
