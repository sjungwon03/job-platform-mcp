import { describe, expect, it } from "vitest";
import { loadSaraminConfig } from "../src/config.js";

describe("loadSaraminConfig", () => {
  it("loads a user-owned access key with safe defaults", () => {
    const config = loadSaraminConfig({
      SARAMIN_ACCESS_KEY: "user-access-key",
    });

    expect(config.baseUrl).toBe("https://oapi.saramin.co.kr");
    expect(config.requestTimeoutMs).toBe(10_000);
    expect(config.accessKey).toBe("user-access-key");
  });

  it("rejects a missing access key", () => {
    expect(() => loadSaraminConfig({})).toThrow("SARAMIN_ACCESS_KEY");
  });

  it("rejects a non-HTTPS API origin", () => {
    expect(() =>
      loadSaraminConfig({
        SARAMIN_ACCESS_KEY: "user-access-key",
        SARAMIN_API_BASE_URL: "http://oapi.saramin.co.kr",
      }),
    ).toThrow("must use HTTPS");
  });
});
