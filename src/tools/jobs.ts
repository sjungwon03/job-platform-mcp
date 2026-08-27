import { z } from "zod";
import type { SaraminClient, SaraminQuery } from "../saramin-client.js";

const codeList = z
  .array(z.string().min(1))
  .optional()
  .describe("사람인 코드표 값. 여러 값은 배열로 전달");

const fields = z
  .array(z.enum(["posting-date", "expiration-date", "keyword-code", "count"]))
  .optional()
  .describe("응답에 추가할 선택 필드");

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
  loc_cd: codeList.describe("근무지·지역 코드"),
  loc_mcd: codeList.describe("1차 근무지·지역 코드"),
  loc_bcd: codeList.describe("2차 근무지·지역 코드"),
  ind_cd: codeList.describe("산업·업종 코드"),
  job_mid_cd: codeList.describe("상위 직무 코드"),
  job_cd: codeList.describe("직무 코드"),
  job_type: codeList.describe("근무·고용 형태 코드"),
  edu_lv: codeList.describe("학력 코드"),
  fields,
  published: z.string().min(1).optional().describe("등록일"),
  published_min: z.string().min(1).optional().describe("최소 등록일시"),
  published_max: z.string().min(1).optional().describe("최대 등록일시"),
  updated: z.string().min(1).optional().describe("수정일"),
  updated_min: z.string().min(1).optional().describe("최소 수정일시"),
  updated_max: z.string().min(1).optional().describe("최대 수정일시"),
  deadline: z
    .string()
    .min(1)
    .optional()
    .describe("today, tomorrow 또는 마감 일시"),
  start: z.number().int().nonnegative().default(0).describe("0 기반 페이지"),
  count: z
    .number()
    .int()
    .min(1)
    .max(110)
    .default(10)
    .describe("페이지당 결과 수"),
  sort: z
    .enum(["pd", "pa", "ud", "ua", "da", "dd", "rc", "ac"])
    .default("pd")
    .describe("정렬 순서"),
});

export const getJobInputSchema = z.object({
  id: z.string().regex(/^\d+$/, "공고 번호는 숫자 문자열이어야 합니다"),
  fields,
});

export type SearchJobsInput = z.infer<typeof searchJobsInputSchema>;
export type GetJobInput = z.infer<typeof getJobInputSchema>;

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
