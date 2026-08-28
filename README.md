# Job Platform MCP Monorepo

Wanted, 사람인, 잡코리아 채용 API를 각각 독립된 MCP 서버로 제공하고, 이력서·포트폴리오를 바탕으로 맞춤 채용공고를 찾는 Agent Skill을 함께 제공하는 TypeScript 모노레포입니다.

이 문서는 사람이 직접 설정할 때와 Codex, Claude Code, OpenCode, OpenClaw 같은 에이전트가 대신 설정할 때 모두 사용할 수 있는 기준 문서입니다.

> **먼저 확인하세요:** 이 프로젝트는 공개 웹 크롤러가 아닙니다. 공식 API 모드와 사용자 화면에서 단일 검색을 수행하는 개인용 브라우저 모드를 구분합니다. 브라우저 모드는 법적 제한의 우회나 플랫폼 이용허락을 뜻하지 않습니다. 사용 전에 아래 자격 표와 [데이터 공급자 이용 정책](COMPLIANCE.md)을 확인하세요.

## 연결 자격 요약

| 플랫폼 | 신청 전제 | 과금·배포 주의사항 |
| --- | --- | --- |
| Wanted | 사업자등록번호, 회사명, 서비스 URL이 필수이며 권한별 심사 | 승인된 서비스·권한·계약 범위에서만 사용 |
| 사람인 | 회사명/학교명, 부서명/전공명, 서비스 URL과 목적을 제출하고 승인 | API 서비스 재판매·이용요금 부과 금지. 상업용은 별도 서면 허가 필요 |
| 잡코리아 | 공공기관·학교 우선. 기관·서비스·서버 IP와 목적 심사 후 고유 URL 발급 | 개인·일반 기업은 승인되지 않을 수 있음 |

승인되지 않은 API는 등록하지 않으며 비공개 API나 접근 제한 우회로 대체하지 않습니다. 승인 가능한 API가 없다면 개인·비상업용에 한해 사용자가 보는 브라우저에서 사람인·잡코리아 단일 검색을 열거나, 사용자가 직접 제공한 공고 텍스트와 파일을 비교할 수 있습니다.

개인용 브라우저 모드는 백그라운드 크롤러가 아닙니다. 검색당 현재 화면의 최대 20건만 요약하고, 추가 페이지는 사용자 요청이 있을 때 한 페이지만 이동하며, 원문·HTML·쿠키를 저장하지 않습니다.

## 제공 기능

| 패키지 | 플랫폼 | MCP 도구 | 인증 방식 |
| --- | --- | --- | --- |
| [wanted-mcp](packages/wanted-mcp/README.md) | Wanted OpenAPI | wanted_get_search_options, wanted_list_jobs | 사용자 Client ID와 Client Secret |
| [saramin-mcp](packages/saramin-mcp/README.md) | 사람인 채용정보 API | saramin_get_search_options, saramin_search_jobs, saramin_get_job | 사용자 access-key |
| [jobkorea-mcp](packages/jobkorea-mcp/README.md) | 잡코리아 채용정보 API | jobkorea_get_search_options, jobkorea_fetch_jobs, jobkorea_fetch_entry_jobs | 승인 후 발급된 사용자별 호출 URL |

[job-match-search](skills/job-match-search/SKILL.md) 스킬은 다음 작업을 수행합니다.

- 사용자가 제공한 이력서, CV, 경력기술서, 포트폴리오 분석
- 목표 직무, 경력, 기술, 도메인과 선호 조건 추출
- 지역이나 상세 조건이 없으면 검색 전에 한 번에 질문
- 사용자가 조건 입력을 건너뛰면 지역·근무 형태 제한 없이 검색
- 연결된 Wanted, 사람인, 잡코리아 MCP를 함께 조회
- 중복 공고 제거와 근거 기반 적합도 평가
- 상위 공고의 일치 근거, 부족한 요건과 원문 링크 제공
- 승인된 API가 없는 개인 사용자를 위한 화면 표시형 사람인·잡코리아 검색
- 브라우저 현재 화면의 제한된 결과를 이력서 프로필과 비교

## 설계 원칙

