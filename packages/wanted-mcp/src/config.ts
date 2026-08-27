import { WantedConfigError } from "./errors.js";

const DEFAULT_BASE_URL = "https://openapi.wanted.jobs/v2";
const DEFAULT_TIMEOUT_MS = 10_000;

export interface WantedConfig {
  readonly baseUrl: string;
  readonly clientId: string;
  readonly clientSecret: string;
  readonly authorization?: string;
  readonly requestTimeoutMs: number;
}

function required(env: NodeJS.ProcessEnv, name: string): string {
  const value = env[name]?.trim();
  if (!value) {
    throw new WantedConfigError(`Missing required configuration: ${name}`);
  }
  return value;
}

export function loadWantedConfig(
  env: NodeJS.ProcessEnv,
): Readonly<WantedConfig> {
  const rawBaseUrl = env.WANTED_API_BASE_URL?.trim() || DEFAULT_BASE_URL;
  let baseUrl: URL;

  try {
    baseUrl = new URL(rawBaseUrl);
  } catch {
    throw new WantedConfigError("WANTED_API_BASE_URL must be a valid URL");
  }

  if (baseUrl.protocol !== "https:") {
    throw new WantedConfigError("WANTED_API_BASE_URL must use HTTPS");
  }

  const requestTimeoutMs = Number(
    env.WANTED_REQUEST_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS,
  );
  if (!Number.isSafeInteger(requestTimeoutMs) || requestTimeoutMs <= 0) {
    throw new WantedConfigError(
      "WANTED_REQUEST_TIMEOUT_MS must be a positive integer",
    );
  }

  return Object.freeze({
    baseUrl: baseUrl.toString().replace(/\/$/, ""),
    clientId: required(env, "WANTED_CLIENT_ID"),
    clientSecret: required(env, "WANTED_CLIENT_SECRET"),
    authorization: env.WANTED_AUTHORIZATION?.trim() || undefined,
    requestTimeoutMs,
  });
}
