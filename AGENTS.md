# Repository Agent Guide

이 파일은 저장소 전체에 적용되는 개발 지침이다. 사람과 코딩 에이전트가 동일한 절차와 품질 기준으로 작업하기 위한 계약으로 사용한다.

## 목표

이 저장소는 한국 채용 플랫폼의 공개 검색 화면을 사용자에게 보이는 브라우저로 탐색하는 TypeMCP 서버와 이들을 조합하는 이식 가능한 Agent Skill을 관리한다.

- packages/browser-search-core: 화면 표시형 Chromium 실행, 허용 호스트, 현재 화면 추출과 공통 입력
- packages/wanted-mcp: Wanted 공개 검색 브라우저 MCP
- packages/saramin-mcp: 사람인 공개 검색 브라우저 MCP
- packages/jobkorea-mcp: 잡코리아 공개 검색 브라우저 MCP
- skills/job-match-search: 이력서 기반 검색 조건 생성, MCP 라우팅과 적합도 평가

플랫폼별 검색 URL과 링크 판별 규칙은 해당 MCP에 둔다. 공통 브라우저 수명주기와 안전 제한만 browser-search-core에 둔다.

## 작업 시작 전

1. README.md와 이 파일을 끝까지 읽는다.
2. git status, 현재 브랜치, origin/main과의 차이를 확인한다.
3. 대응하는 GitHub Issue가 있는지 확인하고 없으면 구현 전에 만든다.
4. Issue에 목표, 범위, 완료 조건, 개인정보·브라우저 자동화 영향을 기록한다.
5. 최신 origin/main에서 이슈 전용 브랜치를 만든다.

GitHub 권한이 없으면 로컬 작업 메모를 만들되 PR 전에 실제 Issue와 연결한다.

## 필수 개발 흐름

~~~text
Issue → Branch → Implementation → Verification → Commit → Push → Pull Request → Review → Merge
~~~

- main에 직접 커밋하거나 푸시하지 않는다.
- 사용자 요청 없이 PR을 병합하지 않는다.
- 승인되지 않은 force push, history rewrite, tag 또는 release를 만들지 않는다.
- 하나의 브랜치는 하나의 Issue만 해결한다.
- 범위가 커지면 별도 Issue로 나눈다.

브랜치는 feat/issue-123-description, fix/issue-123-description, docs/issue-123-description, test/issue-123-description, chore/issue-123-description, refactor/issue-123-description 형식의 소문자 kebab-case를 사용한다.

커밋은 Conventional Commits 형식을 사용한다. 예: feat(wanted): add visible job extraction, fix(saramin): stop on captcha, docs: explain browser consent.

## Pull Request

- 제목은 Conventional Commit 형식으로 작성한다.
- 본문에 Closes #이슈번호를 포함한다.
- 변경 이유, 구현 내용, 검증 명령, 보안·약관·호환성 영향을 기록한다.
- 출력 변경은 예시를 포함한다.
- CI가 실패한 상태로 완료했다고 보고하지 않는다.

## 구현 규칙

### 패키지 경계

- 플랫폼 URL, 검색 파라미터와 공고 링크 규칙은 해당 packages/*-mcp 안에 둔다.
- 공통 브라우저 실행, 표시 여부 확인, 결과 제한과 호스트 검사는 browser-search-core에 둔다.
- 플랫폼 내부 API, 내장 JSON, 비공개 엔드포인트 또는 위장 헤더를 사용하지 않는다.
- 모든 공개 입력은 Zod로 검증하고 MCP 도구 설명에 제한을 노출한다.
- 반환 URL은 HTTPS와 정확한 플랫폼 호스트를 다시 검증한다.

### 브라우저 자동화

- 반드시 headless: false로 사용자가 볼 수 있게 실행한다.
- 새 비영구 브라우저 컨텍스트만 사용하고 기존 사용자 프로필이나 디버깅 포트에 연결하지 않는다.
- 현재 화면의 실제 표시 링크만 읽고 호출당 최대 20건으로 제한한다.
- 다음 페이지, 무한 스크롤, 상세 페이지 묶음 탐색, 예약·백그라운드 수집을 구현하지 않는다.
- 원문, HTML, 내장 JSON, 쿠키, 세션이나 결과 데이터베이스를 저장하지 않는다.
- 로그인, CAPTCHA, robots.txt, 403·429, IP 차단과 호출 제한을 우회하지 않는다.
- 차단 신호가 나타나면 실패를 반환하고 해당 호출을 즉시 끝낸다.

### Agent Skill

- skills/job-match-search/SKILL.md는 공개 Agent Skills 형식을 유지한다.
- 특정 에이전트 전용 필드는 사용자 요구가 없으면 추가하지 않는다.
- 상세 정책은 references, 반복 가능하고 결정적인 실행은 scripts로 분리한다.
- 스킬 변경 후 quick_validate.py 또는 동등한 Agent Skills validator를 실행한다.
- 이력서 원문과 개인정보를 MCP 검색어로 보내지 않는다.

### 개인정보와 외부 변경

- 검색에는 직무, 핵심 기술, 경력 범위, 지역 같은 최소 파생 조건만 사용한다.
- 이름, 이메일, 전화번호, 주소, 생년월일과 계정 식별자를 URL·로그·Issue·PR에 넣지 않는다.
- 인증정보를 요구하거나 저장하는 기능을 다시 추가하지 않는다.
- 사용자 승인 없이 로그인, 계정 생성, 결제, 지원서 제출 또는 외부 메시지 전송을 하지 않는다.

## 필수 검증

저장소 루트에서 모두 통과해야 한다.

~~~bash
pnpm install --frozen-lockfile
pnpm verify
git diff --check
~~~

pnpm verify는 Biome lint, TypeScript typecheck, Agent Skill 계약 테스트, browser-search-core 테스트, 모든 MCP 테스트와 build를 포함한다. 실제 브라우저 사이트 호출은 기본 테스트에서 실행하지 않는다. URL, 호스트, 스키마, 도구 계약과 추출 정책은 결정적인 테스트 더블로 검증한다.

## 문서 규칙

- 공개 동작이나 설정이 바뀌면 루트 README와 해당 패키지 README를 함께 갱신한다.
- 명령의 실행 위치를 명시한다.
- API 키·인증 설정을 전제로 한 문구를 남기지 않는다.
- 브라우저 자동화를 단순한 수동 검색, 플랫폼 허가 또는 법적 우회로 표현하지 않는다.
- 사람이 재현할 수 있는 명령, 입력과 결과를 적는다.

## 완료 조건

- Issue 완료 조건을 모두 충족했다.
- pnpm verify와 git diff --check가 통과했다.
- API 클라이언트, 인증 설정과 오래된 도구 이름이 남아 있지 않다.
- 브라우저 표시, 최대 20건, 무저장, 무우회 경계가 코드와 문서에 일치한다.
- 비밀값과 생성물이 추적되지 않는다.
- 브랜치를 origin에 푸시하고 Issue를 연결한 PR을 만들었다.
- 남은 사이트 선택자 위험과 후속 작업을 PR에 기록했다.