- 세 MCP는 별도 stdio 프로세스로 실행됩니다.
- TypeMCP 0.4.0과 분리형 MCP SDK v2 런타임을 사용합니다.
- stdio 서버는 factory 방식으로 시작해 MCP 2025·2026 프로토콜을 협상합니다.
- 플랫폼별 인증정보와 API 클라이언트를 서로 공유하지 않습니다.
- 각 사용자가 현재 기관·서비스·용도로 직접 승인받은 API 권한만 사용합니다.
- 유료 기능은 사용자의 계정에 권한이 있을 때만 호출됩니다.
- 이력서 원문과 개인정보를 채용 API에 전송하지 않습니다.
- 검색에 필요한 직무명, 기술, 경력, 지역 같은 최소 파생 조건만 API로 전달합니다.
- 사용자의 확인 없이 지원서 제출, 계정 생성, 담당자 연락 또는 결제를 수행하지 않습니다.
- 개인용 브라우저 모드도 숨겨진 API, HTML 대량 수집, 자동 페이지 순회 또는 접근 제한 우회로 확장하지 않습니다.

## 요구 사항

- Node.js 22 이상
- pnpm 11 이상
- Git
- 공식 API 모드에서 사용할 채용 플랫폼의 인증정보. 개인용 브라우저 모드만 사용하면 선택 사항

버전을 확인합니다.

~~~bash
node --version
pnpm --version
git --version
~~~

## 빠른 시작

### 1. 저장소 받기

~~~bash
git clone https://github.com/sjungwon03/job-platform-mcp.git
cd job-platform-mcp
~~~

아직 원격 저장소를 받기 전 로컬 작업 중이라면 현재 저장소 루트에서 다음 단계부터 진행합니다.

### 2. 의존성 설치와 빌드

~~~bash
pnpm install
pnpm build
~~~

전체 상태를 검증하려면:

~~~bash
pnpm verify
~~~

검증에는 lint, TypeScript 타입 검사, 보안 저장소 테스트, MCP 테스트와 프로덕션 빌드가 포함됩니다.

### 3. API 인증정보 준비

원하는 플랫폼만 설정하면 됩니다. 세 플랫폼을 모두 사용할 필요는 없습니다.

인증정보보다 먼저 신청 주체, 서비스 URL, 이용목적과 상업·과금 여부가 플랫폼 승인 범위에 맞는지 확인합니다. 각 서버는 승인 확인 환경변수가 없으면 시작하지 않습니다. 이 값은 승인 증명이 아니라 운영자의 명시적 확인입니다.

#### Wanted

발급: https://openapi.wanted.jobs/apply/

| 환경변수 | 필수 | 설명 |
| --- | --- | --- |
| WANTED_API_USE_APPROVED | 예 | 현재 서비스·이용목적이 승인된 경우에만 `true` |
| WANTED_CLIENT_ID | 예 | 사용자가 발급받은 Client ID |
| WANTED_CLIENT_SECRET | 예 | 사용자가 발급받은 Client Secret |
| WANTED_AUTHORIZATION | 아니요 | 별도 권한 또는 유료 기능에 필요한 Authorization 값 |

이 프로젝트는 API 비용을 대신 결제하거나 공용 키를 제공하지 않습니다. 유료 기능을 사용할 경우 해당 MCP 사용자가 자신의 Wanted 계정으로 권한과 결제를 관리합니다.

신청에는 사업자등록번호, 회사명과 서비스 URL이 필요합니다.

#### 사람인

발급: https://oapi.saramin.co.kr/

| 환경변수 | 필수 | 설명 |
| --- | --- | --- |
| SARAMIN_API_USE_APPROVED | 예 | 승인된 용도이며 과금 제한을 준수하는 경우에만 `true` |
| SARAMIN_ACCESS_KEY | 예 | 사용자가 발급받은 access-key |

사람인의 이용자 주의사항은 API를 사용한 서비스의 재판매와 이용요금 부과를 금지합니다. 유료·상업 서비스는 사람인의 별도 서면 허가 없이 연결하지 않습니다.

#### 잡코리아

안내: https://www.jobkorea.co.kr/service/api

