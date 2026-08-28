# Wanted browser MCP architecture

wanted-mcp는 세 계층으로 구성됩니다.

1. server.ts: TypeMCP 도구 이름, 설명과 Zod 입력 계약을 노출합니다.
2. tools/jobs.ts: 공통 검색 조건을 Wanted 공개 검색 URL의 query와 tab=position으로 변환합니다.
3. browser-search-core: 화면 표시형 Chrome을 열고 www.wanted.co.kr 호스트와 /wd/{number} 링크를 검증한 뒤 현재 화면의 최대 20건을 반환합니다.

브라우저는 새 비영구 컨텍스트를 사용하고 탭 하나를 재사용합니다. API 클라이언트, 인증 헤더, 사용자 프로필, 쿠키 저장, 내장 JSON과 네트워크 요청 복제 계층은 없습니다.

페이지 구조 변경은 tools/jobs.ts의 공개 검색 URL 또는 index.ts의 linkSelector/isJobUrl 정책 안에서만 반영합니다. 접근 제한을 만나면 선택자를 우회하거나 내부 엔드포인트로 전환하지 않고 호출을 중단합니다.
