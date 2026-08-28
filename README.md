# Job Platform Browser MCP Monorepo

Wanted, 사람인, 잡코리아의 공개 채용 검색 화면을 사용자가 볼 수 있는 브라우저에서 열고, 현재 화면에 표시된 공고를 제한적으로 읽는 TypeMCP 서버 모노레포입니다. 이력서·포트폴리오를 검색 조건으로 축약하고 결과를 비교하는 이식 가능한 Agent Skill도 함께 제공합니다.

이 문서는 사람과 Codex, Claude Code, OpenCode, OpenClaw 같은 코딩 에이전트가 동일하게 설정할 수 있는 기준 문서입니다.

> 이 프로젝트는 개인 구직자를 위한 실험적 브라우저 자동화 도구입니다. 플랫폼의 허가, 법률 자문 또는 약관 준수 보증을 제공하지 않습니다. 사용 전 [준수 및 책임 안내](COMPLIANCE.md)를 읽고 각 플랫폼의 최신 약관을 직접 확인하세요.

## 무엇이 달라졌나

이 저장소의 세 MCP는 채용 플랫폼 API를 호출하지 않습니다.

- API 키, Client ID, Client Secret, access-key 또는 발급 URL이 필요하지 않습니다.
- 사용자가 볼 수 있는 별도 브라우저 창에서 공식 공개 검색 페이지를 엽니다.
- 현재 화면에 렌더링되어 실제로 표시되는 공고 링크만 최대 20건 읽습니다.
- 검색 결과 원문, HTML, 쿠키와 세션을 파일이나 데이터베이스에 저장하지 않습니다.
- 다음 페이지 자동 순회, 예약 수집, 병렬 대량 수집과 숨겨진 네트워크 요청 복제를 하지 않습니다.
- CAPTCHA, 로그인, robots.txt, 403·429, IP 차단 또는 그 밖의 접근 제한을 우회하지 않습니다.

## 구성

| 패키지 | 대상 화면 | MCP 도구 |
| --- | --- | --- |
| [wanted-mcp](packages/wanted-mcp/README.md) | Wanted 공개 포지션 검색 | wanted_get_search_options, wanted_search_jobs |
| [saramin-mcp](packages/saramin-mcp/README.md) | 사람인 공개 채용 검색 | saramin_get_search_options, saramin_search_jobs |
| [jobkorea-mcp](packages/jobkorea-mcp/README.md) | 잡코리아 공개 통합 검색 | jobkorea_get_search_options, jobkorea_search_jobs |
| browser-search-core | 화면 표시형 Chromium 실행, 허용 호스트 검사, 현재 화면 추출과 공통 입력 검증 | 내부 공용 패키지 |
| [job-match-search](skills/job-match-search/SKILL.md) | 이력서 기반 검색어 생성, 세 MCP 라우팅, 중복 제거와 적합도 평가 | 이식 가능한 Agent Skill |

각 MCP는 독립된 stdio 프로세스입니다. 공통 브라우저 계층만 공유하고 검색 URL과 공고 링크 판별 규칙은 플랫폼 패키지에 둡니다.

## 작동 방식

~~~text
이력서/포트폴리오
  → 직무·기술·경력·지역만 파생
  → 개인·비상업용 및 위험 고지 확인
  → 플랫폼별 화면 표시형 브라우저 검색
  → 현재 화면의 최대 20개 공개 링크
  → 중복 제거·적합도 비교
~~~

브라우저는 기본적으로 설치된 Google Chrome을 새로운 비영구 컨텍스트로 엽니다. MCP 프로세스마다 탭 하나를 재사용하며 프로세스가 끝나면 컨텍스트도 끝납니다. 개인 브라우저 프로필, 저장된 비밀번호나 기존 쿠키에 연결하지 않습니다.

## 요구 사항

- Node.js 22 이상
- pnpm 11 이상
- Git
- Google Chrome 또는 Playwright Core가 실행할 수 있는 Chromium 계열 브라우저
- 데스크톱 화면 세션. 서버 전용 headless 환경은 지원 대상이 아닙니다.

~~~bash
node --version
pnpm --version
git --version
~~~

## 설치와 빌드

저장소 루트에서 실행합니다.

~~~bash
git clone https://github.com/sjungwon03/job-platform-mcp.git
cd job-platform-mcp
pnpm install --frozen-lockfile
pnpm build
pnpm verify
~~~

Playwright 브라우저 바이너리를 자동 다운로드하지 않습니다. 기본 Chrome이 없으면 아래 선택 설정으로 실행 파일을 지정하세요.

~~~bash
export JOB_BROWSER_EXECUTABLE_PATH=/absolute/path/to/chrome
~~~

## 선택 환경변수

세 MCP가 같은 이름을 사용합니다. 인증정보는 없습니다.

