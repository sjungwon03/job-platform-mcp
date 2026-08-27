#!/usr/bin/env node

import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createMcpServer, startStdioServer } from "@theorvane/type-mcp";
import { loadJobKoreaConfig } from "./config.js";
import { JobKoreaClient } from "./jobkorea-client.js";
import { JobKoreaMcpServer } from "./server.js";

export async function start(): Promise<void> {
  const config = loadJobKoreaConfig(process.env);
  const client = new JobKoreaClient(config);
  const server = await createMcpServer(JobKoreaMcpServer, {
    resolve: () => Object.assign(new JobKoreaMcpServer(), { client }),
  });

  await startStdioServer(server);
}

const entrypoint = process.argv[1] ? resolve(process.argv[1]) : undefined;
if (entrypoint === fileURLToPath(import.meta.url)) {
  void start().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Unknown error";
    process.stderr.write(`Unable to start jobkorea-mcp: ${message}\n`);
    process.exitCode = 1;
  });
}
