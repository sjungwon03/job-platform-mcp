# Credential setup

이 문서는 최초 연결 또는 인증 오류가 있을 때만 읽는다. 목표는 사용자가 자신의 인증정보로 각 MCP를 실행하게 하는 것이며, 스킬이나 서버가 공용 키를 제공하지 않는다.

## 공통 흐름

먼저 다음 사항을 한 번에 묻는다.

1. 사용 목적: 개인·내부 비상업용 또는 유료 서비스·재판매 등 상업용
2. 신청 주체: 개인, 일반 기업, 학교 또는 공공기관
3. 연결할 플랫폼: Wanted, 사람인, 잡코리아 중 복수 선택 가능
4. 각 플랫폼이 현재 서비스 URL·이용 목적을 승인했는지와 인증정보 발급 여부

아직 승인되지 않은 플랫폼은 신청 링크를 안내하고 나중에 설정할 수 있게 한다. 승인 없이 진행하겠다고 하면 연결된 플랫폼이나 사용자가 직접 제공한 공고만 사용한다. 크롤링을 대안으로 제안하지 않는다.

플랫폼별 전제:

- Wanted: 신청서에 사업자등록번호, 회사명과 서비스 URL이 필수이며 필요한 API 권한별 심사를 받는다.
- 사람인: 회사명/학교명, 부서명/전공명, 서비스 URL과 이용목적을 제출해 승인받는다. API 기반 서비스의 재판매 또는 이용요금 부과는 금지되어 있으므로 상업용은 별도 서면 허가가 확인된 경우에만 진행한다.
- 잡코리아: 공공기관·학교가 우선 대상이다. 개인·일반 기업은 내부 검토로 거절될 수 있고 이용기관, 서비스, 서버 IP와 이용목적 승인 후 고유 호출 URL을 발급받는다.

인증정보가 발급되었고 로컬 터미널을 사용할 수 있다면 모노레포 루트에서 다음을 실행한다.

~~~bash
node skills/job-match-search/scripts/configure-credentials.mjs
~~~

스크립트는 TTY에서 입력 문자를 마스킹하고 기본적으로 사용자 설정 디렉터리의 job-platform-mcp/credentials.json에 저장한다. 저장 파일은 저장소 밖에 있으며 POSIX 환경에서는 소유자만 읽고 쓸 수 있는 0600 권한을 적용한다. JOB_MATCH_CREDENTIALS_FILE 환경변수로 다른 절대 경로를 선택할 수 있다.

저장 상태만 확인하려면:

~~~bash
node skills/job-match-search/scripts/configure-credentials.mjs --check
~~~

일반 대화창에 비밀값을 붙여 넣으라고 요청하지 않는다. 사용자가 이미 붙여 넣었다면 응답에서 값을 인용하거나 반복하지 말고, 노출된 키를 폐기·재발급한 뒤 로컬 비밀 저장소에 설정하도록 권한다.

## MCP 호스트 등록

먼저 pnpm build를 실행한다. 각 MCP 호스트에는 실제 인증정보 대신 공통 실행기를 등록한다. 승인 확인 값은 비밀정보가 아니지만 사용자가 실제 승인 범위를 확인한 경우에만 `true`로 설정한다.

~~~text
command: node
args: ["/absolute/path/to/skills/job-match-search/scripts/run-mcp.mjs", "wanted"]
env: { WANTED_API_USE_APPROVED: "true" }
~~~

마지막 인자는 wanted, saramin, jobkorea 중 하나다. 실행기는 해당 플랫폼에 필요한 인증정보만 자식 MCP 프로세스에 전달한다. 에이전트별 설정 파일 위치와 표현 방식은 다를 수 있으므로, 사용 중인 MCP 호스트 형식에 맞춰 command와 args만 옮긴다.

플랫폼별 승인 확인 환경변수:

- Wanted: `WANTED_API_USE_APPROVED=true`
- 사람인: `SARAMIN_API_USE_APPROVED=true`
- 잡코리아: `JOBKOREA_API_USE_APPROVED=true`

이 값은 플랫폼의 승인을 대신하지 않으며 단순한 로컬 안전 게이트다.

## Wanted

필수:

- WANTED_CLIENT_ID
- WANTED_CLIENT_SECRET

선택:

- WANTED_AUTHORIZATION: 사용자의 계정에 별도 권한 또는 유료 기능이 활성화된 경우

발급 신청: https://openapi.wanted.jobs/apply/

신청서에는 사업자등록번호, 회사명과 서비스 URL이 필요하다. 서버는 승인된 사용자의 키와 계정 권한으로만 호출한다. 결제나 유료 권한을 우회하거나 공용 키를 공유하지 않는다.

## 사람인

필수:

- SARAMIN_ACCESS_KEY

발급 신청: https://oapi.saramin.co.kr/

서비스 이용자 주의사항은 API를 사용한 서비스의 재판매와 이용요금 부과를 금지한다. 상업용·유료 서비스는 사람인의 별도 서면 허가가 확인되지 않으면 연결하지 않는다.

## 잡코리아

다음 중 하나 이상:

- JOBKOREA_JOBS_API_URL
- JOBKOREA_ENTRY_API_URL

이용 안내: https://www.jobkorea.co.kr/service/api

잡코리아는 승인과 요청 IP 등록 후 고유 호출 URL을 발급한다. 이 URL 전체를 비밀값으로 취급한다.

공공기관·학교가 우선 제공 대상이며 개인·일반 기업은 승인되지 않을 수 있다.

## 선택 설정

일반적으로 기본값을 유지하며 사용자가 요청한 경우에만 설정한다.

- WANTED_API_BASE_URL
- WANTED_REQUEST_TIMEOUT_MS
- SARAMIN_API_BASE_URL
- SARAMIN_REQUEST_TIMEOUT_MS
- JOBKOREA_REQUEST_TIMEOUT_MS

## 연결 확인

- 인증정보는 MCP 서버 프로세스의 환경변수로 주입하고 서버를 다시 시작한다.
- 각 플랫폼에서 결과 수를 작게 한 읽기 전용 조회를 한 번 실행한다.
- 성공 여부와 연결된 플랫폼 이름만 보고한다.
- 오류 메시지를 보여줄 때 비밀값과 잡코리아 호출 URL이 섞이지 않았는지 먼저 확인한다.
- 인증 실패를 반복 시도하지 않는다. 한 번 실패하면 환경변수 이름, 발급 상태, 요청 IP 등록 여부를 점검하도록 안내한다.

## 크롤링 금지

공식 승인을 받지 못했거나 API 할당량을 소진했더라도 플랫폼 웹사이트, 모바일 내부 API 또는 검색 페이지를 자동 수집하지 않는다. 로그인·CAPTCHA·robots.txt·IP 차단·속도 제한을 우회하지 않는다. 크롤링이 필요하다는 요구가 있으면 플랫폼의 범위가 명시된 서면 허가와 별도 법률 검토가 선행되어야 한다.
