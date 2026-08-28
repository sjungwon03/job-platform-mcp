#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  configuredPlatforms,
  getStorePath,
  loadCredentialStore,
  saveCredentialStore,
} from "./credential-store.mjs";
import { PROVIDER_POLICIES } from "./provider-policy.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(scriptDirectory, "../../..");

const PLATFORM_NAMES = {
  wanted: "Wanted",
  saramin: "사람인",
  jobkorea: "잡코리아",
};

function printStatus(credentials, storePath) {
  const status = configuredPlatforms(credentials);
  process.stdout.write("인증 저장소: " + storePath + "\n");
  for (const [platform, configured] of Object.entries(status)) {
    process.stdout.write(
      PLATFORM_NAMES[platform] + ": " + (configured ? "설정됨" : "미설정") + "\n",
    );
  }
}

function readTty(prompt, { secret = false } = {}) {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error("Secure input requires an interactive TTY");
  }

  return new Promise((resolve, reject) => {
    let value = "";
    const input = process.stdin;

    const cleanup = () => {
      input.off("data", onData);
      input.setRawMode(false);
      input.pause();
    };

    const onData = (chunk) => {
      for (const character of chunk) {
        if (character === "\u0003") {
          cleanup();
          process.stdout.write("\n");
          reject(new Error("Setup cancelled"));
          return;
        }
        if (character === "\r" || character === "\n") {
          cleanup();
          process.stdout.write("\n");
          resolve(value.trim());
          return;
        }
        if (character === "\u007f" || character === "\b") {
          if (value.length > 0) {
            value = value.slice(0, -1);
            process.stdout.write("\b \b");
          }
          continue;
        }
        if (character >= " ") {
          value += character;
          process.stdout.write(secret ? "*" : character);
        }
      }
    };

    process.stdout.write(prompt);
    input.setEncoding("utf8");
    input.setRawMode(true);
    input.resume();
    input.on("data", onData);
  });
}

function validateJobKoreaUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    return "유효한 URL이어야 합니다";
  }
  if (url.protocol !== "https:") return "HTTPS URL이어야 합니다";
  if (
    url.hostname !== "jobkorea.co.kr" &&
    !url.hostname.endsWith(".jobkorea.co.kr")
  ) {
    return "jobkorea.co.kr 호스트의 URL이어야 합니다";
  }
}

async function askCredential(
  label,
  currentValue,
  { required = true, validate } = {},
) {
  while (true) {
    const state = currentValue
      ? " [설정됨: Enter 유지, - 삭제]"
      : required
        ? " [필수]"
        : " [선택]";
    const value = await readTty(label + state + ": ", { secret: true });

    if (!value && currentValue) return currentValue;
    if (value === "-") {
      if (!required) return undefined;
      process.stdout.write("필수 값은 삭제할 수 없습니다.\n");
      continue;
    }
    if (!value) {
      if (!required) return undefined;
      process.stdout.write("필수 값을 입력하세요.\n");
      continue;
    }
    const validationError = validate?.(value);
    if (validationError) {
      process.stdout.write(validationError + "\n");
      continue;
    }
    return value;
  }
}

function parsePlatforms(value) {
  const normalized = value.trim().toLowerCase();
  if (normalized === "all") return ["wanted", "saramin", "jobkorea"];

  const selected = [
    ...new Set(normalized.split(/[\s,]+/).filter(Boolean)),
  ];
  if (
    selected.length === 0 ||
    selected.some((platform) => !(platform in PLATFORM_NAMES))
  ) {
    throw new Error("wanted, saramin, jobkorea 또는 all을 입력하세요");
  }
  return selected;
}

async function confirmApprovedUse(platform) {
  process.stdout.write(
    "\n" +
      PLATFORM_NAMES[platform] +
      " 승인 조건: " +
      PROVIDER_POLICIES[platform].notice +
      "\n",
  );
  const answer = await readTty(
    "공식 승인을 받았고 승인된 용도로만 사용합니까? (yes 입력, 그 외 건너뜀): ",
  );
  if (answer.trim().toLowerCase() === "yes") return true;
  process.stdout.write(
    PLATFORM_NAMES[platform] +
      " 인증정보 입력을 건너뜁니다. 승인 전에는 크롤링으로 대체하지 마세요.\n",
  );
  return false;
}

