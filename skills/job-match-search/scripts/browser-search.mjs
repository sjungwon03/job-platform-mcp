#!/usr/bin/env node

import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const PROVIDERS = {
  saramin: {
    baseUrl: "https://www.saramin.co.kr/zf_user/search",
    queryParameter: "searchword",
  },
  jobkorea: {
    baseUrl: "https://www.jobkorea.co.kr/Search/",
    queryParameter: "stext",
  },
};

export const SUPPORTED_BROWSER_PROVIDERS = Object.freeze(
  Object.keys(PROVIDERS),
);

export function normalizeSearchQuery(value) {
  if (typeof value !== "string") {
    throw new TypeError("Search query must be a string.");
  }

  const normalized = value.trim().replace(/\s+/g, " ");
  if (!normalized) {
    throw new Error("Search query must not be empty.");
  }
  if (normalized.length > 200) {
    throw new Error("Search query must be 200 characters or fewer.");
  }
  return normalized;
}

export function buildBrowserSearchUrl(provider, query) {
  const definition = PROVIDERS[provider];
  if (!definition) {
    throw new Error(
      "Unsupported provider: " +
        provider +
        ". Expected one of: " +
        SUPPORTED_BROWSER_PROVIDERS.join(", ") +
        ".",
    );
  }

  const url = new URL(definition.baseUrl);
  url.searchParams.set(definition.queryParameter, normalizeSearchQuery(query));
  return url.toString();
}

export function buildBrowserSearchUrls(providers, query) {
  const selected = [...new Set(providers)];
  if (selected.length === 0) {
    throw new Error("Select at least one provider.");
  }

  return selected.map((provider) => ({
    provider,
    url: buildBrowserSearchUrl(provider, query),
  }));
}

export function assertBrowserOpenAllowed(shouldOpen, acknowledgedPersonalUse) {
  if (shouldOpen && !acknowledgedPersonalUse) {
    throw new Error(
      "Opening a browser requires --acknowledge-personal-use after the user accepts the personal, non-commercial use notice.",
    );
  }
}

export function detectBrowserOpenCommand(url, options = {}) {
  const platform = options.platform ?? process.platform;
  const isWsl = options.isWsl ?? detectWsl();

  if (platform === "darwin") {
    return { command: "open", args: [url] };
  }
  if (platform === "win32" || isWsl) {
    return { command: "cmd.exe", args: ["/d", "/s", "/c", "start", "", url] };
  }
  return { command: "xdg-open", args: [url] };
}

function detectWsl() {
  try {
    return /microsoft|wsl/i.test(readFileSync("/proc/version", "utf8"));
  } catch {
    return false;
  }
}

async function openUrl(url) {
  const { command, args } = detectBrowserOpenCommand(url);
  await new Promise((resolveSpawn, rejectSpawn) => {
    const child = spawn(command, args, {
      detached: true,
      stdio: "ignore",
      windowsHide: false,
    });
    child.once("error", rejectSpawn);
    child.once("spawn", () => {
      child.unref();
      resolveSpawn();
    });
  });
}

function parseArguments(argv) {
  const providers = [];
  let query;
  let shouldOpen = false;
  let acknowledgedPersonalUse = false;

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--provider") {
      providers.push(...(argv[++index] ?? "").split(",").filter(Boolean));
    } else if (argument === "--query") {
      query = argv[++index];
    } else if (argument === "--open") {
      shouldOpen = true;
    } else if (argument === "--acknowledge-personal-use") {
      acknowledgedPersonalUse = true;
    } else if (argument === "--help") {
      return { help: true };
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }

  return {
    help: false,
    providers:
      providers.length > 0 ? providers : [...SUPPORTED_BROWSER_PROVIDERS],
    query,
    shouldOpen,
    acknowledgedPersonalUse,
  };
}

function printHelp() {
  process.stdout.write(
    "Usage: node browser-search.mjs --query <text> [--provider saramin,jobkorea] [--open --acknowledge-personal-use]\n",
  );
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  const urls = buildBrowserSearchUrls(options.providers, options.query);
  assertBrowserOpenAllowed(options.shouldOpen, options.acknowledgedPersonalUse);
  if (options.shouldOpen) {
    for (const item of urls) {
      await openUrl(item.url);
    }
  }

  process.stdout.write(
    `${JSON.stringify(
      {
        mode: "browser-assisted-personal",
        query: normalizeSearchQuery(options.query),
        urls,
      },
      null,
      2,
    )}\n`,
  );
}

const isMain =
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
