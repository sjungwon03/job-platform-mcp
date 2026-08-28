#!/usr/bin/env node

import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  loadBrowserConfig,
  VisibleBrowserCrawler,
} from "@job-platform/browser-search-core";
import { createMcpServer, serveStdioServer } from "@theorvane/type-mcp";
import { WantedMcpServer } from "./server.js";

export async function start(): Promise<void> {
  const client = new VisibleBrowserCrawler(loadBrowserConfig(process.env), {
    provider: "wanted",
    hostname: "www.wanted.co.kr",
    linkSelector: 'a[href*="/wd/"]',
    isJobUrl: (url) => /^\/wd\/\d+/.test(url.pathname),
  });

  serveStdioServer(() =>
    createMcpServer(WantedMcpServer, {
      resolve: () => Object.assign(new WantedMcpServer(), { client }),
    }),
  );
}

const entrypoint = process.argv[1] ? resolve(process.argv[1]) : undefined;
if (entrypoint === fileURLToPath(import.meta.url)) {
  void start().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Unknown error";
    process.stderr.write(`Unable to start wanted-mcp: ${message}\n`);
    process.exitCode = 1;
  });
}
