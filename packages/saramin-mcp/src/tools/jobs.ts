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
  return getBrowserSearchOptions("saramin", {
    locations: "공개 지역 패널에서 시·도 전체 선택",
    experience: "경력 최소 연차 선택; 최대 연차는 미적용",
    employmentTypes: "상세조건의 고용형태 체크박스",
    workModes: "원격만 재택근무 가능 필터로 적용",
  });
}

const EMPLOYMENT_LABELS = {
  정규직: "정규직",
  계약직: "계약직",
  인턴: "인턴직",
  프리랜서: "프리랜서",
} as const;

export interface SaraminFilterPlan {
  readonly locations: readonly string[];
  readonly minimumExperienceLabel?: string;
  readonly detailLabels: readonly string[];
  readonly skipped: readonly string[];
}

export function buildFilterPlan(input: BrowserSearchInput): SaraminFilterPlan {
  const skipped: string[] = [];
  const detailLabels: string[] = input.employmentTypes.map(
    (type) => EMPLOYMENT_LABELS[type],
  );
  if (input.workModes.includes("원격")) detailLabels.push("재택근무 가능");
  for (const mode of input.workModes) {
    if (mode !== "원격") {
      skipped.push(
        `근무방식 ${mode}: 사람인 공개 필터에서 지원하지 않아 미적용`,
      );
    }
  }
  if (input.experience?.maxYears !== undefined) {
    skipped.push(
      "경력 최대값: 공개 UI의 안정적인 상한 선택을 확인하지 못해 미적용",
    );
  }
  const minYears = input.experience?.minYears;
  return {
    locations: input.locations,
    minimumExperienceLabel:
      minYears === undefined
        ? undefined
        : minYears === 0
          ? "~1년"
          : `${Math.min(minYears, 20)}년`,
    detailLabels,
    skipped,
  };
}

async function clickSearchComplete(page: Page): Promise<void> {
  await page
    .getByRole("button", { name: /검색완료$/ })
    .last()
    .click({ timeout: 7_000 });
}

async function applyFilters(
  page: Page,
  input: BrowserSearchInput,
): Promise<BrowserFilterReport> {
  const plan = buildFilterPlan(input);
  const applied: string[] = [];
  const skipped = [...plan.skipped];

  if (plan.locations.length > 0) {
    try {
      await page
        .getByRole("button", { name: "지역 선택", exact: true })
        .first()
        .click({ timeout: 7_000 });
      const selected: string[] = [];
      for (const location of plan.locations) {
        const group = page
          .getByRole("button", { name: new RegExp(`^${location} \\(`) })
          .first();
        if (!(await group.isVisible().catch(() => false))) {
          skipped.push(`지역 ${location}: 표시된 선택 항목을 찾지 못해 미적용`);
          continue;
        }
        await group.click({ timeout: 7_000 });
        const whole = page.getByLabel(`${location}전체`, { exact: true });
        if (!(await whole.isVisible().catch(() => false))) {
          skipped.push(`지역 ${location}: 전체 선택 항목을 찾지 못해 미적용`);
          continue;
        }
        if (!(await whole.isChecked())) {
          await whole.focus();
          await page.keyboard.press("Space");
        }
        if (await whole.isChecked()) {
          selected.push(`지역: ${location}`);
        } else {
          skipped.push(
            `지역 ${location}: 전체 선택 상태를 확인하지 못해 미적용`,
          );
        }
      }
      await clickSearchComplete(page);
      applied.push(...selected);
    } catch {
      skipped.push("지역: 공개 필터 UI 변경 또는 표시 실패로 미적용");
    }
  }

  if (plan.minimumExperienceLabel) {
    try {
      await page
        .getByRole("button", { name: "경력 선택", exact: true })
        .first()
        .click({ timeout: 7_000 });
      const careerType = page.getByLabel("경력", { exact: true });
      if (!(await careerType.isChecked())) {
        await careerType.focus();
        await page.keyboard.press("Space");
      }
      const minimum = page.getByLabel(plan.minimumExperienceLabel, {
        exact: true,
      });
      if (!(await minimum.isChecked())) {
        await minimum.focus();
        await page.keyboard.press("Space");
      }
      if (!(await careerType.isChecked()) || !(await minimum.isChecked())) {
        throw new Error("경력 선택 상태 확인 실패");
      }
      await clickSearchComplete(page);
      applied.push(`경력: ${plan.minimumExperienceLabel} 이상`);
    } catch {
      skipped.push("경력 최소값: 공개 필터 UI 변경 또는 표시 실패로 미적용");
    }
  }

  if (plan.detailLabels.length > 0) {
    try {
      await page
        .getByRole("button", { name: "상세조건", exact: true })
        .first()
        .click({ timeout: 7_000 });
      const selected: string[] = [];
      for (const label of plan.detailLabels) {
        const option = page.getByLabel(label, { exact: true });
        if (!(await option.isVisible().catch(() => false))) {
          skipped.push(`${label}: 표시된 상세조건을 찾지 못해 미적용`);
          continue;
        }
        if (!(await option.isChecked())) {
          await option.focus();
          await page.keyboard.press("Space");
        }
        if (await option.isChecked()) {
          selected.push(`상세조건: ${label}`);
        } else {
          skipped.push(`${label}: 선택 상태를 확인하지 못해 미적용`);
        }
      }
      await page
        .getByRole("button", { name: "검색하기", exact: true })
        .last()
        .click({ timeout: 7_000 });
      applied.push(...selected);
    } catch {
      skipped.push("상세조건: 공개 필터 UI 변경 또는 표시 실패로 미적용");
    }
  }

  return { applied, skipped };
}

export function buildSearchUrl(input: BrowserSearchInput): URL {
  const url = new URL("https://www.saramin.co.kr/zf_user/search/recruit");
  url.searchParams.set("searchword", buildSearchTerms(input));

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
