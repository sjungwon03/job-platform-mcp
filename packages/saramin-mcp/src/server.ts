import type { VisibleBrowserCrawler } from "@job-platform/browser-search-core";
import { McpServer, McpTool } from "@theorvane/type-mcp";
import {
  type GetSearchOptionsInput,
  getSearchOptions,
  getSearchOptionsInputSchema,
  type SearchJobsInput,
  searchJobs,
  searchJobsInputSchema,
} from "./tools/jobs.js";

const json = (value: unknown) => JSON.stringify(value, null, 2);

@McpServer({ name: "saramin-mcp", version: "0.2.0" })
export class SaraminMcpServer {
  client!: VisibleBrowserCrawler;

  @McpTool({
    name: "saramin_get_search_options",
    description:
      "사람인 사용자 표시형 브라우저 검색의 지역·경력·고용형태·근무방식·키워드·결과 수 옵션과 안전 경계를 조회합니다. API 키는 사용하지 않습니다.",
    input: getSearchOptionsInputSchema,
  })
  getSearchOptions(_input: GetSearchOptionsInput): string {
    return json(getSearchOptions());
  }

  @McpTool({
    name: "saramin_search_jobs",
    description:
      "화면이 보이는 브라우저에서 사람인 공개 검색을 한 번 실행하고 현재 화면의 공고를 최대 20건 반환합니다. 개인·비상업용 확인이 필수이며 로그인·CAPTCHA·차단을 우회하거나 다음 페이지를 자동 수집하지 않습니다.",
    input: searchJobsInputSchema,
  })
  async searchJobs(input: SearchJobsInput): Promise<string> {
    return json(await searchJobs(this.client, input));
  }
}
