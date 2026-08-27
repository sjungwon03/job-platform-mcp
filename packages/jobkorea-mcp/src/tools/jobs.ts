import { z } from "zod";
import type {
  JobKoreaClient,
  JobKoreaFeed,
  JobKoreaQuery,
} from "../jobkorea-client.js";

const parameterName = z
  .string()
  .regex(/^[A-Za-z0-9_.-]+$/, "허용되지 않은 파라미터 이름입니다");

export const fetchJobsInputSchema = z.object({
  parameters: z
    .record(parameterName, z.union([z.string(), z.number(), z.boolean()]))
    .optional()
    .describe("잡코리아에서 함께 발급한 가이드에 정의된 검색 조건"),
});

export type FetchJobsInput = z.infer<typeof fetchJobsInputSchema>;

export function fetchJobs(
  client: JobKoreaClient,
  feed: JobKoreaFeed,
  input: FetchJobsInput,
): Promise<unknown> {
  return client.fetchFeed(feed, (input.parameters ?? {}) as JobKoreaQuery);
}
