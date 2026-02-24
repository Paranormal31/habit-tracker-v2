export const API_BASE_URL = (() => {
  if (process.env.NEXT_PUBLIC_API_BASE_URL) return process.env.NEXT_PUBLIC_API_BASE_URL;
  if (typeof window !== "undefined") {
    // Dynamically point to port 4000 on the same host (PC IP)
    return `http://${window.location.hostname}:4000`;
  }
  return "http://localhost:4000";
})();

type ApiOptions = RequestInit & { json?: unknown; timeoutMs?: number };
type ApiIssue = {
  path?: Array<string | number>;
  message?: string;
  code?: string;
};

export class ApiError extends Error {
  status: number;
  issues: ApiIssue[];

  constructor(message: string, status: number, issues: ApiIssue[] = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.issues = issues;
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
      try {
        const data = await res.json();
        if (typeof data?.message === "string") message = data.message;
        if (Array.isArray(data?.issues)) issues = data.issues;
      } catch {}
      throw new ApiError(message, res.status, issues);
    }

    return res.json();
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("Request timed out");
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}
