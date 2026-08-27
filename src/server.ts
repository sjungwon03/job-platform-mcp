import { McpServer, McpTool } from "@theorvane/type-mcp";
import {
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
    name: "wanted_list_jobs",
    description:
      "원티드 포지션 목록을 조회합니다. 정렬, 경력, 지역, 직군, 직무, 스킬 필터를 지원합니다.",
    input: listJobsInputSchema,
  })
  async listJobs(input: ListJobsInput): Promise<string> {
    return json(await listJobs(this.client, input));
  }
}
