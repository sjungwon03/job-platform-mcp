# Contributing

기여해 주셔서 감사합니다. 이 저장소는 작은 개인 변경도 Issue → Branch → Pull Request 흐름으로 관리합니다.

에이전트를 사용한다면 루트 [AGENTS.md](AGENTS.md)도 먼저 읽어야 합니다.

## 1. Issue 만들기

버그 수정, 기능, 리팩터링, 문서 변경을 시작하기 전에 Issue를 생성합니다.

- 문제나 목표
- 변경 범위
- 완료 조건
- 인증·개인정보·외부 API에 대한 영향

비밀정보, 실제 API 응답의 개인정보, 잡코리아 발급 URL은 Issue에 포함하지 않습니다.

GitHub CLI 예시:

~~~bash
gh issue create
~~~

오탈자처럼 독립적인 Issue의 가치가 거의 없는 변경도 PR 본문에서 이유를 설명합니다.

## 2. main 동기화

작업 트리가 깨끗한지 확인하고 최신 main으로 이동합니다.

~~~bash
git status
git switch main
git pull --ff-only origin main
~~~

다른 사람의 로컬 변경이 있다면 임의로 삭제하거나 stash하지 말고 먼저 소유자와 조율합니다.

## 3. 이슈 브랜치 만들기

~~~bash
git switch -c feat/issue-123-short-description
~~~

허용 접두사:

| 접두사 | 용도 |
| --- | --- |
| feat | 사용자에게 보이는 기능 |
| fix | 버그 수정 |
| docs | 문서만 변경 |
| test | 테스트 추가·수정 |
| refactor | 동작을 바꾸지 않는 구조 개선 |
| chore | 도구, CI, 의존성, 저장소 관리 |

브랜치는 소문자 kebab-case로 작성하고 Issue 번호를 포함합니다.

## 4. 구현

- 가장 작은 변경으로 Issue의 완료 조건을 해결합니다.
- 각 MCP 패키지의 경계를 유지합니다.
- 공개 입력은 Zod 스키마로 검증합니다.
- API 인증정보가 오류, 로그와 테스트 출력에 노출되지 않게 합니다.
- 공개 동작이나 설정 변경은 문서도 함께 수정합니다.

## 5. 로컬 검증

최초 설치:

~~~bash
pnpm install --frozen-lockfile
~~~

전체 검증:

~~~bash
pnpm verify
git diff --check
~~~

패키지별 빠른 검증:

~~~bash
pnpm --filter wanted-mcp test
pnpm --filter saramin-mcp test
pnpm --filter jobkorea-mcp test
pnpm test:skill
~~~

PR을 만들기 전에는 변경 범위와 관계없이 pnpm verify를 실행합니다.

## 6. 커밋

Conventional Commits 형식을 사용합니다.

~~~bash
git add <files>
git commit -m "feat(wanted): add job filter"
~~~

권장 scope:

- wanted
- saramin
- jobkorea
- skill
- ci
- docs

커밋 전에 git diff --cached를 검토해 인증정보와 무관한 변경이 포함되지 않았는지 확인합니다.

## 7. Push와 Pull Request

~~~bash
git push -u origin feat/issue-123-short-description
gh pr create --fill
~~~

PR에는 반드시 다음을 포함합니다.

- Closes #123 형식의 Issue 연결
- 해결하려는 문제
- 주요 변경
- 실행한 검증과 결과
- 보안, 호환성 또는 API 사용량 영향
- 의도적으로 제외한 후속 작업

## 8. 리뷰와 병합

- CI의 verify job이 성공해야 합니다.
- 리뷰 의견은 새 커밋으로 반영하는 것을 기본으로 합니다.
- 리뷰 중 의미가 바뀐 경우 PR 설명과 테스트도 갱신합니다.
- 미해결 대화가 없을 때 병합합니다.
- 작성자가 임의로 검증을 우회하거나 main에 직접 push하지 않습니다.
- squash merge를 기본으로 사용하고 PR 제목이 최종 커밋 메시지로 적합한지 확인합니다.

## API와 인증정보

API 키는 각 사용자가 직접 발급받고 관리합니다.

- Wanted의 유료·별도 권한은 사용자 계정 범위에서만 사용합니다.
- 사람인 access-key를 공유하지 않습니다.
- 잡코리아 발급 URL은 URL 전체를 비밀정보로 취급합니다.
- 인증정보 노출을 발견하면 값을 복사하지 말고 즉시 폐기와 재발급을 안내합니다.

보안 인증 설정은 [README의 인증정보 안전하게 입력](README.md#4-인증정보-안전하게-입력)을 참고합니다.

## 새로운 MCP 도구 추가

1. 공식 API 문서에서 엔드포인트와 권한을 확인합니다.
2. 해당 패키지의 client 경계에 API 호출을 추가합니다.
3. tools 아래에 Zod 입력 스키마와 핸들러를 추가합니다.
4. server.ts에서 TypeMCP 도구를 등록합니다.
5. 설정, 입력, API 오류와 MCP 전송 테스트를 추가합니다.
6. 패키지 README의 도구와 환경변수 표를 갱신합니다.

문서에 공개되지 않은 파라미터나 태그 ID를 추측해 구현하지 않습니다.
