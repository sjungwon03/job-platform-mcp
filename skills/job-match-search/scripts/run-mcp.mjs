#!/usr/bin/env node
import { access } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "../../..");

const SERVERS = {
  wanted: "packages/wanted-mcp/dist/index.js",
  saramin: "packages/saramin-mcp/dist/index.js",
  jobkorea: "packages/jobkorea-mcp/dist/index.js",
};

async function main() {
  const platform = process.argv[2];
  const relativeEntry = SERVERS[platform];
  if (!relativeEntry || process.argv.length !== 3) {
    throw new Error("Usage: run-mcp.mjs <wanted|saramin|jobkorea>");
  }

  const entry = path.join(repositoryRoot, relativeEntry);
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
    env: process.env,
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
