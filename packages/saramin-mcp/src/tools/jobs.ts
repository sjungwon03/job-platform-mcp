import { z } from "zod";
import type { SaraminClient, SaraminQuery } from "../saramin-client.js";

const jobTypes = [
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "12",
  "13",
  "14",
  "15",
  "16",
  "17",
  "18",
  "19",
  "20",
  "21",
  "22",
] as const;
const educationLevels = [
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
] as const;

const saraminSearchOptions = {
  stock: { kospi: "유가증권", kosdaq: "코스닥", konex: "코넥스" },
  job_type: {
    "1": "정규직",
    "2": "계약직",
    "3": "병역특례",
    "4": "인턴직",
    "5": "아르바이트",
    "6": "파견직",
    "7": "해외취업",
    "8": "위촉직",
    "9": "프리랜서",
    "10": "계약직(정규직 전환 가능)",
    "11": "인턴직(정규직 전환 가능)",
    "12": "교육생",
    "13": "별정직",
    "14": "파트",
    "15": "전임",
    "16": "기간제",
    "17": "무기계약직",
    "18": "전문계약직",
    "19": "전문연구요원",
    "20": "산업기능요원",
    "21": "현역",
    "22": "보충역",
  },
  edu_lv: {
    "0": "학력무관",
    "1": "고졸",
    "2": "전문대졸",
    "3": "대졸",
    "4": "석사",
    "5": "박사",
    "6": "고졸 이상",
    "7": "전문대졸 이상",
    "8": "대졸 이상",
    "9": "석사 이상",
  },
  sort: {
    pd: "등록일 내림차순(최신순, 기본값)",
    pa: "등록일 오름차순",
    ud: "수정일 내림차순",
    ua: "수정일 오름차순",
    da: "마감일 오름차순",
    dd: "마감일 내림차순",
    rc: "조회수 내림차순",
    ac: "지원자 수 내림차순",
  },
  fields: {
    "posting-date": "날짜·시간 형식의 게시일시",
    "expiration-date": "날짜·시간 형식의 마감일시",
    "keyword-code": "업종·직무 키워드 상세분류 코드",
    count: "조회수와 지원자 수",
  },
  dates: {
    published_updated:
      "날짜 YYYY-MM-DD, 일시는 YYYY-MM-DD HH:mm:ss 또는 Unix timestamp",
    deadline: "today, tomorrow, YYYY-MM-DD HH:mm:ss 또는 Unix timestamp",
  },
  combination:
    "같은 파라미터 안의 여러 검색어와 서로 다른 검색 조건은 AND로 결합되며 와일드카드와 OR 검색은 지원하지 않음",
  pagination: { start: "0 기반 페이지 번호", count: "1~110, 기본값 10" },
  code_tables: {
    employment_education: "https://oapi.saramin.co.kr/guide/code-table1",
    location: "https://oapi.saramin.co.kr/guide/code-table2",
    industry: "https://oapi.saramin.co.kr/guide/code-table3",
    job: "https://oapi.saramin.co.kr/guide/code-table5",
  },
  documentation: "https://oapi.saramin.co.kr/guide/job-search",
} as const;

const codeList = z
  .array(z.string().min(1))
  .optional()
  .describe("사람인 코드표 값. 여러 값은 배열로 전달");

const fields = z
  .array(z.enum(["posting-date", "expiration-date", "keyword-code", "count"]))
  .optional()
  .describe(
    "추가 응답 필드: posting-date=게시일시, expiration-date=마감일시, keyword-code=업종·직무 상세 코드, count=조회수·지원자 수",
  );

