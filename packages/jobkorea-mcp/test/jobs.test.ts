import { describe, expect, it } from "vitest";
import {
  buildFilterPlan,
  buildSearchUrl,
  searchJobsInputSchema,
} from "../src/tools/jobs.js";

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
    expect(url.searchParams.get("stext")).toBe("백엔드 Spring Boot");
    expect(buildFilterPlan(input)).toEqual({
      careerBuckets: ["1~3년", "4~6년"],
      employmentTypes: ["정규직"],
      skipped: [
        "지역 서울: 잡코리아 전체 체크 상태를 안정적으로 확인하지 못해 미적용",
        "지역 경기: 잡코리아 전체 체크 상태를 안정적으로 확인하지 못해 미적용",
        "근무방식 하이브리드: 잡코리아 공개 검색 화면에서 지원하지 않아 미적용",
      ],
    });
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
