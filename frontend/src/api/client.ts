/**
 * The one place the app talks to the network.
 *
 * Everything is typed from the generated schema, and every response passes
 * through a Zod guard at the boundary so a backend contract change surfaces as
 * a loud error in development instead of `undefined` rendering as blank space.
 */

export const API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

export class ApiError extends Error {
  readonly status: number;
  readonly url: string;
  readonly body: unknown;

  constructor(message: string, status: number, url: string, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.url = url;
    this.body = body;
  }
}

export interface FetchOptions extends RequestInit {
  /** Milliseconds before the request is aborted. Defaults to 10s. */
  timeoutMs?: number;
}

/**
 * Typed fetch wrapper. `parse` is the Zod guard for the expected shape — pass it
 * so the caller gets a validated value rather than a hopeful cast.
 */
export async function fetchApi<T>(
  path: string,
  parse: (data: unknown) => T,
  options: FetchOptions = {},
): Promise<T> {
  const { timeoutMs = 10_000, ...init } = options;
  const url = `${API_BASE}${path}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: { Accept: "application/json", ...init.headers },
    });
  } catch (cause) {
    clearTimeout(timer);
    if (cause instanceof DOMException && cause.name === "AbortError") {
      throw new ApiError(`Request timed out after ${timeoutMs}ms`, 0, url);
    }
    throw new ApiError("Network request failed", 0, url, cause);
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    const body = await safeJson(response);
    throw new ApiError(`${response.status} ${response.statusText}`, response.status, url, body);
  }

  const data: unknown = await response.json();
  return parse(data);
}

/** POST JSON and return the parsed response, surfacing DRF field errors as-is. */
export async function postJson<T>(
  path: string,
  payload: unknown,
  parse: (data: unknown) => T,
): Promise<T> {
  return fetchApi<T>(path, parse, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

async function safeJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

/** Turn a DRF validation-error body into flat, human-readable messages. */
export function fieldErrors(error: unknown): Record<string, string> {
  if (!(error instanceof ApiError) || typeof error.body !== "object" || error.body === null) {
    return {};
  }
  const result: Record<string, string> = {};
  for (const [field, messages] of Object.entries(error.body as Record<string, unknown>)) {
    if (Array.isArray(messages)) {
      result[field] = messages.map(String).join(" ");
    } else if (typeof messages === "string") {
      result[field] = messages;
    }
  }
  return result;
}
