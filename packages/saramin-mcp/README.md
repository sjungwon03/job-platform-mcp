# saramin-mcp

사람인의 공개 채용 검색 화면을 사용자가 볼 수 있는 브라우저에서 열고 현재 화면에 표시된 공고를 최대 20건 읽는 독립 TypeMCP stdio 서버입니다. 채용 API와 인증키를 사용하지 않습니다.

## 도구

### saramin_get_search_options

입력 없이 공통 검색 필드, 값 제한, 개인 사용 확인과 브라우저 안전 경계를 반환합니다.

### saramin_search_jobs

https://www.saramin.co.kr/zf_user/search/recruit에서 공개 검색을 한 번 실행합니다.

| 입력 | 제한 |
| --- | --- |
| query | 필수, 1~120자 |
| locations | 최대 5개 |
| experience.minYears / maxYears | 각각 0~50, 최소는 최대 이하 |
| employmentTypes | 정규직, 계약직, 인턴, 프리랜서 |
| workModes | 출근, 하이브리드, 원격 |
| includeKeywords / excludeKeywords | 각각 최대 10개 |
| limit | 1~20, 기본값 10 |
| acknowledgePersonalUse | true만 허용 |

검색 조건은 공식 검색창에 넣을 자연어로 조합됩니다. 열린 브라우저에서 사용자가 공식 필터 UI를 추가로 조정할 수 있습니다. 이력서 원문이나 개인정보를 입력하지 마세요.

## 화면 추출

- Playwright Core로 설치된 Chrome을 headless: false로 실행합니다.
- 새 비영구 컨텍스트와 탭 하나를 사용합니다.
- a[href*="/zf_user/jobs/relay/view"]에 해당하고 화면에 실제 크기가 있는 HTTPS 링크만 후보로 봅니다.
- 최종 URL의 호스트를 다시 확인하고 제목, URL, 최대 600자의 카드 문맥을 반환합니다.
- excludeKeywords는 현재 화면에서 읽은 카드 문맥에만 적용됩니다.
- CAPTCHA 또는 접근 제한 문구가 보이면 즉시 실패합니다.

선택자는 플랫폼 화면 개편에 따라 바뀔 수 있습니다. 결과가 0건이면 브라우저 화면을 확인한 뒤 Issue로 선택자 변경을 제안하세요.

## 실행

저장소 루트에서:

~~~bash
pnpm install --frozen-lockfile
pnpm --filter saramin-mcp build
pnpm --filter saramin-mcp start
~~~

MCP 호스트에는 다음처럼 등록합니다.

~~~json
{
  "command": "node",
  "args": [
    "/absolute-path/job-platform-mcp/skills/job-match-search/scripts/run-mcp.mjs",
    "saramin"
  ]
}
~~~

인증 설정은 없습니다. 선택 환경변수:

~~~text
JOB_BROWSER_CHANNEL=chrome
JOB_BROWSER_EXECUTABLE_PATH=/absolute/path/to/chrome
JOB_BROWSER_TIMEOUT_MS=30000
JOB_BROWSER_SETTLE_MS=2000
~~~

## 제한

개인·비상업용 단일 검색만 지원합니다. 다음 페이지 자동 순회, 무한 스크롤, 상세 페이지 묶음 탐색, 로그인, 지원, 결제, 결과 저장, 숨겨진 API, 내장 JSON, 위장 헤더와 차단 우회는 지원하지 않습니다.

사용 전 루트 COMPLIANCE.md와 사람인 최신 약관을 확인하세요.
