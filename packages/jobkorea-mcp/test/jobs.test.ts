import { describe, expect, it } from "vitest";
import { buildSearchUrl, searchJobsInputSchema } from "../src/tools/jobs.js";

describe("잡코리아 browser job search", () => {
  it("builds an official search URL from derived conditions", () => {
    const input = searchJobsInputSchema.parse({
      query: "백엔드",
      locations: ["서울", "경기"],
      experience: { minYears: 2, maxYears: 4 },
      employmentTypes: ["정규직"],
      workModes: ["하이브리드"],
      includeKeywords: ["Spring Boot"],
      acknowledgePersonalUse: true,
    });
    const url = buildSearchUrl(input);

    expect(url.origin + url.pathname).toBe(
      "https://www.jobkorea.co.kr/Search/",
    );
    expect(url.searchParams.get("stext")).toContain("백엔드 서울 경기");
    expect(url.searchParams.get("stext")).toContain("경력 2-4년");
  });

  it("rejects invalid ranges and more than 20 visible results", () => {
    expect(() =>
      searchJobsInputSchema.parse({
        query: "백엔드",
        experience: { minYears: 5, maxYears: 2 },
        acknowledgePersonalUse: true,
      }),
    ).toThrow();
    expect(() =>
      searchJobsInputSchema.parse({
        query: "백엔드",
        limit: 21,
        acknowledgePersonalUse: true,
      }),
    ).toThrow();
  });
});
