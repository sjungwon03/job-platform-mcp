import { describe, expect, it } from "vitest";
import { listJobsInputSchema } from "../src/tools/jobs.js";

describe("listJobsInputSchema", () => {
  it("applies the Wanted V2 pagination and sort defaults", () => {
    expect(listJobsInputSchema.parse({})).toEqual({
      sort: "job.latest_order",
      offset: 0,
      limit: 20,
    });
  });

  it("enforces documented filter limits", () => {
    expect(() =>
      listJobsInputSchema.parse({
        skill_tags: [1, 2, 3, 4, 5, 6],
      }),
    ).toThrow();

    expect(() => listJobsInputSchema.parse({ years: [0, 5, 10] })).toThrow();
  });
});
