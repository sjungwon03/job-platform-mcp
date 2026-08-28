import {
  type BrowserFilterReport,
  type BrowserSearchInput,
  browserSearchInputSchema,
  buildSearchTerms,
  type GetSearchOptionsInput,
  getBrowserSearchOptions,
  getSearchOptionsInputSchema,
  type VisibleBrowserCrawler,
} from "@job-platform/browser-search-core";
import type { Page } from "playwright-core";

export type { BrowserSearchInput as SearchJobsInput, GetSearchOptionsInput };
export {
  browserSearchInputSchema as searchJobsInputSchema,
  getSearchOptionsInputSchema,
};

export function getSearchOptions() {
  return getBrowserSearchOptions("wanted", {
    locations: "공개 지역 팝업에서 복수 지역 선택",
    experience: "시각적 슬라이더만 제공되어 자동 적용하지 않음",
    employmentTypes: "현재 공개 검색 화면에 필터가 없어 미적용",
    workModes: "현재 공개 검색 화면에 필터가 없어 미적용",
  });
}

export interface WantedFilterPlan {
  readonly locations: readonly string[];
  readonly skipped: readonly string[];
}

export function buildFilterPlan(input: BrowserSearchInput): WantedFilterPlan {
  const skipped: string[] = [];
  if (input.experience) {
    skipped.push("경력: 접근 가능한 공개 슬라이더 컨트롤이 없어 미적용");
  }
  if (input.employmentTypes.length > 0) {
    skipped.push("고용형태: Wanted 공개 검색 화면에서 지원하지 않아 미적용");
  }
  if (input.workModes.length > 0) {
    skipped.push("근무방식: Wanted 공개 검색 화면에서 지원하지 않아 미적용");
  }
  return { locations: input.locations, skipped };
}

function exactText(value: string): RegExp {
  return new RegExp(`^${value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`);
}

async function applyFilters(
  page: Page,
  input: BrowserSearchInput,
): Promise<BrowserFilterReport> {
  const plan = buildFilterPlan(input);
  const applied: string[] = [];
  const skipped = [...plan.skipped];
  if (plan.locations.length === 0) return { applied, skipped };

  try {
    const trigger = page
      .locator("button:visible")
      .filter({ hasText: /^지역(?:\s+한국)?$/ })
      .first();
    if (!(await trigger.isVisible())) throw new Error("지역 버튼 없음");
    await trigger.click();

    const selected: string[] = [];
    for (const location of plan.locations) {
      const option = page
        .locator("button:visible")
        .filter({ hasText: exactText(location) })
        .last();
      if (!(await option.isVisible().catch(() => false))) {
        skipped.push(`지역 ${location}: 표시된 선택 항목을 찾지 못해 미적용`);
        continue;
      }
      if ((await option.getAttribute("aria-pressed")) !== "true") {
        await option.click();
      }
      selected.push(`지역: ${location}`);
    }

    if (selected.length > 0) {
      await page
        .locator("button:visible")
        .filter({ hasText: /^적용하기$/ })
        .last()
        .click();
      applied.push(...selected);
    }
  } catch {
    skipped.push("지역: 공개 필터 UI 변경 또는 표시 실패로 미적용");
  }

  return { applied, skipped };
}

export function buildSearchUrl(input: BrowserSearchInput): URL {
  const url = new URL("https://www.wanted.co.kr/search");
  url.searchParams.set("query", buildSearchTerms(input));
  url.searchParams.set("tab", "position");
  return url;
}

export function searchJobs(
  client: VisibleBrowserCrawler,
  input: BrowserSearchInput,
) {
  return client.search(
    buildSearchUrl(input),
    input.limit,
    input.excludeKeywords,
    (page) => applyFilters(page, input),
  );
}
