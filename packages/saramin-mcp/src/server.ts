import { McpServer, McpTool } from "@theorvane/type-mcp";
import type { SaraminClient } from "./saramin-client.js";
import {
  type GetJobInput,
  type GetSearchOptionsInput,
  getJob,
  getJobInputSchema,
  getSearchOptions,
  getSearchOptionsInputSchema,
  type SearchJobsInput,
  searchJobs,
  searchJobsInputSchema,
} from "./tools/jobs.js";

const json = (value: unknown) => JSON.stringify(value, null, 2);

@McpServer({ name: "saramin-mcp", version: "0.1.0" })
export class SaraminMcpServer {
  client!: SaraminClient;

  @McpTool({
    name: "saramin_get_search_options",
    description:
      "사람인 검색의 상장 구분, 고용형태 1~22, 학력 0~9, 정렬, 선택 필드, 날짜·페이지 규칙과 공식 코드표 링크를 조회합니다.",
    input: getSearchOptionsInputSchema,
  })
  getSearchOptions(_input: GetSearchOptionsInput): string {
    return json(getSearchOptions());
  }

  @McpTool({
    name: "saramin_search_jobs",
    description:
      "사람인 채용공고를 키워드, 공채·상장·직접채용, 지역·업종·직무 코드, 고용형태 1~22, 학력 0~9, 날짜, 정렬, 페이지 조건으로 검색합니다. 코드 의미는 saramin_get_search_options로 확인합니다.",
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
