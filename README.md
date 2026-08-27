# Job Platform MCP Monorepo

채용 플랫폼 API별 MCP 서버를 독립 패키지로 관리하는 pnpm workspace 모노레포입니다.

| Workspace | MCP 서버 | 문서 |
| --- | --- | --- |
| packages/wanted-mcp | Wanted OpenAPI | [설정 및 도구](packages/wanted-mcp/README.md) |
| packages/saramin-mcp | 사람인 채용정보 API | [설정 및 도구](packages/saramin-mcp/README.md) |

각 패키지는 별도 stdio 프로세스로 실행되며 인증정보, API 클라이언트, 도구 스키마를 공유하지 않습니다. 루트 workspace는 의존성 설치, 단일 lockfile과 전체 검증만 통합합니다.

## 설치와 전체 검증

~~~bash
pnpm install
pnpm verify
~~~

## 패키지별 명령

~~~bash
pnpm --filter wanted-mcp build
pnpm --filter wanted-mcp test

pnpm --filter saramin-mcp build
pnpm --filter saramin-mcp test
~~~

실행과 MCP 호스트 등록에 필요한 환경변수는 각 패키지 README를 참고하세요. 실제 인증정보는 저장소에 커밋하지 않습니다.
