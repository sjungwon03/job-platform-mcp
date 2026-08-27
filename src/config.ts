import { SaraminConfigError } from "./errors.js";

const DEFAULT_BASE_URL = "https://oapi.saramin.co.kr";
const DEFAULT_TIMEOUT_MS = 10_000;

export interface SaraminConfig {
  readonly baseUrl: string;
  readonly accessKey: string;
  readonly requestTimeoutMs: number;
}

export function loadSaraminConfig(
  env: NodeJS.ProcessEnv,
): Readonly<SaraminConfig> {
  const accessKey = env.SARAMIN_ACCESS_KEY?.trim();
  if (!accessKey) {
    throw new SaraminConfigError(
      "Missing required configuration: SARAMIN_ACCESS_KEY",
    );
  }

  let baseUrl: URL;
  try {
    baseUrl = new URL(env.SARAMIN_API_BASE_URL?.trim() || DEFAULT_BASE_URL);
  } catch {
    throw new SaraminConfigError("SARAMIN_API_BASE_URL must be a valid URL");
  }

  if (baseUrl.protocol !== "https:") {
    throw new SaraminConfigError("SARAMIN_API_BASE_URL must use HTTPS");
  }

  const requestTimeoutMs = Number(
    env.SARAMIN_REQUEST_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS,
  );
  if (!Number.isSafeInteger(requestTimeoutMs) || requestTimeoutMs <= 0) {
    throw new SaraminConfigError(
      "SARAMIN_REQUEST_TIMEOUT_MS must be a positive integer",
    );
  }

  return Object.freeze({
    baseUrl: baseUrl.toString().replace(/\/$/, ""),
    accessKey,
    requestTimeoutMs,
  });
}
