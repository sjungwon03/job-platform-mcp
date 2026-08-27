import { z } from "zod";
import type {
  JobKoreaClient,
  JobKoreaFeed,
  JobKoreaQuery,
} from "../jobkorea-client.js";

const jobKoreaSearchOptions = {
  feeds: {
    jobs: "신입·경력 채용정보; JOBKOREA_JOBS_API_URL 필요",
    entryJobs: "신입·인턴 공채; JOBKOREA_ENTRY_API_URL 필요",
  },
  parameters: {
    source:
      "API 승인 시 잡코리아가 고유 호출 링크와 함께 제공한 사용자별 가이드",
    accepted_names: "영문 대·소문자, 숫자, 밑줄(_), 마침표(.), 하이픈(-)",
    accepted_values: "문자열, 숫자, 불리언",
    embedded_parameter_rule: "발급 URL에 이미 포함된 파라미터는 덮어쓸 수 없음",
    warning:
      "공통 공개 파라미터 명세가 없으므로 가이드에 없는 이름을 추측해 전달하지 말 것",
  },
  response: "JSON은 구조화된 값으로, XML은 원문 문자열로 반환",
  documentation: "https://www.jobkorea.co.kr/service/api",
} as const;

const parameterName = z
  .string()
  .regex(/^[A-Za-z0-9_.-]+$/, "허용되지 않은 파라미터 이름입니다");

export const fetchJobsInputSchema = z.object({
  parameters: z
    .record(parameterName, z.union([z.string(), z.number(), z.boolean()]))
    .optional()
    .describe(
      "잡코리아가 고유 호출 링크와 함께 제공한 사용자별 가이드에 정의된 검색 조건만 전달. 키는 영문·숫자·_·.·-만 허용하고 값은 문자열·숫자·불리언. 발급 URL에 이미 든 키는 덮어쓸 수 없음",
    ),
});

export const getSearchOptionsInputSchema = z
  .object({})
  .describe(
    "입력 없이 잡코리아 피드와 사용자별 검색 파라미터 적용 규칙을 반환",
  );

export type FetchJobsInput = z.infer<typeof fetchJobsInputSchema>;
export type GetSearchOptionsInput = z.infer<typeof getSearchOptionsInputSchema>;

export function getSearchOptions(): typeof jobKoreaSearchOptions {
  return jobKoreaSearchOptions;
}

export function fetchJobs(
  client: JobKoreaClient,
  feed: JobKoreaFeed,
  input: FetchJobsInput,
): Promise<unknown> {
  return client.fetchFeed(feed, (input.parameters ?? {}) as JobKoreaQuery);
}
