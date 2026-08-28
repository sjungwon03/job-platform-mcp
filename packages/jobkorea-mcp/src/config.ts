import { JobKoreaConfigError } from "./errors.js";

const DEFAULT_TIMEOUT_MS = 10_000;

export interface JobKoreaConfig {
  readonly jobsApiUrl?: string;
  readonly entryApiUrl?: string;
  readonly requestTimeoutMs: number;
}

function issuedUrl(
  rawValue: string | undefined,
  variableName: string,
): string | undefined {
  const value = rawValue?.trim();
  if (!value) return undefined;

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new JobKoreaConfigError(`${variableName} must be a valid URL`);
  }

  if (url.protocol !== "https:") {
    throw new JobKoreaConfigError(`${variableName} must use HTTPS`);
  }
  if (
    url.hostname !== "jobkorea.co.kr" &&
    !url.hostname.endsWith(".jobkorea.co.kr")
  ) {
    throw new JobKoreaConfigError(
      `${variableName} must point to a jobkorea.co.kr host`,
    );
  }

  return url.toString();
}

export function loadJobKoreaConfig(
  env: NodeJS.ProcessEnv,
): Readonly<JobKoreaConfig> {
  if (env.JOBKOREA_API_USE_APPROVED?.trim().toLowerCase() !== "true") {
    throw new JobKoreaConfigError(
      "Set JOBKOREA_API_USE_APPROVED=true only after JobKorea approved the institution, service, server IP, and use purpose",
    );
  }

  const jobsApiUrl = issuedUrl(
    env.JOBKOREA_JOBS_API_URL,
    "JOBKOREA_JOBS_API_URL",
  );
  const entryApiUrl = issuedUrl(
    env.JOBKOREA_ENTRY_API_URL,
    "JOBKOREA_ENTRY_API_URL",
  );
  if (!jobsApiUrl && !entryApiUrl) {
    throw new JobKoreaConfigError(
      "Set JOBKOREA_JOBS_API_URL or JOBKOREA_ENTRY_API_URL",
    );
  }

  const requestTimeoutMs = Number(
    env.JOBKOREA_REQUEST_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS,
  );
  if (!Number.isSafeInteger(requestTimeoutMs) || requestTimeoutMs <= 0) {
    throw new JobKoreaConfigError(
      "JOBKOREA_REQUEST_TIMEOUT_MS must be a positive integer",
    );
  }

  return Object.freeze({ jobsApiUrl, entryApiUrl, requestTimeoutMs });
}
