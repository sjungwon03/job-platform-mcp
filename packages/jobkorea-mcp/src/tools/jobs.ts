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
  return getBrowserSearchOptions("jobkorea");
}

export function buildSearchUrl(input: BrowserSearchInput): URL {
  const url = new URL("https://www.jobkorea.co.kr/Search/");
  url.searchParams.set("stext", buildSearchTerms(input));

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
