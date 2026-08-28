import {
  type Browser,
  type BrowserContext,
  chromium,
  type Page,
} from "playwright-core";
import { z } from "zod";

const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_SETTLE_MS = 2_000;
const BLOCKED_TEXT =
  /captcha|비정상적인 접근|접근이 제한|자동입력 방지|too many requests|429 too many/i;

export interface BrowserConfig {
  readonly browserChannel: string;
  readonly browserExecutablePath?: string;
  readonly requestTimeoutMs: number;
  readonly settleMs: number;
}

export interface ProviderPolicy {
  readonly provider: "wanted" | "saramin" | "jobkorea";
  readonly hostname: string;
  readonly linkSelector: string;
  readonly isJobUrl: (url: URL) => boolean;
}

export interface VisibleJob {
  readonly title: string;
  readonly url: string;
  readonly summary: string;
}

export interface BrowserSearchResult {
  readonly provider: ProviderPolicy["provider"];
  readonly mode: "visible-browser";
  readonly searchUrl: string;
  readonly resultCount: number;
  readonly results: readonly VisibleJob[];
  readonly filters: BrowserFilterReport;
  readonly notice: string;
}

export interface BrowserFilterReport {
  readonly applied: readonly string[];
  readonly skipped: readonly string[];
}

export type VisibleFilterApplier = (page: Page) => Promise<BrowserFilterReport>;

function positiveInteger(
  raw: string | undefined,
  fallback: number,
  name: string,
): number {
  const value = Number(raw ?? fallback);
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return value;
}

export function loadBrowserConfig(
  env: NodeJS.ProcessEnv,
): Readonly<BrowserConfig> {
  return Object.freeze({
    browserChannel: env.JOB_BROWSER_CHANNEL?.trim() || "chrome",
    browserExecutablePath: env.JOB_BROWSER_EXECUTABLE_PATH?.trim() || undefined,
    requestTimeoutMs: positiveInteger(
      env.JOB_BROWSER_TIMEOUT_MS,
      DEFAULT_TIMEOUT_MS,
      "JOB_BROWSER_TIMEOUT_MS",
    ),
    settleMs: positiveInteger(
      env.JOB_BROWSER_SETTLE_MS,
      DEFAULT_SETTLE_MS,
      "JOB_BROWSER_SETTLE_MS",
    ),
  });
}

const employmentType = z.enum(["정규직", "계약직", "인턴", "프리랜서"]);
const workMode = z.enum(["출근", "하이브리드", "원격"]);

export const getSearchOptionsInputSchema = z.object({});
export const browserSearchInputSchema = z.object({
  query: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .describe("직무명 중심의 검색어. 이력서 원문이나 개인정보를 넣지 않음"),
  locations: z
    .array(z.string().trim().min(1).max(40))
    .max(5)
    .default([])
    .describe('지역명 최대 5개. 예: ["서울", "경기"]'),
  experience: z
    .object({
      minYears: z.number().int().min(0).max(50).optional(),
      maxYears: z.number().int().min(0).max(50).optional(),
    })
    .refine(
      ({ minYears, maxYears }) =>
        minYears === undefined ||
        maxYears === undefined ||
        minYears <= maxYears,
      "최소 경력은 최대 경력보다 클 수 없습니다",
    )
    .optional(),
  employmentTypes: z
    .array(employmentType)
    .max(4)
    .default([])
    .describe("고용 형태"),
  workModes: z
    .array(workMode)
    .max(3)
    .default([])
    .describe("출근·하이브리드·원격 선호"),
  includeKeywords: z
    .array(z.string().trim().min(1).max(40))
    .max(10)
    .default([])
    .describe("기술·도메인 등 함께 검색할 키워드"),
  excludeKeywords: z
    .array(z.string().trim().min(1).max(40))
    .max(10)
    .default([])
    .describe("현재 화면 결과에서 제외할 키워드"),
  limit: z
    .number()
    .int()
    .min(1)
    .max(20)
    .default(10)
    .describe("현재 화면에서 읽을 최대 공고 수. 1~20"),
  acknowledgePersonalUse: z
    .literal(true)
    .describe(
      "개인·비상업용 단일 검색과 플랫폼 약관·잔여 위험을 확인한 경우 true",
    ),
});

export type GetSearchOptionsInput = z.infer<typeof getSearchOptionsInputSchema>;
export type BrowserSearchInput = z.infer<typeof browserSearchInputSchema>;

export function getBrowserSearchOptions(
  provider: string,
  filterUi: Readonly<Record<string, string>>,
) {
  return {
    provider,
    mode: "visible-browser",
    authentication: "API 키 없음",
    inputs: {
      query: "필수, 1~120자",
      locations: "지역명 최대 5개",
      experience: "최소·최대 0~50년",
      employmentTypes: employmentType.options,
      workModes: workMode.options,
      includeKeywords: "최대 10개",
      excludeKeywords: "최대 10개, 화면 결과 후처리",
      limit: "1~20, 기본값 10",
      acknowledgePersonalUse: "반드시 true",
    },
    filterUi,
    boundary:
      "사용자에게 보이는 현재 검색 화면만 읽으며 로그인·CAPTCHA·접근 제한을 우회하거나 페이지를 자동 순회하지 않음",
  } as const;
}

