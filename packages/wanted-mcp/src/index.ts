#!/usr/bin/env node

import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createMcpServer, startStdioServer } from "@theorvane/type-mcp";
import { loadWantedConfig } from "./config.js";
import { WantedMcpServer } from "./server.js";
import { WantedClient } from "./wanted-client.js";

export async function start(): Promise<void> {
  const config = loadWantedConfig(process.env);
  const client = new WantedClient(config);
  const server = await createMcpServer(WantedMcpServer, {
    resolve: () => Object.assign(new WantedMcpServer(), { client }),
  });

  await startStdioServer(server);
}

const entrypoint = process.argv[1] ? resolve(process.argv[1]) : undefined;
if (entrypoint === fileURLToPath(import.meta.url)) {
  void start().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Unknown error";
    process.stderr.write(`Unable to start wanted-mcp: ${message}\n`);
    process.exitCode = 1;
  });
}
