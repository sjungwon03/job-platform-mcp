import { z } from "zod";
import type { Query, WantedClient } from "../wanted-client.js";

export const listJobsInputSchema = z.object({
  category_tag: z.number().int().optional().describe("직군 태그 ID"),
  subcategory_tags: z
    .array(z.number().int())
    .max(5)
    .optional()
    .describe("직무 태그 ID, 최대 5개"),
  skill_tags: z
    .array(z.number().int())
    .max(5)
    .optional()
    .describe("스킬 태그 ID, 최대 5개"),
  attraction_tags: z
    .array(z.number().int())
    .max(5)
    .optional()
    .describe("매력 태그 ID, 최대 5개"),
  years: z
    .array(z.number().int().min(0).max(10))
    .max(2)
    .optional()
    .describe("경력 범위. 10은 10년 이상"),
  locations: z.array(z.string().min(1)).optional().describe("지역 또는 국가"),
  additional_apply_types: z
    .array(
      z.enum([
        "job.additional_apply_type.foreigner",
        "job.additional_apply_type.alternative_military",
        "job.additional_apply_type.disabled_person",
      ]),
    )
    .optional()
    .describe("지원 우대 자격"),
  sort: z
    .enum([
      "job.latest_order",
      "job.popularity_order",
      "company.response_rate_order",
    ])
    .default("job.latest_order"),
  offset: z.number().int().nonnegative().default(0),
  limit: z.number().int().positive().default(20),
});

export type ListJobsInput = z.infer<typeof listJobsInputSchema>;

export async function listJobs(
  client: WantedClient,
  input: ListJobsInput,
): Promise<unknown> {
  return client.get("jobs", input as Query);
}
