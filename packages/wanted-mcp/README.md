# wanted-mcp

[Wanted OpenAPI](https://openapi.wanted.jobs/)를 MCP 도구로 제공하기 위한 TypeScript 프로젝트입니다. [TypeMCP](https://www.npmjs.com/package/@theorvane/type-mcp) 데코레이터를 사용하며, 로컬 MCP 호스트가 stdio 프로세스로 실행하는 구조입니다.

현재 초기 버전에는 Wanted OpenAPI V2의 GET /jobs와 검색 옵션 안내를 제공하는 다음 도구가 포함되어 있습니다.

| 도구 | 설명 |
| --- | --- |
| wanted_get_search_options | 정렬·우대 코드, 경력·태그 제한, 페이지 규칙 조회 |
| wanted_list_jobs | 지원되는 상세 조건으로 포지션 목록 조회 |

## 채용 검색 상세 옵션

| 입력 | 형식·제약 | 의미 |
| --- | --- | --- |
| category_tag | 정수 1개 | 직군 태그 ID |
| subcategory_tags | 정수 배열, 최대 5개 | 직무 태그 ID |
| skill_tags | 정수 배열, 최대 5개 | 스킬 태그 ID |
| attraction_tags | 정수 배열, 최대 5개 | 매력 태그 ID |
| years | 0~10 정수 배열, 최대 2개 | 경력 범위. 10은 10년 이상 |
| locations | 비어 있지 않은 문자열 배열 | 지역·국가 |
| additional_apply_types | 아래 고정 코드 배열 | 외국인·병역특례·장애인 우대 |
| sort | 아래 고정 코드, 기본 latest | 정렬 |
| offset | 0 이상 정수, 기본 0 | 결과 오프셋 |
| limit | 양의 정수, 기본 20 | 결과 수. 공식 V2 명세에는 상한 미기재 |

정렬 코드는 `job.latest_order`(최신순), `job.popularity_order`(인기순), `company.response_rate_order`(기업 응답률순)입니다. 우대 코드는 `job.additional_apply_type.foreigner`, `job.additional_apply_type.alternative_military`, `job.additional_apply_type.disabled_person`입니다.

태그 필터에는 이름이 아닌 원티드의 숫자 태그 ID를 전달합니다. 현재 공개 [V2 OpenAPI 명세](https://openapi.wanted.jobs/v2/openapi.json)는 GET /jobs만 노출하므로 이 MCP가 태그 ID를 추측하지 않습니다. 직원 수 필터 역시 소개 페이지에는 언급되지만 현재 GET /jobs 요청 스키마에는 없어 구현하지 않았습니다.

## 과금과 인증 원칙

이 프로젝트는 Wanted API 사용료를 대신 결제하거나 공용 인증키를 제공하지 않습니다. 각 사용자가 Wanted에 직접 인증키를 신청하고, 본인 계정에 부여된 무료·유료 API 권한을 사용합니다.

- 인증정보는 MCP 호스트가 실행 환경변수로 주입합니다.
- wanted-client-id, wanted-client-secret, 선택적 Authorization 헤더는 Wanted API에만 전달합니다.
- 인증정보를 파일에 저장하거나 로그 및 MCP 응답에 포함하지 않습니다.
- 유료 또는 별도 승인 기능은 사용자의 키에 해당 권한이 있을 때 그대로 호출할 수 있도록 확장합니다.
- 과금·권한 부족 응답은 MCP 서버가 우회하지 않고 Wanted API의 HTTP 오류로 반환합니다.

인증키는 [Wanted OpenAPI 신청 페이지](https://openapi.wanted.jobs/apply/)에서 사용자별로 발급받아야 합니다.

## 시작하기

요구 사항은 Node.js 22 이상과 pnpm입니다. 모노레포 루트에서 실행합니다.

~~~bash
pnpm install
pnpm --filter wanted-mcp build
~~~

환경변수를 설정합니다.

~~~bash
export WANTED_CLIENT_ID="your-client-id"
export WANTED_CLIENT_SECRET="your-client-secret"
export WANTED_AUTHORIZATION="Bearer your-permission-token"
~~~

WANTED_AUTHORIZATION은 Wanted에서 별도 권한 토큰을 발급한 사용자만 설정하면 됩니다.

빌드된 stdio 서버를 직접 실행하려면:

~~~bash
pnpm --filter wanted-mcp start
~~~

stdio 서버는 터미널에서 화면을 제공하지 않습니다. 아래처럼 MCP 호스트에 등록해 사용합니다.

~~~json
{
  "mcpServers": {
    "wanted": {
      "command": "node",
      "args": ["/absolute/path/to/packages/wanted-mcp/dist/index.js"],
      "env": {
        "WANTED_CLIENT_ID": "your-client-id",
        "WANTED_CLIENT_SECRET": "your-client-secret",
        "WANTED_AUTHORIZATION": "Bearer your-permission-token"
      }
    }
  }
}
~~~

## 개발

~~~bash
pnpm --filter wanted-mcp dev
pnpm --filter wanted-mcp lint
pnpm --filter wanted-mcp typecheck
pnpm --filter wanted-mcp test
pnpm --filter wanted-mcp build
~~~

## 구조

~~~text
src/
├── index.ts           # 설정, 의존성 조립, stdio 시작
├── server.ts          # TypeMCP 도구 등록
├── config.ts          # 사용자별 인증정보와 런타임 설정 검증
├── wanted-client.ts   # Wanted OpenAPI HTTP/인증 경계
├── errors.ts          # 안전한 설정/API 오류
└── tools/
    └── jobs.ts        # jobs 스키마와 핸들러
test/                  # 설정, 클라이언트, 도구 입력 테스트
~~~

새 기능은 src/tools/<domain>.ts에 Zod 입력 스키마와 핸들러를 추가하고 src/server.ts에서 @McpTool로 노출합니다. Companies, Tags, Search, Stat, 별도 승인 AI API는 각 명세 버전을 확인한 뒤 도메인별로 확장할 수 있습니다.

## 설정

| 환경변수 | 필수 | 기본값 | 설명 |
| --- | --- | --- | --- |
| WANTED_CLIENT_ID | 예 | - | 사용자가 발급받은 Client ID |
| WANTED_CLIENT_SECRET | 예 | - | 사용자가 발급받은 Client Secret |
| WANTED_AUTHORIZATION | 아니요 | - | 권한형·유료 기능용으로 발급된 Authorization 값 |
| WANTED_API_BASE_URL | 아니요 | https://openapi.wanted.jobs/v2 | 테스트/운영 API 베이스 URL |
| WANTED_REQUEST_TIMEOUT_MS | 아니요 | 10000 | 요청 제한 시간(ms) |

실제 인증정보가 담긴 .env 또는 MCP 설정 파일은 Git에 커밋하지 마세요.
