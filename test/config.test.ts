import { describe, expect, it } from "vitest";
import { loadWantedConfig } from "../src/config.js";

describe("loadWantedConfig", () => {
  it("loads user-owned credentials without exposing defaults for secrets", () => {
    const config = loadWantedConfig({
      WANTED_CLIENT_ID: "client-id",
      WANTED_CLIENT_SECRET: "client-secret",
      WANTED_AUTHORIZATION: "Bearer paid-feature-token",
    });

    expect(config.baseUrl).toBe("https://openapi.wanted.jobs/v2");
    expect(config.requestTimeoutMs).toBe(10_000);
    expect(config.authorization).toBe("Bearer paid-feature-token");
  });

  it("rejects missing user credentials", () => {
    expect(() =>
      loadWantedConfig({
        WANTED_CLIENT_ID: "client-id",
      }),
    ).toThrow("WANTED_CLIENT_SECRET");
  });

  it("rejects non-HTTPS API origins", () => {
    expect(() =>
      loadWantedConfig({
        WANTED_CLIENT_ID: "client-id",
        WANTED_CLIENT_SECRET: "client-secret",
        WANTED_API_BASE_URL: "http://openapi.wanted.jobs/v2",
      }),
    ).toThrow("must use HTTPS");
  });
});
