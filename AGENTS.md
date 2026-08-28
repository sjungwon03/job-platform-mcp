# Repository Agent Guide

이 파일은 저장소 전체에 적용되는 개발 지침이다. 사람과 코딩 에이전트가 동일한 절차와 품질 기준으로 작업하기 위한 계약으로 사용한다.

## 목표

이 저장소는 한국 채용 플랫폼별 TypeMCP 서버와 이 서버들을 조합하는 이식 가능한 Agent Skill을 관리한다.

- packages/wanted-mcp: Wanted OpenAPI MCP
- packages/saramin-mcp: 사람인 채용정보 API MCP
- packages/jobkorea-mcp: 잡코리아 채용정보 API MCP
- skills/job-match-search: 이력서 기반 채용 검색 Agent Skill과 보안 인증 설정 도구

루트는 pnpm workspace와 검증 명령만 통합한다. 플랫폼별 인증, 클라이언트, 스키마와 테스트는 해당 패키지 안에 둔다.

## 작업 시작 전

1. README.md와 이 파일을 끝까지 읽는다.
2. git status, 현재 브랜치, origin/main과의 차이를 확인한다.
3. 작업에 대응하는 GitHub Issue가 있는지 확인한다.
4. Issue가 없고 GitHub 쓰기 권한이 있다면 구현 전에 Issue를 만든다.
5. Issue에 목표, 범위, 완료 조건과 보안 영향을 기록한다.
6. 최신 origin/main에서 이슈 전용 브랜치를 만든다.

GitHub 접근 권한이 없으면 Issue 내용을 로컬 작업 메모로 먼저 정리하되, PR을 만들기 전에 실제 Issue와 연결한다.

## 필수 개발 흐름

비긴급 변경은 다음 순서를 지킨다.

~~~text
Issue → Branch → Implementation → Verification → Commit → Push → Pull Request → Review → Merge
~~~

- main에 직접 커밋하거나 푸시하지 않는다.
- 사용자 요청 없이 PR을 병합하지 않는다.
- 승인되지 않은 force push, history rewrite, tag 또는 release 생성을 하지 않는다.
- 하나의 브랜치는 하나의 Issue를 해결한다.
- 범위가 커지면 별도 Issue로 분리한다.

### 브랜치 이름

~~~text
feat/issue-123-short-description
fix/issue-123-short-description
docs/issue-123-short-description
test/issue-123-short-description
chore/issue-123-short-description
refactor/issue-123-short-description
~~~

소문자 kebab-case를 사용하고 Issue 번호를 포함한다.

### 커밋

Conventional Commits 형식을 사용한다.

~~~text
feat(wanted): add company filter
fix(saramin): preserve zero-based pagination
docs: explain credential onboarding
test(jobkorea): cover issued URL validation
chore: update CI harness
~~~

- 커밋 하나에는 함께 검토할 수 있는 응집된 변경만 넣는다.
- 생성물, node_modules, dist, 실제 인증정보를 커밋하지 않는다.
- 사용자의 기존 변경을 덮어쓰거나 커밋에 섞지 않는다.

### Pull Request

- 제목은 Conventional Commit 형식을 사용한다.
- 본문에 Closes #이슈번호를 포함한다.
- 변경 이유, 구현 내용, 검증 명령, 보안·호환성 영향을 기록한다.
- UI나 출력 형식 변경은 예시 또는 스크린샷을 포함한다.
- CI가 실패한 상태로 완료했다고 보고하지 않는다.

## 구현 규칙

### 패키지 경계

- MCP 하나의 변경은 가능한 한 해당 packages 하위에 제한한다.
- 공용 코드 도입은 두 패키지 이상에서 실제 중복이 확인된 경우에만 고려한다.
- 플랫폼 API 응답 형식이나 인증 방식을 다른 플랫폼에 일반화하지 않는다.
- 도구 입력은 Zod로 검증하고 공개 도구 설명을 명확히 작성한다.
- 외부 API 오류에서 인증 헤더, 키, 발급 URL을 제거한다.

### Agent Skill

- skills/job-match-search/SKILL.md는 공개 Agent Skills 형식을 유지한다.
- 특정 에이전트 전용 필드는 사용자 요구가 없으면 추가하지 않는다.
- 상세 내용은 references, 반복 가능하고 결정적인 작업은 scripts로 분리한다.
- 스킬 변경 후 quick_validate.py 또는 동등한 Agent Skills validator를 실행한다.
- 이력서 원문이나 개인정보를 채용 검색 API로 보내지 않는다.

### 인증과 보안

- 비밀값을 코드, 테스트 fixture, 문서, 로그, Issue 또는 PR에 넣지 않는다.
- 인증 입력은 configure-credentials.mjs의 마스킹 TTY 흐름을 사용한다.
- 테스트에서는 명백한 가짜 값을 사용하고 테스트 종료 후 삭제한다.
- 새 외부 호스트를 허용하기 전에 HTTPS, 도메인, 리디렉션과 SSRF 영향을 검토한다.
- 사용자의 승인 없이 계정 생성, 결제, 지원서 제출 또는 외부 메시지 전송을 하지 않는다.

## 필수 검증

루트에서 다음 명령이 통과해야 한다.

~~~bash
pnpm install --frozen-lockfile
pnpm verify
git diff --check
~~~

pnpm verify는 다음을 포함한다.

- Biome lint
- TypeScript typecheck
- Agent Skill 보안 저장소 테스트
- 모든 MCP 패키지 테스트
- 모든 MCP 패키지 build

변경 범위에 따라 더 작은 테스트를 먼저 실행할 수 있지만 PR 전에는 전체 검증을 실행한다.

## 문서 규칙

- 사용자 설정이나 공개 동작이 바뀌면 README.md와 해당 패키지 README를 함께 갱신한다.
- 명령은 저장소 루트 실행인지 패키지 실행인지 명시한다.
- 예시에는 실제 키, 토큰, 발급 URL을 사용하지 않는다.
- 에이전트만 이해할 수 있는 암묵적 단계 대신 사람이 재현 가능한 명령과 결과를 적는다.

## 완료 조건

작업 완료 전에 확인한다.

- Issue의 완료 조건을 모두 충족했다.
- 관련 테스트와 pnpm verify가 통과했다.
- git diff --check가 통과했다.
- 비밀값과 생성물이 추적되지 않는다.
- README와 변경 문서가 실제 동작과 일치한다.
- 브랜치를 origin에 푸시했다.
- Issue를 연결한 PR을 만들었다.
- 남은 위험, 가정 또는 후속 작업을 PR에 기록했다.
