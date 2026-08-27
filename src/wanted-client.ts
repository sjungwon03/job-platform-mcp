import type { WantedConfig } from "./config.js";
import { WantedApiError } from "./errors.js";

type Fetch = typeof fetch;
type QueryValue = string | number | boolean;
export type Query = Record<
  string,
  QueryValue | readonly QueryValue[] | undefined
>;

interface WantedEnvelope<T> {
  data: T;
}

export class WantedClient {
  constructor(
    private readonly config: WantedConfig,
    private readonly request: Fetch = fetch,
  ) {}

  async get<T>(path: string, query: Query = {}): Promise<T> {
    const url = new URL(`${this.config.baseUrl}/${path.replace(/^\//, "")}`);

    for (const [key, rawValue] of Object.entries(query)) {
      if (rawValue === undefined) continue;
      const values = Array.isArray(rawValue) ? rawValue : [rawValue];
      for (const value of values) url.searchParams.append(key, String(value));
    }

    let response: Response;
    try {
      response = await this.request(url, {
        method: "GET",
        headers: {
          accept: "application/json",
          "wanted-client-id": this.config.clientId,
          "wanted-client-secret": this.config.clientSecret,
          ...(this.config.authorization
            ? { Authorization: this.config.authorization }
            : {}),
        },
        signal: AbortSignal.timeout(this.config.requestTimeoutMs),
      });
    } catch {
      throw new WantedApiError(
        "Wanted OpenAPI request failed before a response",
      );
    }

    if (!response.ok) {
      throw new WantedApiError(
        `Wanted OpenAPI request failed (HTTP ${response.status})`,
        response.status,
      );
    }

    const body: unknown = await response.json();
    if (body && typeof body === "object" && "data" in body) {
      return (body as WantedEnvelope<T>).data;
    }

    return body as T;
  }
}
