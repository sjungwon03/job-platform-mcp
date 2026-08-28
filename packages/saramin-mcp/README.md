# saramin-mcp

[사람인 채용정보 API](https://oapi.saramin.co.kr/)를 MCP 도구로 제공하는 독립 TypeScript 프로젝트입니다. TypeMCP 데코레이터와 stdio 전송을 사용하며, 다른 MCP 서버와 별도 프로세스로 실행됩니다.

## 제공 도구

| 도구 | 설명 |
| --- | --- |
| saramin_get_search_options | 고용형태·학력·정렬 코드, 날짜·페이지 규칙과 공식 코드표 링크 조회 |
| saramin_search_jobs | 키워드, 지역, 업종, 직무, 고용형태, 학력, 날짜 조건으로 채용공고 검색 |
| saramin_get_job | 사람인 공고 번호로 채용공고 조회 |

공식 채용 공고 API의 0 기반 페이지, 최대 110개 결과, 정렬 코드와 다중 코드 검색을 지원합니다.

## 채용 검색 상세 옵션

| 입력 | 허용값·형식 | 설명 |
| --- | --- | --- |
| keywords | 문자열 | 기업명·공고명·업직종·직무내용 검색 |
| bbs_gb | `1` | 공채속보만 조회 |
| stock | `kospi`, `kosdaq`, `konex` 배열 | 유가증권·코스닥·코넥스 |
| sr | `directhire` | 헤드헌팅·파견 공고 제외 |
| loc_cd / loc_mcd / loc_bcd | 코드 배열 | 지역 코드 |
| ind_cd | 코드 배열 | 산업·업종 코드 |
| job_mid_cd / job_cd | 코드 배열 | 상위 직무·직무 코드 |
| job_type | `1`~`22` 코드 배열 | 고용형태 |
| edu_lv | `0`~`9` 코드 배열 | 학력 |
| fields | posting-date, expiration-date, keyword-code, count | 추가 응답 필드 |
| published / updated | YYYY-MM-DD | 등록·수정일 조건 |
| published_min·max / updated_min·max | YYYY-MM-DD HH:mm:ss 또는 Unix timestamp | 등록·수정일시 범위 |
| deadline | today, tomorrow, YYYY-MM-DD HH:mm:ss 또는 Unix timestamp | 마감 조건 |
| start | 0 이상 정수, 기본 0 | 0 기반 페이지 번호 |
| count | 1~110, 기본 10 | 페이지당 결과 수 |
| sort | pd, pa, ud, ua, da, dd, rc, ac | 정렬 코드 |

고용형태 1~22와 학력 0~9의 전체 한글 의미는 MCP의 `saramin_get_search_options` 결과에 포함됩니다. 정렬은 `pd` 등록 최신(기본), `pa` 등록 오래된, `ud` 수정 최신, `ua` 수정 오래된, `da` 마감 임박, `dd` 마감 먼 순, `rc` 조회수, `ac` 지원자 수 순입니다.

큰 코드 목록은 사람인의 [지역 코드표](https://oapi.saramin.co.kr/guide/code-table2), [산업·업종 코드표](https://oapi.saramin.co.kr/guide/code-table3), [직무·직업 코드표](https://oapi.saramin.co.kr/guide/code-table5)를 사용합니다. 같은 파라미터의 여러 검색어와 서로 다른 파라미터는 AND로 결합되며 와일드카드와 OR 검색은 지원하지 않습니다.

## 인증 원칙

이 서버는 공용 access-key를 제공하거나 사람인 API 사용 권한을 대신 관리하지 않습니다. 각 사용자가 [사람인 API 이용 신청](https://oapi.saramin.co.kr/) 후 발급받은 키를 자신의 MCP 호스트 환경에 설정합니다.

- access-key는 사람인 API 요청 쿼리에만 추가합니다.
- 키를 로그나 MCP 응답에 포함하지 않습니다.
- 사용량 제한 초과 등 사람인 오류는 키를 제외한 안전한 오류로 반환합니다.
- 실제 키가 담긴 .env 또는 MCP 호스트 설정은 Git에 커밋하지 않습니다.

## 시작하기

Node.js 22 이상과 pnpm이 필요합니다. 모노레포 루트에서 실행합니다.

~~~bash
pnpm install
pnpm --filter saramin-mcp build
~~~

MCP 호스트 설정 예시:

~~~json
{
  "mcpServers": {
    "saramin": {
      "command": "node",
      "args": ["/absolute/path/to/packages/saramin-mcp/dist/index.js"],
      "env": {
        "SARAMIN_ACCESS_KEY": "your-access-key"
      }
    }
  }
}
~~~

선택 설정:

| 환경변수 | 필수 | 기본값 | 설명 |
| --- | --- | --- | --- |
| SARAMIN_ACCESS_KEY | 예 | - | 사용자 소유 사람인 API access-key |
| SARAMIN_API_BASE_URL | 아니요 | https://oapi.saramin.co.kr | API 베이스 URL |
| SARAMIN_REQUEST_TIMEOUT_MS | 아니요 | 10000 | 요청 제한 시간(ms) |

## 개발

~~~bash
pnpm --filter saramin-mcp dev
pnpm --filter saramin-mcp lint
pnpm --filter saramin-mcp typecheck
pnpm --filter saramin-mcp test
pnpm --filter saramin-mcp build
~~~

## 구조

~~~text
src/
├── index.ts           # 설정, 의존성 조립, stdio 시작
├── server.ts          # TypeMCP 도구 등록
├── config.ts          # access-key와 런타임 설정 검증
├── saramin-client.ts  # 사람인 API HTTP 경계
├── errors.ts          # 설정/API 오류
└── tools/
    └── jobs.ts        # 검색·공고번호 조회 스키마와 핸들러
test/                  # 설정, 클라이언트, 도구, MCP 전송 테스트
~~~

사람인 지역·업종·직무 코드는 공식 문서의 [코드표](https://oapi.saramin.co.kr/guide/job-search)를 참고해 도구 입력 배열로 전달합니다.
