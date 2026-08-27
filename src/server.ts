import { McpServer, McpTool } from "@theorvane/type-mcp";
import type { SaraminClient } from "./saramin-client.js";
import {
  type GetJobInput,
  getJob,
  getJobInputSchema,
  type SearchJobsInput,
  searchJobs,
  searchJobsInputSchema,
} from "./tools/jobs.js";

const json = (value: unknown) => JSON.stringify(value, null, 2);

@McpServer({ name: "saramin-mcp", version: "0.1.0" })
export class SaraminMcpServer {
  client!: SaraminClient;

  @McpTool({
    name: "saramin_search_jobs",
    description:
      "사람인 채용공고를 키워드, 지역, 업종, 직무, 고용형태, 학력, 날짜 조건으로 검색합니다.",
    input: searchJobsInputSchema,
  })
  async searchJobs(input: SearchJobsInput): Promise<string> {
    return json(await searchJobs(this.client, input));
  }

  @McpTool({
    name: "saramin_get_job",
    description: "사람인 채용공고를 공고 번호로 조회합니다.",
    input: getJobInputSchema,
  })
  async getJob(input: GetJobInput): Promise<string> {
    return json(await getJob(this.client, input));
  }
}
