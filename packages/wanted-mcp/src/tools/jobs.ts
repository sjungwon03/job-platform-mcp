import { z } from "zod";
import type { Query, WantedClient } from "../wanted-client.js";

const wantedSearchOptions = {
  sort: {
    "job.latest_order": "최신 등록순(기본값)",
    "job.popularity_order": "인기순",
    "company.response_rate_order": "기업 응답률순",
  },
  additional_apply_types: {
    "job.additional_apply_type.foreigner": "외국인 지원 가능",
    "job.additional_apply_type.alternative_military":
      "산업기능요원·전문연구요원 등 병역특례",
    "job.additional_apply_type.disabled_person": "장애인 우대",
  },
  years: {
    range: "0~10의 정수 배열이며 최대 2개",
    meaning: "두 값은 경력 범위를 나타내고 10은 10년 이상을 뜻함",
  },
  tag_filters: {
    category_tag: "직군 태그 ID 1개",
    subcategory_tags: "직무 태그 ID 최대 5개",
    skill_tags: "스킬 태그 ID 최대 5개",
    attraction_tags: "매력 태그 ID 최대 5개",
    note: "태그 이름이 아니라 원티드가 발급한 숫자 태그 ID를 사용",
  },
  pagination: {
    offset: "0부터 시작하는 결과 오프셋(기본값 0)",
    limit: "가져올 결과 수(기본값 20, 공식 V2 명세에 상한 미기재)",
  },
  documentation: "https://openapi.wanted.jobs/api-docs/v2/",
} as const;

export const listJobsInputSchema = z.object({
  category_tag: z
    .number()
    .int()
    .optional()
    .describe("원티드 직군 태그 ID 1개. 태그 이름이 아닌 숫자 ID를 전달"),
  subcategory_tags: z
    .array(z.number().int())
    .max(5)
    .optional()
    .describe("원티드 직무 태그 ID 배열. 태그 이름이 아닌 숫자 ID, 최대 5개"),
  skill_tags: z
    .array(z.number().int())
    .max(5)
    .optional()
    .describe("원티드 스킬 태그 ID 배열. 태그 이름이 아닌 숫자 ID, 최대 5개"),
  attraction_tags: z
    .array(z.number().int())
    .max(5)
    .optional()
    .describe("원티드 매력 태그 ID 배열. 태그 이름이 아닌 숫자 ID, 최대 5개"),
  years: z
    .array(z.number().int().min(0).max(10))
    .max(2)
    .optional()
    .describe(
      "경력 범위 배열. 0~10 정수, 최대 2개이며 10은 10년 이상을 의미. 예: [3, 7]",
    ),
  locations: z
    .array(z.string().min(1))
    .optional()
    .describe('원티드가 사용하는 지역·국가 문자열 배열. 예: ["서울"]'),
  additional_apply_types: z
    .array(
      z.enum([
        "job.additional_apply_type.foreigner",
        "job.additional_apply_type.alternative_military",
        "job.additional_apply_type.disabled_person",
      ]),
    )
    .optional()
    .describe(
      "지원 우대 자격: foreigner=외국인, alternative_military=병역특례, disabled_person=장애인 우대",
    ),
  sort: z
    .enum([
      "job.latest_order",
      "job.popularity_order",
      "company.response_rate_order",
    ])
    .default("job.latest_order")
    .describe(
      "정렬: job.latest_order=최신순, job.popularity_order=인기순, company.response_rate_order=기업 응답률순",
    ),
  offset: z
    .number()
    .int()
    .nonnegative()
    .default(0)
    .describe("0부터 시작하는 결과 오프셋. 기본값 0"),
  limit: z
    .number()
    .int()
    .positive()
    .default(20)
    .describe("가져올 결과 수. 기본값 20; 공식 V2 명세에는 최대값이 없음"),
});

export const getSearchOptionsInputSchema = z
  .object({})
  .describe("입력 없이 원티드 채용 검색 옵션 설명을 반환");

export type ListJobsInput = z.infer<typeof listJobsInputSchema>;
export type GetSearchOptionsInput = z.infer<typeof getSearchOptionsInputSchema>;

export function getSearchOptions(): typeof wantedSearchOptions {
  return wantedSearchOptions;
}

export async function listJobs(
  client: WantedClient,
  input: ListJobsInput,
): Promise<unknown> {
  return client.get("jobs", input as Query);
}