잡코리아는 이용 승인과 요청 IP 등록 후 고유 호출 URL을 제공합니다.

| 환경변수 | 필수 | 설명 |
| --- | --- | --- |
| JOBKOREA_API_USE_APPROVED | 예 | 기관·서비스·서버 IP·이용목적이 승인된 경우에만 `true` |
| JOBKOREA_JOBS_API_URL | 조건부 | 일반 채용정보용 발급 URL |
| JOBKOREA_ENTRY_API_URL | 조건부 | 신입·인턴 공채용 발급 URL |

두 URL 중 하나 이상이 필요합니다. 발급 URL 전체를 비밀정보로 취급해야 합니다.

잡코리아 API는 공공기관·학교가 우선 제공 대상이며 개인·일반 기업은 내부 검토 결과에 따라 발급되지 않을 수 있습니다.

### 4. 인증정보 안전하게 입력

인증정보를 채팅, README, Git 추적 파일 또는 MCP 설정 JSON에 직접 넣지 마세요.

저장소 루트에서 보안 설정기를 실행합니다.

~~~bash
node skills/job-match-search/scripts/configure-credentials.mjs
~~~

설정기는 다음 순서로 동작합니다.

1. 설정할 플랫폼을 선택합니다.
2. 플랫폼별 공식 승인 조건을 보여주고 승인 여부를 다시 확인합니다.
3. 승인된 플랫폼의 인증값만 별표로 마스킹해 입력받습니다.
4. 기본적으로 사용자 설정 디렉터리 아래 job-platform-mcp/credentials.json에 저장합니다.
5. Linux, macOS, WSL에서는 파일 권한을 0600으로 제한합니다.
6. 저장소 내부 경로, 심볼릭 링크, 다른 사용자가 읽을 수 있는 파일을 거부합니다.
7. 값은 다시 출력하지 않고 플랫폼별 설정 여부만 보여줍니다.

기본 저장 위치:

~~~text
~/.config/job-platform-mcp/credentials.json
~~~

다른 절대 경로를 사용하려면 설정기와 MCP 호스트 양쪽에 JOB_MATCH_CREDENTIALS_FILE을 동일하게 설정합니다. 저장소 내부 경로는 사용할 수 없습니다.

설정 상태 확인:

~~~bash
node skills/job-match-search/scripts/configure-credentials.mjs --check
~~~

출력에는 실제 값이 포함되지 않습니다.

~~~text
Wanted: 설정됨
사람인: 설정됨
잡코리아: 미설정
~~~

이 파일은 OS 파일 권한으로 보호되는 로컬 JSON이며 자체 암호화 파일은 아닙니다. 네이티브 Windows에서는 에이전트나 MCP 호스트가 제공하는 OS secret store 사용을 권장합니다.

### 5. MCP 호스트에 서버 등록

인증정보를 MCP 설정에 직접 복사하지 않고 공통 실행기 [run-mcp.mjs](skills/job-match-search/scripts/run-mcp.mjs)를 등록합니다.

먼저 전체 패키지를 빌드합니다.

~~~bash
pnpm build
~~~

아래 absolute-path를 실제 저장소 절대 경로로 바꿉니다.

~~~json
{
  "mcpServers": {
    "wanted": {
      "command": "node",
      "args": [
        "/absolute-path/job-platform-mcp/skills/job-match-search/scripts/run-mcp.mjs",
        "wanted"
      ],
      "env": {
        "WANTED_API_USE_APPROVED": "true"
      }
    },
    "saramin": {
      "command": "node",
      "args": [
        "/absolute-path/job-platform-mcp/skills/job-match-search/scripts/run-mcp.mjs",
        "saramin"
      ],
      "env": {
        "SARAMIN_API_USE_APPROVED": "true"
      }
    },
    "jobkorea": {
      "command": "node",
      "args": [
        "/absolute-path/job-platform-mcp/skills/job-match-search/scripts/run-mcp.mjs",
        "jobkorea"
      ],
      "env": {
        "JOBKOREA_API_USE_APPROVED": "true"
      }
    }
  }
}
~~~

설정한 플랫폼만 등록해도 됩니다. MCP 호스트를 다시 시작한 다음 도구 목록에서 다음 이름을 확인합니다.

