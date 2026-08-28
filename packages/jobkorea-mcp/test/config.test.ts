import { describe, expect, it } from "vitest";
import { loadJobKoreaConfig } from "../src/config.js";

describe("loadJobKoreaConfig", () => {
  it("accepts a user-issued JobKorea URL", () => {
    const config = loadJobKoreaConfig({
      JOBKOREA_API_USE_APPROVED: "true",
      JOBKOREA_JOBS_API_URL:
        "https://api.jobkorea.co.kr/jobs?issued-token=secret",
    });

    expect(config.jobsApiUrl).toContain("api.jobkorea.co.kr/jobs");
    expect(config.entryApiUrl).toBeUndefined();
    expect(config.requestTimeoutMs).toBe(10_000);
  });

  it("requires at least one issued URL", () => {
    expect(() =>
      loadJobKoreaConfig({ JOBKOREA_API_USE_APPROVED: "true" }),
    ).toThrow("JOBKOREA_JOBS_API_URL or JOBKOREA_ENTRY_API_URL");
  });

  it("rejects non-JobKorea and non-HTTPS URLs", () => {
    expect(() =>
      loadJobKoreaConfig({
        JOBKOREA_API_USE_APPROVED: "true",
        JOBKOREA_JOBS_API_URL: "https://example.com/jobs",
      }),
    ).toThrow("jobkorea.co.kr");
    expect(() =>
      loadJobKoreaConfig({
        JOBKOREA_API_USE_APPROVED: "true",
        JOBKOREA_JOBS_API_URL: "http://api.jobkorea.co.kr/jobs",
      }),
    ).toThrow("must use HTTPS");
  });

  it("requires explicit confirmation of approved API use", () => {
    expect(() =>
      loadJobKoreaConfig({
        JOBKOREA_JOBS_API_URL: "https://api.jobkorea.co.kr/jobs",
      }),
    ).toThrow("JOBKOREA_API_USE_APPROVED=true");
  });
});
