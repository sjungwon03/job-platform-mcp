#!/usr/bin/env node

import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  loadBrowserConfig,
  VisibleBrowserCrawler,
} from "@job-platform/browser-search-core";
import { createMcpServer, serveStdioServer } from "@theorvane/type-mcp";
import { SaraminMcpServer } from "./server.js";

export async function start(): Promise<void> {
  const client = new VisibleBrowserCrawler(loadBrowserConfig(process.env), {
    provider: "saramin",
    hostname: "www.saramin.co.kr",
    linkSelector: 'a[href*="/zf_user/jobs/relay/view"]',
    isJobUrl: (url) =>
      url.pathname === "/zf_user/jobs/relay/view" &&
      /^\d+$/.test(url.searchParams.get("rec_idx") ?? ""),
  });

  serveStdioServer(() =>
    createMcpServer(SaraminMcpServer, {
      resolve: () => Object.assign(new SaraminMcpServer(), { client }),
    }),
  );
}

const entrypoint = process.argv[1] ? resolve(process.argv[1]) : undefined;
if (entrypoint === fileURLToPath(import.meta.url)) {
  void start().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Unknown error";
    process.stderr.write(`Unable to start saramin-mcp: ${message}\n`);
    process.exitCode = 1;
  });
}
