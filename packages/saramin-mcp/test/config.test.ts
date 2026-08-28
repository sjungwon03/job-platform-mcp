import { describe, expect, it } from "vitest";
import { loadSaraminConfig } from "../src/config.js";

describe("loadSaraminConfig", () => {
  it("loads a user-owned access key with safe defaults", () => {
    const config = loadSaraminConfig({
      SARAMIN_API_USE_APPROVED: "true",
      SARAMIN_ACCESS_KEY: "user-access-key",
    });

    expect(config.baseUrl).toBe("https://oapi.saramin.co.kr");
    expect(config.requestTimeoutMs).toBe(10_000);
    expect(config.accessKey).toBe("user-access-key");
  });

  it("rejects a missing access key", () => {
    expect(() =>
      loadSaraminConfig({ SARAMIN_API_USE_APPROVED: "true" }),
    ).toThrow("SARAMIN_ACCESS_KEY");
  });

  it("rejects a non-HTTPS API origin", () => {
    expect(() =>
      loadSaraminConfig({
        SARAMIN_API_USE_APPROVED: "true",
        SARAMIN_ACCESS_KEY: "user-access-key",
        SARAMIN_API_BASE_URL: "http://oapi.saramin.co.kr",
      }),
    ).toThrow("must use HTTPS");
  });

  it("requires explicit confirmation of approved API use", () => {
    expect(() =>
      loadSaraminConfig({ SARAMIN_ACCESS_KEY: "user-access-key" }),
    ).toThrow("SARAMIN_API_USE_APPROVED=true");
  });
});
