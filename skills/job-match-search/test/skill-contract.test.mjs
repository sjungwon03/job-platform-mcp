import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const files = {
  skill: new URL("../SKILL.md", import.meta.url),
  routing: new URL("../references/mcp-routing.md", import.meta.url),
  runner: new URL("../scripts/run-mcp.mjs", import.meta.url),
};

test("skill routes all visible-browser MCPs without credential setup", async () => {
  const [skill, routing, runner] = await Promise.all(
    Object.values(files).map((url) => readFile(url, "utf8")),
  );

  for (const provider of ["wanted", "saramin", "jobkorea"]) {
    assert.match(routing, new RegExp(provider + "_search_jobs"));
    assert.match(runner, new RegExp(provider));
  }
  assert.match(skill, /acknowledgePersonalUse/);
  assert.doesNotMatch(runner, /credential|CLIENT_SECRET|ACCESS_KEY|API_URL/i);
  assert.doesNotMatch(skill, /configure-credentials/);
});
