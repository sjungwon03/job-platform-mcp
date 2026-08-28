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
import type { Locator, Page } from "playwright-core";

export type { BrowserSearchInput as SearchJobsInput, GetSearchOptionsInput };
export {
  browserSearchInputSchema as searchJobsInputSchema,
  getSearchOptionsInputSchema,
};

export function getSearchOptions() {
  return getBrowserSearchOptions("jobkorea", {
    locations: "세부 전체 체크 렌더링이 불안정하여 자동 적용하지 않음",
    experience: "공개 경력 구간 체크박스로 근사 적용",
    employmentTypes: "공개 고용형태 체크박스",
    workModes: "현재 공개 검색 화면에 필터가 없어 미적용",
  });
}

const CAREER_BUCKETS = [
  { label: "1~3년", min: 1, max: 3 },
  { label: "4~6년", min: 4, max: 6 },
  { label: "7~9년", min: 7, max: 9 },
  { label: "10~15년", min: 10, max: 15 },
  { label: "16~20년", min: 16, max: 20 },
  { label: "21년 이상", min: 21, max: 50 },
] as const;

export interface JobKoreaFilterPlan {
  readonly careerBuckets: readonly string[];
  readonly employmentTypes: readonly string[];
  readonly skipped: readonly string[];
}

export function buildFilterPlan(input: BrowserSearchInput): JobKoreaFilterPlan {
  const skipped = [
    ...input.locations.map(
      (location) =>
        `지역 ${location}: 잡코리아 전체 체크 상태를 안정적으로 확인하지 못해 미적용`,
    ),
    ...input.workModes.map(
      (mode) =>
        `근무방식 ${mode}: 잡코리아 공개 검색 화면에서 지원하지 않아 미적용`,
    ),
  ];
  const lower = input.experience?.minYears;
  const upper = input.experience?.maxYears;
  const careerBuckets =
    lower === undefined && upper === undefined
      ? []
      : CAREER_BUCKETS.filter(
          (bucket) => bucket.max >= (lower ?? 0) && bucket.min <= (upper ?? 50),
        ).map(({ label }) => label);
  return {
    careerBuckets,
    employmentTypes: input.employmentTypes,
    skipped,
  };
}

function exactText(value: string): RegExp {
  return new RegExp(`^${value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`);
}

async function openDialog(page: Page, triggerText: string): Promise<Locator> {
  const trigger = page
    .locator("button:visible")
    .filter({ hasText: exactText(triggerText) })
    .first();
  if (!(await trigger.isVisible())) throw new Error(`${triggerText} 버튼 없음`);
  await trigger.click();
  const dialog = page.locator("[role=dialog]:visible").last();
  if (!(await dialog.isVisible())) throw new Error(`${triggerText} 패널 없음`);
  return dialog;
}

async function applyDialog(dialog: Locator): Promise<void> {
  await dialog
    .locator("button:visible")
    .filter({ hasText: /^적용하기$/ })
    .last()
    .click();
  await dialog.waitFor({ state: "hidden", timeout: 7_000 });
  await dialog.page().waitForTimeout(750);
}

async function applyFilters(
  page: Page,
  input: BrowserSearchInput,
): Promise<BrowserFilterReport> {
  const plan = buildFilterPlan(input);
  const applied: string[] = [];
  const skipped = [...plan.skipped];

  if (plan.careerBuckets.length > 0) {
    try {
      const dialog = await openDialog(page, "경력");
      const selected: string[] = [];
      const career = dialog
        .locator("label:visible")
        .filter({ hasText: /^경력$/ })
        .first();
      if (await career.isVisible().catch(() => false)) await career.click();
      for (const bucket of plan.careerBuckets) {
        const option = dialog
          .getByRole("checkbox", { name: bucket, exact: true })
          .first();
        if (!(await option.isVisible().catch(() => false))) {
          skipped.push(`경력 ${bucket}: 표시된 선택 항목을 찾지 못해 미적용`);
          continue;
        }
        await option.click();
        selected.push(`경력: ${bucket}`);
      }
      await applyDialog(dialog);
      applied.push(...selected);
    } catch {
      skipped.push("경력: 공개 필터 UI 변경 또는 표시 실패로 미적용");
    }
  }

  if (plan.employmentTypes.length > 0) {
    try {
      const dialog = await openDialog(page, "고용형태");
      const selected: string[] = [];
      for (const type of plan.employmentTypes) {
        const option = dialog
          .locator("label:visible")
          .filter({ hasText: exactText(type) })
          .first();
        if (!(await option.isVisible().catch(() => false))) {
          skipped.push(`고용형태 ${type}: 표시된 선택 항목을 찾지 못해 미적용`);
          continue;
        }
        await option.click();
        selected.push(`고용형태: ${type}`);
      }
      await applyDialog(dialog);
      applied.push(...selected);
    } catch {
      skipped.push("고용형태: 공개 필터 UI 변경 또는 표시 실패로 미적용");
    }
  }

  return { applied, skipped };
}

export function buildSearchUrl(input: BrowserSearchInput): URL {
  const url = new URL("https://www.jobkorea.co.kr/Search/");
  url.searchParams.set("stext", buildSearchTerms(input));

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
