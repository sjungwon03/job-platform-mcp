import { describe, expect, it } from "vitest";
import { getJobInputSchema, searchJobsInputSchema } from "../src/tools/jobs.js";

describe("Saramin job schemas", () => {
  it("applies documented paging and sort defaults", () => {
    expect(searchJobsInputSchema.parse({})).toEqual({
      start: 0,
      count: 10,
      sort: "pd",
    });
  });

  it("enforces the documented maximum result count", () => {
    expect(() => searchJobsInputSchema.parse({ count: 111 })).toThrow();
  });

  it("requires a numeric job id", () => {
    expect(getJobInputSchema.parse({ id: "12345" })).toEqual({ id: "12345" });
    expect(() => getJobInputSchema.parse({ id: "job-12345" })).toThrow();
  });
});
