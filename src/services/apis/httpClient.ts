import { API_TIMEOUT_MS } from "@/config/app";
import type { BudgetApiErrorResponse } from "@/types";

export class HttpError extends Error {
  status: number;
  code: BudgetApiErrorResponse["code"];
  details?: unknown;

  constructor(
    message: string,
    status: number,
    code: BudgetApiErrorResponse["code"],
    details?: unknown
  ) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export async function fetchJson<TResponse>(
  url: string,
  init: RequestInit & { timeoutMs?: number } = {}
): Promise<TResponse> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), init.timeoutMs ?? API_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        accept: "application/json",
        ...(init.body ? { "content-type": "application/json" } : {}),
        ...(init.headers ?? {})
      }
    });

    const text = await response.text();
    const payload = text ? (JSON.parse(text) as TResponse) : ({} as TResponse);

    if (!response.ok) {
      throw new HttpError(
        (payload as { message?: string }).message ?? response.statusText,
        response.status,
        response.status === 401
          ? "unauthorized"
          : response.status === 429
            ? "rate_limited"
            : response.status >= 500
              ? "upstream_unavailable"
              : "invalid_response",
        payload
      );
    }

    return payload;
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }

    if (error instanceof DOMException && error.name === "AbortError") {
      throw new HttpError("Request timed out", 408, "timeout");
    }

    throw new HttpError("Network request failed", 0, "network_error", error);
  } finally {
    window.clearTimeout(timeout);
  }
}
