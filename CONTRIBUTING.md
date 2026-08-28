# Contributing

이 저장소는 작은 변경도 Issue → Branch → Pull Request 흐름으로 관리합니다. 에이전트는 루트 AGENTS.md도 끝까지 읽어야 합니다.

## 작업 흐름

1. 목표, 범위, 완료 조건, 개인정보·브라우저 자동화 영향을 적은 Issue를 만듭니다.
2. 최신 origin/main에서 이슈 번호가 포함된 브랜치를 만듭니다.
3. 한 플랫폼 변경은 해당 MCP 패키지에 제한하고 공통 동작만 browser-search-core에 둡니다.
4. 테스트와 문서를 함께 갱신합니다.
5. 루트에서 전체 검증을 실행합니다.
6. Conventional Commit으로 커밋하고 origin에 푸시합니다.
7. Closes #번호가 포함된 한국어 PR을 만듭니다.
8. CI와 리뷰가 끝난 뒤에만 병합합니다.

~~~bash
git status
git switch main
git pull --ff-only origin main
git switch -c feat/issue-123-short-description
pnpm install --frozen-lockfile
pnpm verify
git diff --check
~~~

main 직접 커밋, force push, history rewrite, tag와 release는 명시적인 승인 없이 수행하지 않습니다.

## 브라우저 MCP 변경

- 검색 URL과 공고 링크 규칙은 공개 검색 화면에서 확인합니다.
- 숨겨진 API, 페이지 내장 JSON, 네트워크 요청 복제와 브라우저 위장 헤더를 사용하지 않습니다.
- 정확한 HTTPS 호스트를 허용 목록으로 검사합니다.
- headless: false와 비영구 컨텍스트를 유지합니다.
- 현재 화면의 표시 링크만 최대 20건 반환합니다.
- CAPTCHA, 로그인, 차단과 속도 제한 우회 기능은 받지 않습니다.
- 다음 페이지 자동 순회, 예약 수집, 병렬 대량 수집과 저장 기능을 받지 않습니다.
- 입력 스키마, URL 생성, 호스트 차단과 MCP 계약 테스트를 추가합니다.
- 실제 외부 사이트 E2E는 기본 CI에서 실행하지 않습니다.

## 문서와 개인정보

공개 동작이 바뀌면 README.md, 해당 패키지 README, Skill과 COMPLIANCE.md의 관련 부분을 함께 갱신합니다. 이력서 원문, 이름, 연락처, 주소, 계정 식별자, 쿠키와 실제 검색 결과 전체를 fixture, 로그, Issue 또는 PR에 넣지 않습니다.

## 검증과 PR

~~~bash
pnpm --filter @job-platform/browser-search-core test
pnpm --filter wanted-mcp test
pnpm --filter saramin-mcp test
pnpm --filter jobkorea-mcp test
pnpm test:skill
pnpm verify
git diff --check
~~~

PR 제목은 Conventional Commit 형식으로 작성하고 본문에 변경 이유, 구현, 검증 결과, 브라우저·약관·호환성 영향, 의도적으로 제외한 후속 작업과 Closes #번호를 포함합니다.
