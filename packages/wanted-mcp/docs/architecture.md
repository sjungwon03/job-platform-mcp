# Architecture

## 경계

~~~text
MCP host
  └─ user-owned environment credentials
      └─ TypeMCP stdio server
          ├─ Zod tool input validation
          └─ WantedClient
              └─ Wanted OpenAPI
~~~

WantedClient가 인증 헤더, HTTPS, 타임아웃, 쿼리 직렬화를 전담합니다. 도구 핸들러는 인증정보를 직접 다루지 않습니다.

## 사용자별 결제 모델

MCP 서버는 결제 대행이나 멀티테넌트 키 저장소가 아닙니다. 프로세스 하나가 MCP 사용자 한 명의 Wanted 인증정보를 사용합니다. 따라서 배포본을 공유하더라도 각 사용자는 자신의 MCP 호스트 설정에서 자신의 키를 주입합니다.

권한형 또는 유료 API를 추가할 때도 동일한 원칙을 지킵니다.

1. 사용자가 Wanted와 직접 계약하고 권한을 발급받습니다.
2. 서버는 WANTED_AUTHORIZATION 등 공식 명세의 인증정보를 환경에서 읽습니다.
3. 도구는 권한을 사전 가정하지 않고 호출합니다.
4. Wanted가 반환한 인증·권한·과금 오류는 안전한 오류로 전달합니다.
5. 인증정보, 전체 요청 헤더, 민감한 응답은 로그에 남기지 않습니다.

향후 원격 멀티테넌트 서버로 전환한다면 사용자별 비밀 저장소, OAuth 또는 키 위임, 사용량 격리, 감사 로그를 별도 설계해야 합니다. 현재 stdio 골격에는 해당 책임을 넣지 않습니다.

## API 버전

기본 클라이언트는 V2(https://openapi.wanted.jobs/v2)를 사용합니다. V1 기능을 추가할 때는 경로만 섞지 말고 V1 베이스 URL을 가진 별도 클라이언트 또는 명시적인 버전 라우팅을 사용합니다.
