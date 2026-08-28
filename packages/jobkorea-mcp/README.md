# jobkorea-mcp

[잡코리아 채용정보 API](https://www.jobkorea.co.kr/service/api)를 MCP 도구로 제공하는 독립 TypeMCP 패키지입니다.

## 전제 조건

잡코리아 API는 공개 공통 엔드포인트나 공용 API 키 방식이 아닙니다. 이용 신청과 내부 승인 후 요청 IP가 등록되고 고유 호출 링크와 가이드가 발급됩니다. 공공기관과 학교가 우선 제공 대상이며 기업·개인은 내부 검토 결과에 따라 제공되지 않을 수 있습니다.

발급받은 URL은 인증정보로 취급합니다.

- 저장소나 로그에 URL을 남기지 않습니다.
- HTTPS의 jobkorea.co.kr 호스트만 허용합니다.
- 발급 URL에 포함된 파라미터는 MCP 입력으로 덮어쓸 수 없습니다.
- 잡코리아가 함께 제공한 가이드에 명시된 검색 조건만 parameters에 전달합니다.

## 제공 도구

| 도구 | 필요한 환경변수 | 설명 |
| --- | --- | --- |
| jobkorea_get_search_options | - | 피드 구분과 사용자별 파라미터 적용 규칙 조회 |
| jobkorea_fetch_jobs | JOBKOREA_JOBS_API_URL | 신입·경력 채용정보 피드 호출 |
| jobkorea_fetch_entry_jobs | JOBKOREA_ENTRY_API_URL | 신입·인턴 공채 피드 호출 |

서버를 시작하려면 두 URL 중 하나 이상이 필요합니다. 설정되지 않은 피드만 호출하면 명확한 설정 오류를 반환합니다. JSON 응답은 구조화해 반환하고 XML 응답은 원문 텍스트로 반환합니다.

## 채용 검색 상세 옵션

잡코리아는 모든 사용자에게 공통인 공개 검색 파라미터 목록을 게시하지 않습니다. 승인 후 고유 호출 URL과 함께 받은 가이드가 해당 사용자의 유일한 기준이므로 MCP는 플랫폼 파라미터 이름을 임의로 만들지 않습니다.

`parameters`에는 발급 가이드에 있는 조건만 객체로 전달합니다.

- 키: 영문 대·소문자, 숫자, `_`, `.`, `-`
- 값: 문자열, 숫자 또는 불리언
- 발급 URL에 이미 포함된 키: 덮어쓰기 금지
- 가이드를 확인할 수 없는 경우: 빈 객체로 조회한 뒤 결과를 로컬에서 후처리

에이전트는 먼저 `jobkorea_get_search_options`를 호출해 이 규칙과 피드 구분을 확인할 수 있습니다. 실제 발급 가이드에 더 좁은 제약이 있으면 가이드가 우선합니다.

## 빌드

모노레포 루트에서:

~~~bash
pnpm install
pnpm --filter jobkorea-mcp build
pnpm --filter jobkorea-mcp test
~~~

MCP 호스트 설정 예시:

~~~json
{
  "mcpServers": {
    "jobkorea": {
      "command": "node",
      "args": ["/absolute/path/to/packages/jobkorea-mcp/dist/index.js"],
      "env": {
        "JOBKOREA_JOBS_API_URL": "your-issued-call-url",
        "JOBKOREA_ENTRY_API_URL": "your-issued-entry-call-url"
      }
    }
  }
}
~~~

## 설정

| 환경변수 | 필수 | 설명 |
| --- | --- | --- |
| JOBKOREA_JOBS_API_URL | 조건부 | 발급받은 일반 채용정보 고유 호출 링크 |
| JOBKOREA_ENTRY_API_URL | 조건부 | 발급받은 신입공채 고유 호출 링크 |
| JOBKOREA_REQUEST_TIMEOUT_MS | 아니요 | 요청 제한 시간, 기본 10000ms |

고유 호출 링크 발급과 IP 등록은 [잡코리아 API 안내](https://www.jobkorea.co.kr/service/api)를 참고하세요.
