import assert from "node:assert/strict";
import test from "node:test";

import {
  assertBrowserOpenAllowed,
  buildBrowserSearchUrl,
  buildBrowserSearchUrls,
  detectBrowserOpenCommand,
  normalizeSearchQuery,
} from "../scripts/browser-search.mjs";

test("normalizes whitespace without changing search intent", () => {
  assert.equal(
    normalizeSearchQuery("  백엔드   서울  Java "),
    "백엔드 서울 Java",
  );
});

test("rejects empty and oversized queries", () => {
  assert.throws(() => normalizeSearchQuery("   "), /must not be empty/);
  assert.throws(() => normalizeSearchQuery("a".repeat(201)), /200 characters/);
});

test("builds Saramin and JobKorea public browser search URLs", () => {
  const saramin = new URL(buildBrowserSearchUrl("saramin", "백엔드 서울"));
  const jobkorea = new URL(buildBrowserSearchUrl("jobkorea", "백엔드 서울"));

  assert.equal(saramin.origin, "https://www.saramin.co.kr");
  assert.equal(saramin.pathname, "/zf_user/search");
  assert.equal(saramin.searchParams.get("searchword"), "백엔드 서울");

  assert.equal(jobkorea.origin, "https://www.jobkorea.co.kr");
  assert.equal(jobkorea.pathname, "/Search/");
  assert.equal(jobkorea.searchParams.get("stext"), "백엔드 서울");
});

test("rejects arbitrary providers and removes duplicates", () => {
  assert.throws(
    () => buildBrowserSearchUrl("example", "backend"),
    /Unsupported provider/,
  );

  assert.deepEqual(buildBrowserSearchUrls(["saramin", "saramin"], "backend"), [
    {
      provider: "saramin",
      url: "https://www.saramin.co.kr/zf_user/search?searchword=backend",
    },
  ]);
});

test("requires an explicit personal-use acknowledgement before opening a browser", () => {
  assert.doesNotThrow(() => assertBrowserOpenAllowed(false, false));
  assert.doesNotThrow(() => assertBrowserOpenAllowed(true, true));
  assert.throws(
    () => assertBrowserOpenAllowed(true, false),
    /--acknowledge-personal-use/,
  );
});

test("selects a visible browser launcher without a shell", () => {
  assert.deepEqual(
    detectBrowserOpenCommand("https://example.com", {
      platform: "darwin",
      isWsl: false,
    }),
    { command: "open", args: ["https://example.com"] },
  );
  assert.deepEqual(
    detectBrowserOpenCommand("https://example.com", {
      platform: "linux",
      isWsl: false,
    }),
    { command: "xdg-open", args: ["https://example.com"] },
  );
  assert.deepEqual(
    detectBrowserOpenCommand("https://example.com", {
      platform: "linux",
      isWsl: true,
    }),
    {
      command: "cmd.exe",
      args: ["/d", "/s", "/c", "start", "", "https://example.com"],
    },
  );
  assert.deepEqual(
    detectBrowserOpenCommand("https://example.com", {
      platform: "win32",
      isWsl: false,
    }),
    {
      command: "cmd.exe",
      args: ["/d", "/s", "/c", "start", "", "https://example.com"],
    },
  );
});