~~~text
wanted_get_search_options
wanted_list_jobs
saramin_get_search_options
saramin_search_jobs
saramin_get_job
jobkorea_get_search_options
jobkorea_fetch_jobs
jobkorea_fetch_entry_jobs
~~~

MCP 호스트가 서버 이름을 접두사로 붙이면 실제 노출 이름은 조금 다를 수 있습니다.

## 에이전트를 위한 설정 절차

에이전트가 이 저장소를 설정할 때는 아래 순서를 따릅니다. 사람도 같은 절차를 사용할 수 있습니다.

1. 현재 디렉터리가 pnpm-workspace.yaml이 있는 저장소 루트인지 확인합니다.
2. node --version과 pnpm --version으로 요구 버전을 확인합니다.
3. pnpm install과 pnpm build를 실행합니다.
4. 개인·기업·학교·공공기관 중 신청 주체와 개인·내부 비상업용 또는 유료·상업용 중 사용 목적을 묻습니다.
5. 연결하려는 플랫폼이 현재 서비스·용도를 승인했고 인증정보까지 발급했는지 확인합니다.
6. 승인되지 않은 API는 등록하지 않습니다. 사용자가 개인·비상업용 브라우저 검색을 선택하면 책임 고지를 안내하고 [개인용 브라우저 검색 절차](skills/job-match-search/references/browser-search.md)를 따릅니다.
7. 인증값을 일반 대화창에 입력하도록 요구하지 않습니다.
8. 대화형 TTY에서 configure-credentials.mjs를 실행하고 사용자가 직접 승인 여부를 재확인한 뒤 마스킹 입력하게 합니다.
9. 사용하는 에이전트 또는 MCP 호스트의 설정 위치를 확인합니다.
10. 비밀값 없이 run-mcp.mjs의 절대 경로, 플랫폼 인자와 승인 확인 환경변수만 등록합니다.
11. MCP 호스트를 다시 시작한 뒤 결과 수가 작은 읽기 전용 요청으로 연결을 확인합니다.
12. 성공 시 연결된 플랫폼 이름만 보고합니다. 오류에도 인증값이나 잡코리아 발급 URL을 포함하지 않습니다.

에이전트가 대화형 TTY를 제공하지 못하면 설정 명령만 사용자에게 안내하고 입력이 끝날 때까지 기다립니다. 인증 실패를 자동으로 반복하지 않습니다.

## 채용 매칭 스킬 설치

스킬 원본은 다음 디렉터리에 있습니다.

~~~text
skills/job-match-search/
├── SKILL.md
├── references/
├── scripts/
└── test/
~~~

스킬은 공개 Agent Skills 형식을 사용하며 특정 에이전트 전용 frontmatter에 의존하지 않습니다. 클라이언트에 따라 검색하는 디렉터리만 다릅니다.

### Codex

개인 스킬 디렉터리에 원본 폴더를 연결합니다.

~~~bash
mkdir -p ~/.codex/skills
ln -s /absolute-path/job-platform-mcp/skills/job-match-search ~/.codex/skills/job-match-search
~~~

같은 이름의 경로가 이미 있으면 삭제하거나 덮어쓰지 말고 기존 스킬을 먼저 확인합니다.

### Claude Code

프로젝트 스킬 경로에 연결합니다.

~~~bash
mkdir -p .claude/skills
ln -s ../../skills/job-match-search .claude/skills/job-match-search
~~~

Claude Code에서는 직접 호출할 때 다음처럼 사용합니다.

~~~text
/job-match-search 내 이력서에 맞는 백엔드 공고를 찾아줘
~~~

### OpenCode

프로젝트 스킬 경로에 연결합니다.

~~~bash
mkdir -p .opencode/skills
ln -s ../../skills/job-match-search .opencode/skills/job-match-search
~~~

OpenCode는 .claude/skills와 .agents/skills 호환 경로도 지원합니다.

### OpenClaw

이 저장소 자체를 OpenClaw workspace로 사용하면 현재 skills/job-match-search 경로가 자동 검색됩니다. 다른 workspace에 설치하려면:

