import { describe, expect, it } from "vitest";
import type { WantedConfig } from "../src/config.js";
import { WantedClient } from "../src/wanted-client.js";

const config: WantedConfig = {
  baseUrl: "https://openapi.wanted.jobs/v2",
  clientId: "user-client-id",
  clientSecret: "user-client-secret",
  authorization: "Bearer user-paid-token",
  requestTimeoutMs: 1_000,
};

describe("WantedClient", () => {
  it("forwards user credentials and repeats array query parameters", async () => {
    let requestedUrl: URL | undefined;
    let requestedInit: RequestInit | undefined;
    const request: typeof fetch = async (input, options) => {
      requestedUrl = new URL(
        input instanceof Request ? input.url : input.toString(),
      );
      requestedInit = options;
      return new Response(JSON.stringify({ data: { items: [] } }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    };

    const client = new WantedClient(config, request);
    const result = await client.get("jobs", {
      subcategory_tags: [518, 872],
      locations: ["서울", "경기"],
    });

    expect(result).toEqual({ items: [] });
    expect(requestedUrl?.pathname).toBe("/v2/jobs");
    expect(requestedUrl?.searchParams.getAll("subcategory_tags")).toEqual([
      "518",
      "872",
    ]);
    const headers = new Headers(requestedInit?.headers);
    expect(headers.get("wanted-client-id")).toBe("user-client-id");
    expect(headers.get("wanted-client-secret")).toBe("user-client-secret");
    expect(headers.get("authorization")).toBe("Bearer user-paid-token");
  });

  it("surfaces HTTP failures without returning credentials", async () => {
    const request: typeof fetch = async () =>
      new Response("forbidden", { status: 403 });
    const client = new WantedClient(config, request);
    await expect(client.get("jobs")).rejects.toThrow("HTTP 403");
  });
});