| 환경변수 | 기본값 | 설명 |
| --- | --- | --- |
| JOB_BROWSER_CHANNEL | chrome | Playwright가 실행할 설치된 브라우저 채널 |
| JOB_BROWSER_EXECUTABLE_PATH | 미설정 | 채널 대신 사용할 브라우저 실행 파일의 절대 경로 |
| JOB_BROWSER_TIMEOUT_MS | 30000 | 페이지 이동 제한 시간 |
| JOB_BROWSER_SETTLE_MS | 2000 | DOM이 표시될 때까지 추가로 기다리는 시간 |

실행 파일 경로를 지정하면 채널 설정보다 우선합니다. 브라우저 프로필, 디버깅 포트, 쿠키 경로를 받는 옵션은 제공하지 않습니다.

## MCP 호스트 등록

먼저 루트에서 빌드한 다음 공통 실행기를 등록합니다.

~~~json
{
  "mcpServers": {
    "wanted": {
      "command": "node",
      "args": [
        "/absolute-path/job-platform-mcp/skills/job-match-search/scripts/run-mcp.mjs",
        "wanted"
      ]
    },
    "saramin": {
      "command": "node",
      "args": [
        "/absolute-path/job-platform-mcp/skills/job-match-search/scripts/run-mcp.mjs",
        "saramin"
      ]
    },
    "jobkorea": {
      "command": "node",
      "args": [
        "/absolute-path/job-platform-mcp/skills/job-match-search/scripts/run-mcp.mjs",
        "jobkorea"
      ]
    }
  }
}
~~~

사용할 플랫폼만 등록해도 됩니다. 호스트를 다시 시작한 뒤 다음 도구를 확인합니다.

~~~text
wanted_get_search_options
wanted_search_jobs
saramin_get_search_options
saramin_search_jobs
jobkorea_get_search_options
jobkorea_search_jobs
~~~

클라이언트가 서버 이름을 접두사로 추가하면 실제 표시 이름은 다를 수 있습니다.

## 검색 입력

세 search_jobs 도구는 같은 입력 계약을 사용합니다.

| 필드 | 필수 | 제한 | 의미 |
| --- | --- | --- | --- |
| query | 예 | 1~120자 | 직무명 중심 검색어 |
| locations | 아니요 | 최대 5개 | 서울, 경기 같은 지역명 |
| experience.minYears | 아니요 | 0~50 | 최소 경력 |
| experience.maxYears | 아니요 | 0~50 | 최대 경력 |
| employmentTypes | 아니요 | 정규직, 계약직, 인턴, 프리랜서 | 고용 형태 |
| workModes | 아니요 | 출근, 하이브리드, 원격 | 근무 방식 |
| includeKeywords | 아니요 | 최대 10개 | 기술·도메인 키워드 |
| excludeKeywords | 아니요 | 최대 10개 | 읽은 화면 결과에서 제외할 키워드 |
| limit | 아니요 | 1~20, 기본 10 | 현재 화면에서 반환할 최대 공고 |
| acknowledgePersonalUse | 예 | true만 허용 | 개인·비상업용 단일 검색과 잔여 위험 확인 |

query와 includeKeywords만 공식 검색어에 넣습니다. 나머지 조건은 다음 공개 필터 UI에서 적용하며, 지원하지 않거나 화면 변경으로 적용하지 못한 조건은 결과의 filters.skipped에 표시합니다. 미적용 조건을 검색어에 몰래 합치지 않습니다.

| 플랫폼 | 지역 | 경력 | 고용형태 | 근무방식 |
| --- | --- | --- | --- | --- |
| Wanted | 공개 지역 팝업의 복수 지역 | 미적용: 접근 가능한 슬라이더 없음 | 미지원 | 미지원 |
| 사람인 | 시·도 전체 | 최소 연차, 최대 연차는 미적용 | 지원 | 원격만 재택근무 가능으로 적용 |
| 잡코리아 | 미적용: 전체 체크 렌더링 불안정 | 겹치는 공개 경력 구간으로 근사 | 지원 | 미지원 |

예시:

~~~json
{
  "query": "백엔드 개발자",
  "locations": ["서울", "경기"],
  "experience": {
    "minYears": 2,
    "maxYears": 4
  },
  "employmentTypes": ["정규직"],
  "workModes": ["출근", "하이브리드"],
  "includeKeywords": ["Java", "Spring Boot", "NestJS"],
  "excludeKeywords": ["교육과정", "부트캠프"],
  "limit": 10,
  "acknowledgePersonalUse": true
}
~~~

이력서 문장 전체, 이름, 이메일, 전화번호, 상세 주소와 계정 식별자를 query나 키워드에 넣지 마세요.

## 첫 검색 전 확인

MCP는 키를 요구하지 않지만 검색 호출마다 acknowledgePersonalUse가 true여야 합니다. 에이전트는 최초 검색 전에 다음을 확인해야 합니다.

1. 사용 목적이 본인의 구직을 위한 개인·비상업용인지 묻습니다.
2. 플랫폼 약관과 자동화 관련 위험이 남아 있고 이 프로젝트가 이용허락이나 법률 자문을 제공하지 않는다고 알립니다.
3. 지역, 근무 방식, 고용 형태와 결과를 크게 바꿀 희망·제외 조건을 한 번에 묻습니다.
4. 사용자가 조건을 생략하면 넓게 검색할 수 있다고 안내합니다.
5. 사용자가 고지를 받아들인 경우에만 acknowledgePersonalUse: true로 호출합니다.

