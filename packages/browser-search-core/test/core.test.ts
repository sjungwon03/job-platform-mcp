import { describe, expect, it } from "vitest";
import {
  browserSearchInputSchema,
  loadBrowserConfig,
  VisibleBrowserCrawler,
} from "../src/index.js";

describe("browser search core", () => {
  it("uses safe visible-browser defaults without credentials", () => {
    expect(loadBrowserConfig({})).toEqual({
      browserChannel: "chrome",
      browserExecutablePath: undefined,
      requestTimeoutMs: 30_000,
      settleMs: 2_000,
    });
  });

  it("requires personal-use acknowledgement and caps visible results", () => {
    expect(() => browserSearchInputSchema.parse({ query: "백엔드" })).toThrow();
    expect(() =>
      browserSearchInputSchema.parse({
        query: "백엔드",
        limit: 21,
        acknowledgePersonalUse: true,
      }),
    ).toThrow();
  });

  it("rejects an unapproved host before launching a browser", async () => {
    const crawler = new VisibleBrowserCrawler(loadBrowserConfig({}), {
      provider: "wanted",
      hostname: "www.wanted.co.kr",
      linkSelector: 'a[href*="/wd/"]',
      isJobUrl: (url) => /^\/wd\/\d+/.test(url.pathname),
    });

    await expect(
      crawler.search(new URL("https://example.com/jobs"), 10, []),
    ).rejects.toThrow("only allows");
  });
});
