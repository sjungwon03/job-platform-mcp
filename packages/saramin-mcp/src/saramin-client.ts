import type { SaraminConfig } from "./config.js";
import { SaraminApiError } from "./errors.js";

type Fetch = typeof fetch;
type QueryValue = string | number | boolean;
export type SaraminQuery = Record<
  string,
  QueryValue | readonly QueryValue[] | undefined
>;

interface SaraminErrorBody {
  code: number | string;
  message?: string;
}

function saraminErrorCode(body: unknown): number | undefined {
  if (!body || typeof body !== "object" || !("code" in body)) return undefined;
  const code = Number((body as SaraminErrorBody).code);
  return Number.isInteger(code) && code > 0 ? code : undefined;
}

export class SaraminClient {
  constructor(
    private readonly config: SaraminConfig,
    private readonly request: Fetch = fetch,
  ) {}

  async get<T>(path: string, query: SaraminQuery = {}): Promise<T> {
    const url = new URL(`${this.config.baseUrl}/${path.replace(/^\//, "")}`);
    url.searchParams.set("access-key", this.config.accessKey);

    for (const [key, rawValue] of Object.entries(query)) {
      if (rawValue === undefined) continue;
      const value = Array.isArray(rawValue) ? rawValue.join(",") : rawValue;
      url.searchParams.set(key, String(value));
    }

    let response: Response;
    try {
      response = await this.request(url, {
        method: "GET",
        headers: { accept: "application/json" },
        signal: AbortSignal.timeout(this.config.requestTimeoutMs),
      });
    } catch {
      throw new SaraminApiError("Saramin API request failed before a response");
    }

    if (!response.ok) {
      throw new SaraminApiError(
        `Saramin API request failed (HTTP ${response.status})`,
        response.status,
      );
    }

    const body: unknown = await response.json();
    const code = saraminErrorCode(body);
    if (code !== undefined) {
      const message =
        typeof (body as SaraminErrorBody).message === "string"
          ? (body as SaraminErrorBody).message
          : "Unknown error";
      throw new SaraminApiError(
        `Saramin API error (code ${code}): ${message}`,
        response.status,
        code,
      );
    }

    return body as T;
  }
}
