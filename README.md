# Job Platform MCP Monorepo

채용 플랫폼 API별 MCP 서버를 독립 패키지로 관리하는 pnpm workspace 모노레포입니다.

| Workspace | MCP 서버 | 문서 |
| --- | --- | --- |
| packages/wanted-mcp | Wanted OpenAPI | [설정 및 도구](packages/wanted-mcp/README.md) |
| packages/saramin-mcp | 사람인 채용정보 API | [설정 및 도구](packages/saramin-mcp/README.md) |
| packages/jobkorea-mcp | 잡코리아 채용정보 API | [설정 및 도구](packages/jobkorea-mcp/README.md) |

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

pnpm --filter jobkorea-mcp build
pnpm --filter jobkorea-mcp test
~~~

실행과 MCP 호스트 등록에 필요한 환경변수는 각 패키지 README를 참고하세요. 실제 인증정보는 저장소에 커밋하지 않습니다.

## 채용 매칭 스킬

[job-match-search](skills/job-match-search/SKILL.md)는 사용자가 제공한 이력서·CV·포트폴리오에서 검색 조건을 만들고, 사용 가능한 채용 MCP를 함께 조회해 근거 기반 적합도 순으로 정리합니다.

- 공개 Agent Skills의 SKILL.md 형식만 사용합니다.
- Codex, Claude Code, OpenCode, OpenClaw 등 특정 에이전트의 전용 메타데이터에 의존하지 않습니다.
- 각 클라이언트가 지원하는 workspace skill 경로에 skills/job-match-search 디렉터리를 연결하거나 복사해서 사용합니다.
- 이력서 원문과 개인정보는 채용 API에 전달하지 않고 파생된 검색 조건만 사용합니다.
- 최초 사용 시 연결할 채용 플랫폼과 인증 발급 여부를 확인하고 안전한 로컬 입력 방법을 안내합니다.

~~~text
내 이력서와 포트폴리오를 분석해서 $job-match-search로 적합한 백엔드 채용공고를 찾아줘.
~~~
