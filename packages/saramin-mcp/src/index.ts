#!/usr/bin/env node

import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createMcpServer, startStdioServer } from "@theorvane/type-mcp";
import { loadSaraminConfig } from "./config.js";
import { SaraminClient } from "./saramin-client.js";
import { SaraminMcpServer } from "./server.js";

export async function start(): Promise<void> {
  const config = loadSaraminConfig(process.env);
  const client = new SaraminClient(config);
  const server = await createMcpServer(SaraminMcpServer, {
    resolve: () => Object.assign(new SaraminMcpServer(), { client }),
  });

  await startStdioServer(server);
}

const entrypoint = process.argv[1] ? resolve(process.argv[1]) : undefined;
if (entrypoint === fileURLToPath(import.meta.url)) {
  void start().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Unknown error";
    process.stderr.write(`Unable to start saramin-mcp: ${message}\n`);
    process.exitCode = 1;
  });
}