function isInsideWorkspace(filePath) {
  const relative = path.relative(workspaceRoot, filePath);
  return (
    relative === "" ||
    (!relative.startsWith(".." + path.sep) && !path.isAbsolute(relative))
  );
}

async function main() {
  const storePath = getStorePath();
  if (isInsideWorkspace(storePath)) {
    throw new Error("Credential store must be outside the project workspace");
  }
  const credentials = await loadCredentialStore(storePath);

  if (process.argv.includes("--help")) {
    process.stdout.write(
      "Usage: configure-credentials.mjs [--check]\n" +
        "Secrets are accepted only from an interactive TTY.\n",
    );
    return;
  }
  if (process.argv.includes("--check")) {
    printStatus(credentials, storePath);
    return;
  }
  if (process.argv.length > 2) {
    throw new Error("Unknown option. Use --help for usage");
  }

  printStatus(credentials, storePath);
  const selected = parsePlatforms(
    await readTty(
      "설정할 플랫폼 (wanted, saramin, jobkorea, all / 쉼표로 복수 선택): ",
    ),
  );

  if (selected.includes("wanted")) {
    if (!(await confirmApprovedUse("wanted"))) {
      selected.splice(selected.indexOf("wanted"), 1);
    }
  }
  if (selected.includes("wanted")) {
    credentials.WANTED_CLIENT_ID = await askCredential(
      "WANTED_CLIENT_ID",
      credentials.WANTED_CLIENT_ID,
    );
    credentials.WANTED_CLIENT_SECRET = await askCredential(
      "WANTED_CLIENT_SECRET",
      credentials.WANTED_CLIENT_SECRET,
    );
    credentials.WANTED_AUTHORIZATION = await askCredential(
      "WANTED_AUTHORIZATION",
      credentials.WANTED_AUTHORIZATION,
      { required: false },
    );
  }

  if (selected.includes("saramin")) {
    if (!(await confirmApprovedUse("saramin"))) {
      selected.splice(selected.indexOf("saramin"), 1);
    }
  }
  if (selected.includes("saramin")) {
    credentials.SARAMIN_ACCESS_KEY = await askCredential(
      "SARAMIN_ACCESS_KEY",
      credentials.SARAMIN_ACCESS_KEY,
    );
  }

  if (selected.includes("jobkorea")) {
    if (!(await confirmApprovedUse("jobkorea"))) {
      selected.splice(selected.indexOf("jobkorea"), 1);
    }
  }
  if (selected.includes("jobkorea")) {
    const jobsUrl = await askCredential(
      "JOBKOREA_JOBS_API_URL",
      credentials.JOBKOREA_JOBS_API_URL,
      { required: false, validate: validateJobKoreaUrl },
    );
    const entryUrl = await askCredential(
      "JOBKOREA_ENTRY_API_URL",
      credentials.JOBKOREA_ENTRY_API_URL,
      { required: false, validate: validateJobKoreaUrl },
    );
    if (!jobsUrl && !entryUrl) {
      throw new Error("잡코리아 호출 URL 중 하나 이상이 필요합니다");
    }
    credentials.JOBKOREA_JOBS_API_URL = jobsUrl;
    credentials.JOBKOREA_ENTRY_API_URL = entryUrl;
  }

  for (const [key, value] of Object.entries(credentials)) {
    if (!value) delete credentials[key];
  }
  await saveCredentialStore(credentials, storePath);
  process.stdout.write("인증정보를 안전하게 저장했습니다.\n");
  printStatus(credentials, storePath);
}

main().catch((error) => {
  process.stderr.write("설정 실패: " + error.message + "\n");
  process.exitCode = 1;
});
