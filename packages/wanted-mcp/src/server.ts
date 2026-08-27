import { McpServer, McpTool } from "@theorvane/type-mcp";
import {
  type GetSearchOptionsInput,
  getSearchOptions,
  getSearchOptionsInputSchema,
  type ListJobsInput,
  listJobs,
  listJobsInputSchema,
} from "./tools/jobs.js";
import type { WantedClient } from "./wanted-client.js";

const json = (value: unknown) => JSON.stringify(value, null, 2);

@McpServer({ name: "wanted-mcp", version: "0.1.0" })
export class WantedMcpServer {
  client!: WantedClient;

  @McpTool({
    name: "wanted_get_search_options",
    description:
      "원티드 채용 검색의 정렬 코드, 지원 우대 코드, 경력 범위, 태그 필터 제한, 페이지 방식을 조회합니다. 검색 전에 허용값이 필요할 때 호출합니다.",
    input: getSearchOptionsInputSchema,
  })
  getSearchOptions(_input: GetSearchOptionsInput): string {
    return json(getSearchOptions());
  }

  @McpTool({
    name: "wanted_list_jobs",
    description:
      "원티드 포지션 목록을 조회합니다. 정렬, 경력(0~10), 지역, 직군 ID, 직무·스킬·매력 태그 ID(각 최대 5개), 지원 우대, offset/limit을 지원합니다. 코드 의미는 wanted_get_search_options로 확인할 수 있습니다.",
    input: listJobsInputSchema,
  })
  async listJobs(input: ListJobsInput): Promise<string> {
    return json(await listJobs(this.client, input));
  }
}
