import type { JobKoreaConfig } from "./config.js";
import { JobKoreaApiError, JobKoreaConfigError } from "./errors.js";

type Fetch = typeof fetch;
type QueryValue = string | number | boolean;
export type JobKoreaQuery = Record<string, QueryValue | undefined>;
export type JobKoreaFeed = "jobs" | "entryJobs";

export class JobKoreaClient {
  constructor(
    private readonly config: JobKoreaConfig,
    private readonly request: Fetch = fetch,
  ) {}

  async fetchFeed<T>(
    feed: JobKoreaFeed,
    parameters: JobKoreaQuery = {},
  ): Promise<T | string> {
    const issuedUrl =
      feed === "jobs" ? this.config.jobsApiUrl : this.config.entryApiUrl;
    if (!issuedUrl) {
      const variable =
        feed === "jobs" ? "JOBKOREA_JOBS_API_URL" : "JOBKOREA_ENTRY_API_URL";
      throw new JobKoreaConfigError(
        `Missing required configuration: ${variable}`,
      );
    }

    const url = new URL(issuedUrl);
    for (const [key, value] of Object.entries(parameters)) {
      if (value === undefined) continue;
      if (url.searchParams.has(key)) {
        throw new JobKoreaApiError(
          "Cannot override a parameter embedded in the issued JobKorea URL",
        );
      }
      url.searchParams.set(key, String(value));
    }

    let response: Response;
    try {
      response = await this.request(url, {
        method: "GET",
        headers: {
          accept: "application/json, application/xml;q=0.9, text/xml;q=0.8",
        },
        signal: AbortSignal.timeout(this.config.requestTimeoutMs),
      });
    } catch {
      throw new JobKoreaApiError(
        "JobKorea API request failed before a response",
      );
    }

    if (!response.ok) {
      throw new JobKoreaApiError(
        `JobKorea API request failed (HTTP ${response.status})`,
        response.status,
      );
    }

    const text = await response.text();
    if (response.headers.get("content-type")?.includes("application/json")) {
      try {
        return JSON.parse(text) as T;
      } catch {
        throw new JobKoreaApiError("JobKorea returned invalid JSON");
      }
    }

    return text;
  }
}
