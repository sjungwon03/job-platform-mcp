import { constants } from "node:fs";
import {
  access,
  chmod,
  lstat,
  mkdir,
  readFile,
  rename,
  unlink,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";

export const STORE_VERSION = 1;

export const PLATFORM_KEYS = Object.freeze({
  wanted: [
    "WANTED_CLIENT_ID",
    "WANTED_CLIENT_SECRET",
    "WANTED_AUTHORIZATION",
  ],
  saramin: ["SARAMIN_ACCESS_KEY"],
  jobkorea: ["JOBKOREA_JOBS_API_URL", "JOBKOREA_ENTRY_API_URL"],
});

export const KNOWN_KEYS = new Set(Object.values(PLATFORM_KEYS).flat());

export function getStorePath(env = process.env) {
  const override = env.JOB_MATCH_CREDENTIALS_FILE?.trim();
  if (override) {
    if (!path.isAbsolute(override)) {
      throw new Error("JOB_MATCH_CREDENTIALS_FILE must be an absolute path");
    }
    return path.normalize(override);
  }

  const configuredRoot = env.XDG_CONFIG_HOME?.trim();
  if (configuredRoot && !path.isAbsolute(configuredRoot)) {
    throw new Error("XDG_CONFIG_HOME must be an absolute path");
  }
  const configRoot = configuredRoot || path.join(os.homedir(), ".config");
  return path.join(configRoot, "job-platform-mcp", "credentials.json");
}

function validateCredentials(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Credential store has an invalid credentials object");
  }

  const credentials = {};
  for (const [key, secret] of Object.entries(value)) {
    if (!KNOWN_KEYS.has(key) || typeof secret !== "string" || !secret) {
      throw new Error("Credential store contains an invalid entry");
    }
    credentials[key] = secret;
  }
  return credentials;
}

async function assertSafeFile(filePath) {
  const stats = await lstat(filePath);
  if (stats.isSymbolicLink() || !stats.isFile()) {
    throw new Error("Credential store must be a regular file, not a symlink");
  }
  if (typeof process.getuid === "function" && stats.uid !== process.getuid()) {
    throw new Error("Credential store must be owned by the current user");
  }
  if (process.platform !== "win32" && (stats.mode & 0o077) !== 0) {
    throw new Error(
      "Credential store permissions are too broad; run chmod 600 on the file",
    );
  }
}

export async function loadCredentialStore(
  filePath = getStorePath(),
  { allowMissing = true } = {},
) {
  try {
    await access(filePath, constants.F_OK);
  } catch (error) {
    if (allowMissing && error?.code === "ENOENT") {
      return {};
    }
    throw error;
  }

  await assertSafeFile(filePath);
  const parsed = JSON.parse(await readFile(filePath, "utf8"));
  if (parsed?.version !== STORE_VERSION) {
    throw new Error("Credential store version is not supported");
  }
  return validateCredentials(parsed.credentials);
}

export async function saveCredentialStore(
  credentials,
  filePath = getStorePath(),
) {
  const validated = validateCredentials(credentials);
  const directory = path.dirname(filePath);
  await mkdir(directory, { recursive: true, mode: 0o700 });

  try {
    await assertSafeFile(filePath);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }

  const temporaryPath =
    filePath + ".tmp-" + process.pid + "-" + Date.now().toString(36);
  const body =
    JSON.stringify(
      { version: STORE_VERSION, credentials: validated },
      null,
      2,
    ) + "\n";

  try {
    await writeFile(temporaryPath, body, {
      encoding: "utf8",
      flag: "wx",
      mode: 0o600,
    });
    await chmod(temporaryPath, 0o600);
    await assertSafeFile(temporaryPath);
    await rename(temporaryPath, filePath);
    await chmod(filePath, 0o600);
    await assertSafeFile(filePath);
  } catch (error) {
    try {
      await unlink(temporaryPath);
    } catch {}
    throw error;
  }
}

export function configuredPlatforms(credentials) {
  return {
    wanted: Boolean(
      credentials.WANTED_CLIENT_ID && credentials.WANTED_CLIENT_SECRET,
    ),
    saramin: Boolean(credentials.SARAMIN_ACCESS_KEY),
    jobkorea: Boolean(
      credentials.JOBKOREA_JOBS_API_URL ||
        credentials.JOBKOREA_ENTRY_API_URL,
    ),
  };
}