사용자가 수락하지 않거나 상업용·재판매·공유 데이터셋·예약 모니터링 목적이면 MCP 검색을 실행하지 않습니다. 사용자가 직접 제공한 개별 공고만 비교할 수 있습니다.

## Agent Skill 설치

원본은 skills/job-match-search에 있고 공개 Agent Skills 형식을 유지합니다.

### Codex

~~~bash
mkdir -p ~/.codex/skills
ln -s /absolute-path/job-platform-mcp/skills/job-match-search ~/.codex/skills/job-match-search
~~~

같은 경로가 이미 있으면 덮어쓰지 말고 기존 파일 또는 심볼릭 링크를 확인하세요.

### Claude Code

~~~bash
mkdir -p .claude/skills
ln -s ../../skills/job-match-search .claude/skills/job-match-search
~~~

### OpenCode

~~~bash
mkdir -p .opencode/skills
ln -s ../../skills/job-match-search .opencode/skills/job-match-search
~~~

### OpenClaw 및 기타 호환 클라이언트

클라이언트가 읽는 skills 디렉터리에 job-match-search 폴더를 복사하거나 심볼릭 링크로 연결합니다. SKILL.md의 name과 description을 임의로 바꾸지 않고 references와 scripts를 함께 설치합니다.

## 에이전트를 위한 자동 설정 절차

1. pnpm-workspace.yaml이 있는 저장소 루트인지 확인합니다.
2. README.md와 AGENTS.md를 끝까지 읽습니다.
3. Node.js, pnpm, Git과 화면 표시가 가능한 Chrome 설치 여부를 확인합니다.
4. pnpm install --frozen-lockfile, pnpm build, pnpm verify를 실행합니다.
5. MCP 호스트 설정에 run-mcp.mjs와 플랫폼 인자만 등록합니다. 인증정보를 요청하지 않습니다.
6. MCP 호스트를 다시 시작하고 get_search_options 도구로 연결을 검증합니다.
7. 최초 실제 검색 전에 개인·비상업용 목적과 위험 고지 수락을 확인합니다.
8. 이력서에서는 최소한의 파생 검색 조건만 만들고 search_jobs를 호출합니다.
9. CAPTCHA, 차단, 로그인 요구 또는 비정상 접근 안내가 보이면 해당 플랫폼을 즉시 중단합니다.

## 결과 형식

각 search_jobs 도구는 provider, mode, searchUrl, resultCount, results, filters와 notice를 반환합니다. filters.applied는 실제 공개 UI에 적용된 조건, filters.skipped는 지원하지 않거나 화면에서 찾지 못한 조건입니다. results에는 title, url, 현재 카드 주변의 최대 600자 summary가 포함됩니다. 이 문맥은 전체 공고나 정확한 자격요건을 대신하지 않으므로 추천 후보는 원문 화면에서 다시 확인해야 합니다.

## 개발

[CONTRIBUTING.md](CONTRIBUTING.md)와 [AGENTS.md](AGENTS.md)를 따릅니다.

~~~bash
pnpm install --frozen-lockfile
pnpm verify
git diff --check
~~~

빠른 테스트:

~~~bash
pnpm --filter @job-platform/browser-search-core test
pnpm --filter wanted-mcp test
pnpm --filter saramin-mcp test
pnpm --filter jobkorea-mcp test
pnpm test:skill
~~~

## 문제 해결

| 증상 | 확인 |
| --- | --- |
| Chrome 실행 파일을 찾지 못함 | Chrome 설치 또는 JOB_BROWSER_EXECUTABLE_PATH 절대 경로 |
| 브라우저 창이 보이지 않음 | 데스크톱 화면 세션에서 MCP 호스트가 실행되는지 확인 |
| 검색 결과가 0건 | 페이지 표시를 확인하고 JOB_BROWSER_SETTLE_MS를 소폭 늘림 |
| access restriction or CAPTCHA | 자동화를 중단하고 직접 확인. 우회하지 않음 |
| Built MCP entry not found | 루트에서 pnpm build 실행 |
| MCP 도구가 보이지 않음 | run-mcp.mjs 절대 경로와 MCP 호스트 재시작 확인 |
| 화면 구조 변경으로 링크를 못 읽음 | 해당 플랫폼 선택자 변경 Issue 생성 |

## 준수와 책임

개인·비상업용, 화면 표시, 최대 20건, 무저장이라는 제한은 위험을 줄이는 프로젝트 정책일 뿐 플랫폼의 동의나 적법성 보증이 아닙니다. 브라우저 자동화도 자동화이며 robots.txt와 별개로 약관, 저작권, 데이터베이스 권리, 접근 제한과 서비스 안정성을 검토해야 합니다.

자세한 내용과 공식 근거는 [COMPLIANCE.md](COMPLIANCE.md)를 확인하세요.
