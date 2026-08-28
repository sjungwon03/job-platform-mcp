import { describe, expect, it } from "vitest";
import {
  buildFilterPlan,
  buildSearchUrl,
  searchJobsInputSchema,
} from "../src/tools/jobs.js";

describe("사람인 browser job search", () => {
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
      "https://www.saramin.co.kr/zf_user/search/recruit",
    );
    expect(url.searchParams.get("searchword")).toBe("백엔드 Spring Boot");
    expect(buildFilterPlan(input)).toEqual({
      locations: ["서울", "경기"],
      minimumExperienceLabel: "2년",
      detailLabels: ["정규직"],
      skipped: [
        "근무방식 하이브리드: 사람인 공개 필터에서 지원하지 않아 미적용",
        "경력 최대값: 공개 UI의 안정적인 상한 선택을 확인하지 못해 미적용",
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
