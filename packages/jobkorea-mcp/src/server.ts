import { McpServer, McpTool } from "@theorvane/type-mcp";
import type { JobKoreaClient } from "./jobkorea-client.js";
import {
  type FetchJobsInput,
  fetchJobs,
  fetchJobsInputSchema,
  type GetSearchOptionsInput,
  getSearchOptions,
  getSearchOptionsInputSchema,
} from "./tools/jobs.js";

const output = (value: unknown) =>
  typeof value === "string" ? value : JSON.stringify(value, null, 2);

@McpServer({ name: "jobkorea-mcp", version: "0.1.0" })
export class JobKoreaMcpServer {
  client!: JobKoreaClient;

  @McpTool({
    name: "jobkorea_get_search_options",
    description:
      "잡코리아의 일반·신입공채 피드 구분, 사용자별 발급 가이드의 검색 파라미터 적용 규칙, 허용 키·값 형식과 응답 형식을 조회합니다.",
    input: getSearchOptionsInputSchema,
  })
  getSearchOptions(_input: GetSearchOptionsInput): string {
    return output(getSearchOptions());
  }

  @McpTool({
    name: "jobkorea_fetch_jobs",
    description:
      "잡코리아에서 발급받은 채용정보 API 호출 링크로 신입·경력 공고를 가져옵니다. parameters에는 함께 발급된 사용자별 가이드의 조건만 전달하며 발급 URL의 기존 키는 덮어쓸 수 없습니다.",
    input: fetchJobsInputSchema,
  })
  async fetchJobs(input: FetchJobsInput): Promise<string> {
    return output(await fetchJobs(this.client, "jobs", input));
  }

  @McpTool({
    name: "jobkorea_fetch_entry_jobs",
    description:
      "잡코리아에서 발급받은 신입공채 API 호출 링크로 신입·인턴 공고를 가져옵니다. parameters에는 함께 발급된 사용자별 가이드의 조건만 전달하며 발급 URL의 기존 키는 덮어쓸 수 없습니다.",
    input: fetchJobsInputSchema,
  })
  async fetchEntryJobs(input: FetchJobsInput): Promise<string> {
    return output(await fetchJobs(this.client, "entryJobs", input));
  }
}
