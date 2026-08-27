import { describe, expect, it } from "vitest";
import type { SaraminConfig } from "../src/config.js";
import { SaraminClient } from "../src/saramin-client.js";

const config: SaraminConfig = {
  baseUrl: "https://oapi.saramin.co.kr",
  accessKey: "user-access-key",
  requestTimeoutMs: 1_000,
};

describe("SaraminClient", () => {
  it("adds the access key and joins multi-value filters", async () => {
    let requestedUrl: URL | undefined;
    let requestedInit: RequestInit | undefined;
    const request: typeof fetch = async (input, options) => {
      requestedUrl = new URL(
        input instanceof Request ? input.url : input.toString(),
      );
      requestedInit = options;
      return new Response(JSON.stringify({ jobs: { job: [] } }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    };

    const client = new SaraminClient(config, request);
    const result = await client.get("job-search", {
      job_cd: ["101", "202"],
      count: 20,
    });

    expect(result).toEqual({ jobs: { job: [] } });
    expect(requestedUrl?.pathname).toBe("/job-search");
    expect(requestedUrl?.searchParams.get("access-key")).toBe(
      "user-access-key",
    );
    expect(requestedUrl?.searchParams.get("job_cd")).toBe("101,202");
    expect(requestedUrl?.searchParams.get("count")).toBe("20");
    expect(new Headers(requestedInit?.headers).get("accept")).toBe(
      "application/json",
    );
  });

  it("maps a Saramin quota error without exposing the access key", async () => {
    const request: typeof fetch = async () =>
      new Response(JSON.stringify({ code: 4, message: "quota exceeded" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    const client = new SaraminClient(config, request);

    const failure = client.get("job-search");
    await expect(failure).rejects.toThrow("code 4");
    await expect(failure).rejects.not.toThrow("user-access-key");
  });
});
