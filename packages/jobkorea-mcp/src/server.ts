import { McpServer, McpTool } from "@theorvane/type-mcp";
import type { JobKoreaClient } from "./jobkorea-client.js";
import {
  type FetchJobsInput,
  fetchJobs,
  fetchJobsInputSchema,
} from "./tools/jobs.js";

const output = (value: unknown) =>
  typeof value === "string" ? value : JSON.stringify(value, null, 2);

@McpServer({ name: "jobkorea-mcp", version: "0.1.0" })
export class JobKoreaMcpServer {
  client!: JobKoreaClient;

  @McpTool({
    name: "jobkorea_fetch_jobs",
    description:
      "잡코리아에서 발급받은 채용정보 API 호출 링크로 신입·경력 채용공고를 가져옵니다.",
    input: fetchJobsInputSchema,
  })
  async fetchJobs(input: FetchJobsInput): Promise<string> {
    return output(await fetchJobs(this.client, "jobs", input));
  }

  @McpTool({
    name: "jobkorea_fetch_entry_jobs",
    description:
      "잡코리아에서 발급받은 신입공채 API 호출 링크로 신입·인턴 공고를 가져옵니다.",
    input: fetchJobsInputSchema,
  })
  async fetchEntryJobs(input: FetchJobsInput): Promise<string> {
    return output(await fetchJobs(this.client, "entryJobs", input));
  }
}
