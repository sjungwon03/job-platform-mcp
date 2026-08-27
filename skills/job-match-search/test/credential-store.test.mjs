import assert from "node:assert/strict";
import { chmod, lstat, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  configuredPlatforms,
  getStorePath,
  loadCredentialStore,
  saveCredentialStore,
} from "../scripts/credential-store.mjs";

const temporaryRoot = process.platform === "win32" ? os.tmpdir() : "/tmp";

async function withTemporaryDirectory(run) {
  const directory = await mkdtemp(
    path.join(temporaryRoot, "job-match-credentials-test-"),
  );
  try {
    await run(directory);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

test("resolves only absolute override paths", () => {
  assert.equal(
    getStorePath({ JOB_MATCH_CREDENTIALS_FILE: "/tmp/job-match/store.json" }),
    "/tmp/job-match/store.json",
  );
  assert.throws(
    () => getStorePath({ JOB_MATCH_CREDENTIALS_FILE: "relative.json" }),
    /absolute path/,
  );
  assert.throws(
    () => getStorePath({ XDG_CONFIG_HOME: "relative" }),
    /absolute path/,
  );
});

test("round-trips known credentials with restrictive permissions", async () => {
  await withTemporaryDirectory(async (directory) => {
    const filePath = path.join(directory, "credentials.json");
    const credentials = {
      WANTED_CLIENT_ID: "client",
      WANTED_CLIENT_SECRET: "secret",
      SARAMIN_ACCESS_KEY: "access",
    };

    await saveCredentialStore(credentials, filePath);
    assert.deepEqual(await loadCredentialStore(filePath), credentials);

    if (process.platform !== "win32") {
      const stats = await lstat(filePath);
      assert.equal(stats.mode & 0o777, 0o600);
    }
  });
});

test("rejects unknown credential keys", async () => {
  await withTemporaryDirectory(async (directory) => {
    await assert.rejects(
      saveCredentialStore(
        { UNEXPECTED_SECRET: "secret" },
        path.join(directory, "credentials.json"),
      ),
      /invalid entry/,
    );
  });
});

test("rejects stores readable by other users", async () => {
  if (process.platform === "win32") return;

  await withTemporaryDirectory(async (directory) => {
    const filePath = path.join(directory, "credentials.json");
    await writeFile(
      filePath,
      JSON.stringify({
        version: 1,
        credentials: { SARAMIN_ACCESS_KEY: "secret" },
      }),
      { mode: 0o600 },
    );
    await chmod(filePath, 0o644);

    await assert.rejects(
      loadCredentialStore(filePath),
      /permissions are too broad/,
    );
  });
});

test("rejects symbolic-link credential stores", async () => {
  await withTemporaryDirectory(async (directory) => {
    const targetPath = path.join(directory, "target.json");
    const linkPath = path.join(directory, "credentials.json");
    await writeFile(
      targetPath,
      JSON.stringify({ version: 1, credentials: {} }),
      { mode: 0o600 },
    );
    await symlink(targetPath, linkPath);

    await assert.rejects(
      loadCredentialStore(linkPath),
      /regular file, not a symlink/,
    );
  });
});

test("reports configured platforms without exposing values", () => {
  assert.deepEqual(
    configuredPlatforms({
      WANTED_CLIENT_ID: "client",
      WANTED_CLIENT_SECRET: "secret",
      JOBKOREA_ENTRY_API_URL: "https://example.jobkorea.co.kr/feed",
    }),
    { wanted: true, saramin: false, jobkorea: true },
  );
});