~~~bash
openclaw skills install /absolute-path/job-platform-mcp/skills/job-match-search
~~~

심볼릭 링크를 지원하지 않는 환경에서는 폴더 전체를 해당 클라이언트의 스킬 경로로 복사합니다. SKILL.md뿐 아니라 references와 scripts도 함께 복사해야 합니다.

## 스킬 사용법

이력서나 포트폴리오를 첨부하거나 에이전트가 읽을 수 있는 로컬 경로를 지정합니다.

~~~text
$job-match-search
첨부한 이력서를 분석해서 내 경력에 맞는 채용공고를 찾아줘.
~~~

지역과 조건을 함께 지정할 수 있습니다.

~~~text
$job-match-search
서울 또는 판교, 주 2회 이하 출근, 정규직 백엔드 포지션을 찾아줘.
Java와 Spring 실무 경험을 중요하게 보고 연봉이 공개된 공고를 우선해줘.
~~~

조건을 정하지 않고 시작해도 됩니다.

~~~text
$job-match-search
내 포트폴리오에 맞는 공고를 찾아줘. 조건은 아직 정하지 않았어.
~~~

이 경우 스킬이 지역, 출근 방식, 고용 형태와 주요 선호를 한 번에 질문합니다. 답변을 건너뛰면 제한 없이 넓게 검색합니다.

### 개인용 브라우저 검색

공식 API가 없는 개인 사용자는 다음처럼 화면이 보이는 브라우저 검색을 요청할 수 있습니다.

~~~text
$job-match-search
개인적인 구직 용도야. 사람인과 잡코리아를 브라우저로 열어서
서울 백엔드 Java 공고를 찾아줘. 현재 화면의 결과만 비교해줘.
~~~

에이전트에 브라우저 자동화 기능이 없으면 저장소 루트에서 URL을 생성할 수 있습니다.

~~~bash
node skills/job-match-search/scripts/browser-search.mjs --provider saramin,jobkorea --query "백엔드 Java 서울"
~~~

사용자가 개인·비상업용 책임 고지를 확인하고 실제 브라우저 열기를 요청한 경우에만 --open과 --acknowledge-personal-use를 함께 추가합니다.

~~~bash
node skills/job-match-search/scripts/browser-search.mjs --provider saramin,jobkorea --query "백엔드 Java 서울" --open --acknowledge-personal-use
~~~

스크립트는 사용자의 기본 브라우저에 공식 검색 URL을 열 뿐, 페이지 HTML이나 로그인 정보를 읽지 않습니다. 결과를 분석하려면 사용 중인 에이전트에 화면 읽기 가능한 브라우저 기능이 있어야 합니다.

브라우저 자동화를 사용해도 robots.txt, 약관과 관련 법령에서 자동으로 제외되는 것은 아닙니다. 이 기능은 개인용·비상업용·사용자 요청 기반·소량 조회로 위험을 줄이지만 합법성을 보증하지 않습니다. 상세 경계는 [개인용 브라우저 검색](skills/job-match-search/references/browser-search.md)을 확인하세요.

기본 결과에는 다음 정보가 포함됩니다.

- 분석한 검색 프로필과 명시한 가정
- 적합도 상위 10개 공고
- 확인된 일치 근거와 부족하거나 미확인인 요건
- 지역, 근무 형태, 마감일, 출처와 원문 링크
- 조회한 플랫폼, 검색어, 필터와 실패한 범위

적합도 점수는 비교용 휴리스틱이며 합격 확률이 아닙니다.

## 개발 명령

기여 절차는 [CONTRIBUTING.md](CONTRIBUTING.md), 코딩 에이전트의 저장소 지침은 [AGENTS.md](AGENTS.md)를 참고합니다. 모든 비긴급 변경은 Issue → 이슈 브랜치 → 검증 → 커밋 → Pull Request → 리뷰 → 병합 순서로 진행합니다.

main 브랜치에 직접 커밋하거나 푸시하지 않습니다.

전체 workspace:

~~~bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm verify
~~~

패키지 하나만 검사하려면:

~~~bash
pnpm --filter wanted-mcp test
pnpm --filter saramin-mcp test
pnpm --filter jobkorea-mcp test
~~~