export function buildSearchTerms(input: BrowserSearchInput): string {
  return [input.query, ...input.includeKeywords].join(" ");
}

export class VisibleBrowserCrawler {
  private browser?: Browser;
  private context?: BrowserContext;
  private page?: Page;

  constructor(
    private readonly config: BrowserConfig,
    private readonly policy: ProviderPolicy,
  ) {}

  async search(
    searchUrl: URL,
    limit: number,
    excluded: readonly string[],
    applyFilters?: VisibleFilterApplier,
  ): Promise<BrowserSearchResult> {
    this.assertAllowed(searchUrl);
    const page = await this.getPage();

    await page.goto(searchUrl.toString(), {
      waitUntil: "domcontentloaded",
      timeout: this.config.requestTimeoutMs,
    });
    await page.waitForTimeout(this.config.settleMs);

    await this.assertNotBlocked(page);
    const filters = applyFilters
      ? await applyFilters(page)
      : { applied: [], skipped: [] };
    if (filters.applied.length > 0) {
      await page.waitForTimeout(this.config.settleMs);
    }

    const finalUrl = new URL(page.url());
    this.assertAllowed(finalUrl);
    await this.assertNotBlocked(page);

    const candidates = await page
      .locator(this.policy.linkSelector)
      .evaluateAll((anchors) =>
        anchors
          .map((node) => {
            const anchor = node as HTMLAnchorElement;
            const rect = anchor.getBoundingClientRect();
            const style = window.getComputedStyle(anchor);
            if (
              rect.width <= 0 ||
              rect.height <= 0 ||
              style.visibility === "hidden" ||
              style.display === "none"
            ) {
              return null;
            }
            const container =
              anchor.closest("li, article, [class*='item'], [class*='Item']") ??
              anchor.parentElement?.parentElement ??
              anchor.parentElement;
            return {
              title: (
                anchor.innerText ||
                anchor.getAttribute("aria-label") ||
                ""
              )
                .replace(/\s+/g, " ")
                .trim()
                .slice(0, 180),
              url: anchor.href,
              summary: (container?.textContent ?? anchor.textContent ?? "")
                .replace(/\s+/g, " ")
                .trim()
                .slice(0, 600),
            };
          })
          .filter(Boolean),
      );

    const results: VisibleJob[] = [];
    const seen = new Set<string>();
    for (const candidate of candidates) {
      if (!candidate?.title) continue;
      const url = new URL(candidate.url);
      if (
        url.protocol !== "https:" ||
        url.hostname !== this.policy.hostname ||
        !this.policy.isJobUrl(url)
      ) {
        continue;
      }
      url.hash = "";
      const normalizedUrl = url.toString();
      if (seen.has(normalizedUrl)) continue;
      const searchable =
        `${candidate.title} ${candidate.summary}`.toLocaleLowerCase("ko-KR");
      if (
        excluded.some((term) =>
          searchable.includes(term.toLocaleLowerCase("ko-KR")),
        )
      ) {
        continue;
      }
      seen.add(normalizedUrl);
      results.push({ ...candidate, url: normalizedUrl });
      if (results.length >= limit) break;
    }

    return {
      provider: this.policy.provider,
      mode: "visible-browser",
      searchUrl: finalUrl.toString(),
      resultCount: results.length,
      results,
      filters,
      notice:
        "현재 브라우저 화면의 공개 공고만 읽었습니다. 원문·HTML·쿠키는 저장하지 않았습니다.",
    };
  }

  private async assertNotBlocked(page: Page): Promise<void> {
    const bodyText = await page.locator("body").innerText({ timeout: 5_000 });
    if (BLOCKED_TEXT.test(bodyText)) {
      throw new Error(
        `${this.policy.provider} displayed an access restriction or CAPTCHA; automation stopped`,
      );
    }
  }

  private assertAllowed(url: URL): void {
    if (url.protocol !== "https:" || url.hostname !== this.policy.hostname) {
      throw new Error(
        `${this.policy.provider} browser search only allows https://${this.policy.hostname}`,
      );
    }
  }

  private async getPage(): Promise<Page> {
    if (!this.browser?.isConnected()) {
      this.browser = await chromium.launch({
        channel: this.config.browserExecutablePath
          ? undefined
          : this.config.browserChannel,
        executablePath: this.config.browserExecutablePath,
        headless: false,
      });
      this.context = await this.browser.newContext();
      this.page = await this.context.newPage();
    }
    const context = this.context;
    if (!context) {
      throw new Error("Browser context was not initialized");
    }
    if (!this.page || this.page.isClosed()) {
      this.page = await context.newPage();
    }
    return this.page;
  }
}
