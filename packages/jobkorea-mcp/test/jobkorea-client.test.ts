import { describe, expect, it } from "vitest";
import type { JobKoreaConfig } from "../src/config.js";
import { JobKoreaClient } from "../src/jobkorea-client.js";

const config: JobKoreaConfig = {
  jobsApiUrl: "https://api.jobkorea.co.kr/jobs?issued-token=user-secret",
  entryApiUrl: "https://api.jobkorea.co.kr/entry",
  requestTimeoutMs: 1_000,
};

describe("JobKoreaClient", () => {
  it("preserves issued parameters and adds approved filters", async () => {
    let requestedUrl: URL | undefined;
    const request: typeof fetch = async (input) => {
      requestedUrl = new URL(
        input instanceof Request ? input.url : input.toString(),
      );
      return new Response(JSON.stringify({ jobs: [] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    };
    const client = new JobKoreaClient(config, request);

    await expect(
      client.fetchFeed("jobs", { region: "서울", count: 100 }),
    ).resolves.toEqual({ jobs: [] });
    expect(requestedUrl?.searchParams.get("issued-token")).toBe("user-secret");
    expect(requestedUrl?.searchParams.get("region")).toBe("서울");
    expect(requestedUrl?.searchParams.get("count")).toBe("100");
  });

  it("does not allow overriding parameters embedded in the issued URL", async () => {
    const request: typeof fetch = async () => new Response("unused");
    const client = new JobKoreaClient(config, request);

    await expect(
      client.fetchFeed("jobs", { "issued-token": "replacement" }),
    ).rejects.toThrow("Cannot override");
  });

  it("returns XML feeds as text", async () => {
    const request: typeof fetch = async () =>
      new Response("<jobs><job /></jobs>", {
        status: 200,
        headers: { "content-type": "application/xml" },
      });
    const client = new JobKoreaClient(config, request);

    await expect(client.fetchFeed("entryJobs")).resolves.toBe(
      "<jobs><job /></jobs>",
    );
  });
});
