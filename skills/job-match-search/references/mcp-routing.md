# Browser MCP routing

현재 에이전트에 노출된 도구를 확인합니다. 클라이언트가 서버 이름을 접두사로 붙일 수 있으므로 의미가 같은 이름도 사용할 수 있습니다.

## Wanted

- wanted_get_search_options
- wanted_search_jobs
- 공식 공개 검색 화면에서 /wd/{공고번호} 링크를 현재 화면 최대 20건까지 읽습니다.

## 사람인

- saramin_get_search_options
- saramin_search_jobs
- 공식 공개 검색 화면에서 /zf_user/jobs/relay/view 공고 링크를 현재 화면 최대 20건까지 읽습니다.

## 잡코리아

- jobkorea_get_search_options
- jobkorea_search_jobs
- 공식 공개 검색 화면에서 /Recruit/GI_Read 공고 링크를 현재 화면 최대 20건까지 읽습니다.

## 공통 입력

query, locations, experience, employmentTypes, workModes, includeKeywords, excludeKeywords, limit과 acknowledgePersonalUse를 지원합니다. 상세 제한은 get_search_options로 확인합니다.

## 공개 필터 지원

- Wanted: 지역만 적용합니다. 경력·고용형태·근무방식은 미적용 사유를 반환합니다.
- 사람인: 지역, 최소 경력, 고용형태와 원격을 적용합니다.
- 잡코리아: 경력 구간과 고용형태를 적용합니다. 지역은 전체 체크 상태가 불안정해 미적용으로 반환합니다.
- 조건을 적용하지 못해도 검색어에 합쳐 우회하지 않습니다. search_jobs의 filters.applied와 filters.skipped를 반드시 확인합니다.

## 호출 전략

1. 첫 검색 전에 개인·비상업용 목적과 책임 고지 수락을 확인합니다.
2. 사용 가능한 플랫폼을 한 번씩 조회합니다. 브라우저 창이 동시에 과도하게 열리지 않도록 순차 호출을 기본으로 합니다.
3. 기본 limit은 10이며 최대 20입니다.
4. 이력서 원문이나 개인정보가 아니라 파생된 직무·기술·지역만 전달합니다.
5. 플랫폼 실패는 격리하고 CAPTCHA·로그인·차단은 우회하지 않습니다.
6. 현재 화면 결과만 사용하고 다음 페이지, 상세 페이지 묶음 탐색과 예약 수집을 하지 않습니다.
7. MCP가 없으면 scripts/run-mcp.mjs 등록과 빌드를 안내합니다. 일반 웹 검색이나 숨겨진 API로 몰래 대체하지 않습니다.
