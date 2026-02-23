export const API_BASE_URL = (() => {
  if (process.env.NEXT_PUBLIC_API_BASE_URL) return process.env.NEXT_PUBLIC_API_BASE_URL;
  if (typeof window !== "undefined") {
    // Dynamically point to port 4000 on the same host (PC IP)
    return `http://${window.location.hostname}:4000`;
  }
  return "http://localhost:4000";
})();

type ApiOptions = RequestInit & { json?: unknown; timeoutMs?: number };

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
      try {
        const data = await res.json();
        if (typeof data?.message === "string") message = data.message;
      } catch {}
      throw new Error(message);
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
