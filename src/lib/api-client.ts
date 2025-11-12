const DEFAULT_TIMEOUT_MS = 10_000;

type ApiClientInit = Omit<RequestInit, "body"> & {
  token?: string;
  json?: unknown;
  timeoutMs?: number;
};

export type ApiResponseEnvelope<T> = {
  data: T;
};

export class ApiError extends Error {
  status: number;
  body: unknown;
  cause?: unknown;

  constructor(message: string, status: number, body: unknown, options?: { cause?: unknown }) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
    this.cause = options?.cause;
  }
}

export function getApiBaseUrl(): string | null {
  const explicit =
    process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.API_BASE_URL ?? null;

  if (explicit) {
    return explicit.replace(/\/+$/, "");
  }

  if (process.env.NODE_ENV !== "production") {
    return "http://localhost:4000";
  }

  return null;
}

function ensureBaseUrl(): string {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) {
    throw new ApiError(
      "API base URL is not configured. Set NEXT_PUBLIC_API_BASE_URL or API_BASE_URL.",
      500,
      null,
    );
  }
  return baseUrl;
}

function mergeHeaders(init?: HeadersInit): Headers {
  if (init instanceof Headers) {
    return new Headers(init);
  }

  const headers = new Headers();
  if (Array.isArray(init)) {
    init.forEach(([key, value]) => headers.append(key, value));
  } else if (init) {
    Object.entries(init).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((item) => headers.append(key, item));
      } else if (value !== undefined) {
        headers.append(key, value);
      }
    });
  }

  return headers;
}

function handleUnauthorized() {
  try {
    const { logout } = useAuthStore.getState();
    logout();
  } catch {
    // store not initialised on server; ignore logout
  }

  if (typeof window !== "undefined") {
    const currentPath = window.location.pathname + window.location.search;
    const loginUrl =
      currentPath && !currentPath.startsWith("/login")
        ? `/login?next=${encodeURIComponent(currentPath)}`
        : "/login";
    if (window.location.pathname !== loginUrl) {
      window.location.replace(loginUrl);
    }
  }
}

export async function apiFetch<T>(
  path: string,
  init: ApiClientInit = {},
): Promise<T> {
  const baseUrl = ensureBaseUrl();
  const url = path.startsWith("http")
    ? path
    : `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;

  const { token, json, timeoutMs, ...requestInit } = init;
  const controller = new AbortController();
  const timeout = timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  const headers = mergeHeaders(requestInit.headers);
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (json !== undefined) {
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    requestInit.body = JSON.stringify(json);
  }

  try {
    const response = await fetch(url, {
      ...requestInit,
      headers,
      cache: requestInit.cache ?? "no-store",
      signal: controller.signal,
    });

    const contentType = response.headers.get("content-type") ?? "";
    const isJson = contentType.includes("application/json");

    const payload = isJson ? await response.json().catch(() => null) : null;

    if (!response.ok) {
      if (response.status === 401) {
        handleUnauthorized();
      }
      throw new ApiError(
        `API request failed with status ${response.status}`,
        response.status,
        payload,
      );
    }

    return (payload as T) ?? ({} as T);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    if (error instanceof Error && error.name === "AbortError") {
      throw new ApiError(
        `Request timed out after ${timeout} ms`,
        0,
        null,
        { cause: error },
      );
    }
    throw new ApiError(
      "Network request failed",
      0,
      null,
      { cause: error instanceof Error ? error : undefined },
    );
  } finally {
    clearTimeout(timeoutId);
  }
}