export const searchJobsInputSchema = z.object({
  keywords: z
    .string()
    .min(1)
    .optional()
    .describe("기업명, 공고명, 업직종, 직무내용 검색어"),
  bbs_gb: z.literal(1).optional().describe("공채속보만 조회"),
  stock: z
    .array(z.enum(["kospi", "kosdaq", "konex"]))
    .optional()
    .describe("상장 여부"),
  sr: z.literal("directhire").optional().describe("헤드헌팅·파견 공고 제외"),
  loc_cd: codeList.describe(
    "근무지·지역 코드 배열. https://oapi.saramin.co.kr/guide/code-table2 참고",
  ),
  loc_mcd: codeList.describe(
    "1차 근무지·지역 코드 배열. https://oapi.saramin.co.kr/guide/code-table2 참고",
  ),
  loc_bcd: codeList.describe(
    "2차 근무지·지역 코드 배열. https://oapi.saramin.co.kr/guide/code-table2 참고",
  ),
  ind_cd: codeList.describe(
    "산업·업종 코드 배열. https://oapi.saramin.co.kr/guide/code-table3 참고",
  ),
  job_mid_cd: codeList.describe(
    "상위 직무 코드 배열. https://oapi.saramin.co.kr/guide/code-table5 참고",
  ),
  job_cd: codeList.describe(
    "직무 코드 배열. https://oapi.saramin.co.kr/guide/code-table5 참고",
  ),
  job_type: z
    .array(z.enum(jobTypes))
    .optional()
    .describe(
      "고용형태 코드 배열(1~22). 전체 코드 의미는 saramin_get_search_options로 조회",
    ),
  edu_lv: z
    .array(z.enum(educationLevels))
    .optional()
    .describe(
      "학력 코드 배열(0~9). 전체 코드 의미는 saramin_get_search_options로 조회",
    ),
  fields,
  published: z
    .string()
    .min(1)
    .optional()
    .describe("등록일. YYYY-MM-DD 형식, 예: 2019-03-20"),
  published_min: z
    .string()
    .min(1)
    .optional()
    .describe("등록일시 하한. YYYY-MM-DD HH:mm:ss 또는 Unix timestamp"),
  published_max: z
    .string()
    .min(1)
    .optional()
    .describe("등록일시 상한. YYYY-MM-DD HH:mm:ss 또는 Unix timestamp"),
  updated: z
    .string()
    .min(1)
    .optional()
    .describe("수정일. YYYY-MM-DD 형식, 예: 2019-03-20"),
  updated_min: z
    .string()
    .min(1)
    .optional()
    .describe("수정일시 하한. YYYY-MM-DD HH:mm:ss 또는 Unix timestamp"),
  updated_max: z
    .string()
    .min(1)
    .optional()
    .describe("수정일시 상한. YYYY-MM-DD HH:mm:ss 또는 Unix timestamp"),
  deadline: z
    .string()
    .min(1)
    .optional()
    .describe(
      "마감 조건: today, tomorrow, YYYY-MM-DD HH:mm:ss 또는 Unix timestamp",
    ),
  start: z
    .number()
    .int()
    .nonnegative()
    .default(0)
    .describe("0 기반 페이지 번호. 기본값 0"),
  count: z
    .number()
    .int()
    .min(1)
    .max(110)
    .default(10)
    .describe("페이지당 결과 수. 1~110, 기본값 10"),
  sort: z
    .enum(["pd", "pa", "ud", "ua", "da", "dd", "rc", "ac"])
    .default("pd")
    .describe(
      "정렬: pd=등록 최신, pa=등록 오래된, ud=수정 최신, ua=수정 오래된, da=마감 임박, dd=마감 먼 순, rc=조회수, ac=지원자 수",
    ),
});

export const getSearchOptionsInputSchema = z
  .object({})
  .describe("입력 없이 사람인 채용 검색 옵션과 코드표 링크를 반환");

export const getJobInputSchema = z.object({
  id: z.string().regex(/^\d+$/, "공고 번호는 숫자 문자열이어야 합니다"),
  fields,
});

export type SearchJobsInput = z.infer<typeof searchJobsInputSchema>;
export type GetJobInput = z.infer<typeof getJobInputSchema>;
export type GetSearchOptionsInput = z.infer<typeof getSearchOptionsInputSchema>;

export function getSearchOptions(): typeof saraminSearchOptions {
  return saraminSearchOptions;
}

export function searchJobs(
  client: SaraminClient,
  input: SearchJobsInput,
): Promise<unknown> {
  return client.get("job-search", input as SaraminQuery);
}

export function getJob(
  client: SaraminClient,
  input: GetJobInput,
): Promise<unknown> {
  return client.get("job-search", input as SaraminQuery);
}
