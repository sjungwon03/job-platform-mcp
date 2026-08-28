import {
  type BrowserSearchInput,
  browserSearchInputSchema,
  buildSearchTerms,
  type GetSearchOptionsInput,
  getBrowserSearchOptions,
  getSearchOptionsInputSchema,
  type VisibleBrowserCrawler,
} from "@job-platform/browser-search-core";

export type { BrowserSearchInput as SearchJobsInput, GetSearchOptionsInput };
export {
  browserSearchInputSchema as searchJobsInputSchema,
  getSearchOptionsInputSchema,
};

export function getSearchOptions() {
  return getBrowserSearchOptions("saramin");
}

export function buildSearchUrl(input: BrowserSearchInput): URL {
  const url = new URL("https://www.saramin.co.kr/zf_user/search/recruit");
  url.searchParams.set("searchword", buildSearchTerms(input));

  return url;
}

export function searchJobs(
  client: VisibleBrowserCrawler,
  input: BrowserSearchInput,
) {
  return client.search(
    buildSearchUrl(input),
    input.limit,
    input.excludeKeywords,
  );
}
