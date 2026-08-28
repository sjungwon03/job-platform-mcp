#!/usr/bin/env node
import { access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import {
  getStorePath,
  KNOWN_KEYS,
  loadCredentialStore,
  PLATFORM_KEYS,
} from "./credential-store.mjs";
import { assertApprovedUse } from "./provider-policy.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "../../..");

const SERVERS = {
  wanted: {
    entry: "packages/wanted-mcp/dist/index.js",
    required: ["WANTED_CLIENT_ID", "WANTED_CLIENT_SECRET"],
  },
  saramin: {
    entry: "packages/saramin-mcp/dist/index.js",
    required: ["SARAMIN_ACCESS_KEY"],
  },
  jobkorea: {
    entry: "packages/jobkorea-mcp/dist/index.js",
    requiredAny: ["JOBKOREA_JOBS_API_URL", "JOBKOREA_ENTRY_API_URL"],
  },
};

async function main() {
  const platform = process.argv[2];
  const server = SERVERS[platform];
  if (!server || process.argv.length !== 3) {
    throw new Error("Usage: run-mcp.mjs <wanted|saramin|jobkorea>");
  }

  const inherited = { ...process.env };
  assertApprovedUse(platform, inherited);
  const credentials = await loadCredentialStore(getStorePath());
  const childEnvironment = { ...inherited };

  for (const key of KNOWN_KEYS) delete childEnvironment[key];
  for (const key of PLATFORM_KEYS[platform]) {
    const value = credentials[key] || inherited[key];
    if (value) childEnvironment[key] = value;
  }

  for (const required of server.required ?? []) {
    if (!childEnvironment[required]) {
      throw new Error("Missing required configuration: " + required);
    }
  }
  if (
    server.requiredAny &&
    !server.requiredAny.some((key) => childEnvironment[key])
  ) {
    throw new Error(
      "Set one of: " + server.requiredAny.join(", "),
    );
  }

  const entry = path.join(repositoryRoot, server.entry);
  try {
    await access(entry);
  } catch {
    throw new Error(
      "Built MCP entry not found. Run pnpm --filter " +
        platform +
        "-mcp build",
    );
  }

  const child = spawn(process.execPath, [entry], {
    cwd: repositoryRoot,
    env: childEnvironment,
    stdio: "inherit",
  });

  child.on("error", (error) => {
    process.stderr.write("MCP start failed: " + error.message + "\n");
    process.exitCode = 1;
  });
  child.on("exit", (code, signal) => {
    if (signal) {
      process.stderr.write("MCP stopped by signal " + signal + "\n");
      process.exitCode = 1;
      return;
    }
    process.exitCode = code ?? 1;
  });
}

main().catch((error) => {
  process.stderr.write("MCP start failed: " + error.message + "\n");
  process.exitCode = 1;
});