보안 저장소 테스트만 실행하려면:

~~~bash
pnpm test:skill
~~~

## 프로젝트 구조

~~~text
.
├── packages/
│   ├── wanted-mcp/
│   ├── saramin-mcp/
│   └── jobkorea-mcp/
├── skills/
│   └── job-match-search/
├── package.json
├── pnpm-lock.yaml
└── pnpm-workspace.yaml
~~~

루트 workspace는 의존성 설치, 단일 lockfile과 전체 검증만 통합합니다. 각 MCP의 설정, 클라이언트, 도구 스키마와 테스트는 해당 패키지 안에 유지됩니다.

## 문제 해결

| 증상 | 확인할 내용 |
| --- | --- |
| Built MCP entry not found | 루트에서 pnpm build를 실행했는지 확인 |
| Missing required configuration | configure-credentials.mjs --check로 해당 플랫폼 설정 여부 확인 |
| Set *_API_USE_APPROVED=true | 플랫폼이 현재 기관·서비스·이용목적을 실제 승인했는지 확인한 뒤 해당 승인 확인 환경변수 설정 |
| Credential store permissions are too broad | Linux, macOS, WSL에서 인증 파일에 chmod 600 적용 |
| Credential store must be outside the project workspace | 기본 사용자 설정 경로를 사용하거나 저장소 밖의 절대 경로 지정 |
| Wanted 401 또는 403 | Client ID, Secret, 선택 Authorization과 계정 권한 확인 |
| 사람인 인증 오류 | SARAMIN_ACCESS_KEY 발급 상태와 사용량 제한 확인 |
| 잡코리아 연결 오류 | 승인 상태, 등록된 요청 IP, 발급 URL과 허용 호스트 확인 |
| MCP 도구가 보이지 않음 | 절대 경로, node 실행 경로, MCP 호스트 재시작 여부 확인 |
| 일부 플랫폼만 실패 | 정상 연결된 플랫폼 검색은 계속하고 실패한 플랫폼 설정만 점검 |

## 보안 주의사항

- 실제 인증정보를 Git에 커밋하지 마세요.
- 인증정보를 이슈, PR, 채팅 또는 로그에 붙여 넣지 마세요.
- 노출된 키는 즉시 폐기하고 플랫폼에서 재발급하세요.
- 잡코리아 호출 URL은 URL 전체를 비밀정보로 취급하세요.
- 인증 저장소 파일을 클라우드 동기화 폴더나 공유 디렉터리에 두지 마세요.
- 다른 사람이 관리하는 스킬이나 스크립트에 인증 저장소 접근 권한을 주지 마세요.
- 개인용 브라우저 모드를 백그라운드 수집, 예약 모니터링, 다중 페이지 순회, 외부 저장 또는 재배포에 사용하지 마세요.

## 라이선스와 API 이용 조건

각 채용 플랫폼의 데이터, API 사용 조건, 호출 제한과 과금 정책은 해당 플랫폼 약관을 따릅니다. 이 저장소는 인증 권한이나 유료 기능을 우회하지 않으며 API 데이터의 재배포 권한을 제공하지 않습니다.

## 책임 제한

사용자는 자신이 선택한 플랫폼, 검색 조건, 자동화 범위, 결과의 저장·이용·재배포가 최신 약관과 관련 법령에 맞는지 확인하고 자신의 책임으로 기능을 활성화해야 합니다. 이 프로젝트와 스킬은 법률 자문, 플랫폼의 승인 또는 이용허락을 제공하지 않습니다.

관련 법령이 허용하는 최대 범위에서 제작자와 기여자는 이 소프트웨어의 사용 또는 사용 불능, 계정·IP 제한, 데이터 손실, 결과 오류, 약관 또는 제3자와의 분쟁으로 발생한 손해에 책임을 부담하지 않습니다. 다만 이 고지는 고의·중과실이나 그 밖에 법률상 배제할 수 없는 책임까지 면제한다는 의미가 아닙니다. 사용자가 고지를 확인했다는 사실만으로 제작자 책임이 자동 소멸하는 것도 아닙니다.
