function resolveApiBaseUrl() {
  const configured = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    // If frontend is opened via LAN/IP and env is still localhost,
    // switch API host to current hostname so requests actually reach backend.
    if (configured) {
      try {
        const parsed = new URL(configured);
        const isLocalhostConfig =
          parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
        const isBrowserLocalhost = host === "localhost" || host === "127.0.0.1";
        if (isLocalhostConfig && !isBrowserLocalhost) {
          parsed.hostname = host;
          return parsed.toString().replace(/\/$/, "");
        }
        return configured;
      } catch {
        // Fall through to default host-based behavior for malformed env value.
      }
    }
    return `http://${host}:4000`;
  }

  if (configured) return configured;
  return "http://localhost:4000";
}

export const API_BASE_URL = resolveApiBaseUrl();

type ApiOptions = RequestInit & { json?: unknown; timeoutMs?: number };
type ApiIssue = {
  path?: Array<string | number>;
  message?: string;
  code?: string;
};

export class ApiError extends Error {
  status: number;
  issues: ApiIssue[];
  data?: unknown;

  constructor(message: string, status: number, issues: ApiIssue[] = [], data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.issues = issues;
    this.data = data;
  }
}

export async function apiFetch<T>(
  path: string,
  options: ApiOptions = {}
): Promise<T> {
  const { json, headers, timeoutMs = 60000, signal, ...rest } = options;

  const controller = new AbortController();
  const signals = [controller.signal, signal].filter(Boolean) as AbortSignal[];
  const combinedSignal =
    signals.length === 1
      ? signals[0]
      : typeof AbortSignal !== "undefined" && "any" in AbortSignal
        ? AbortSignal.any(signals)
        : controller.signal;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...rest,
      headers: {
        "Content-Type": "application/json",
        ...(headers || {}),
      },
      credentials: "include",
      body: json ? JSON.stringify(json) : rest.body,
      signal: combinedSignal,
    });

    if (!res.ok) {
      let message = "Request failed";
      let issues: ApiIssue[] = [];
      let data: unknown = undefined;
      try {
        data = await res.json();
        const payload = data as { message?: string; issues?: ApiIssue[] };
        if (typeof payload.message === "string") message = payload.message;
        if (Array.isArray(payload.issues)) issues = payload.issues;
      } catch {}
      throw new ApiError(message, res.status, issues, data);
    }

    return res.json();
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("Request timed out");
    }
    if (err instanceof TypeError) {
      throw new Error(`Cannot reach API server (${API_BASE_URL}). Make sure backend is running.`);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}
