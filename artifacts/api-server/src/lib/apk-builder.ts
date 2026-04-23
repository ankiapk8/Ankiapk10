import { spawn, type ChildProcess } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { logger } from "./logger";

const PROJECT_ROOT_CANDIDATES = [
  process.cwd(),
  path.resolve(process.cwd(), ".."),
  path.resolve(process.cwd(), "../.."),
];

function findProjectRoot(): string {
  for (const root of PROJECT_ROOT_CANDIDATES) {
    if (existsSync(path.join(root, "build-apk", "build-bundled.sh"))) {
      return root;
    }
  }
  return process.cwd();
}

const PROJECT_ROOT = findProjectRoot();
const APK_PATH = path.join(
  PROJECT_ROOT,
  "artifacts/anki-generator/public/anki-cards.apk",
);
const META_PATH = path.join(
  PROJECT_ROOT,
  "artifacts/anki-generator/public/anki-cards.apk.json",
);
const BUILD_SCRIPT = path.join(PROJECT_ROOT, "build-apk", "build-bundled.sh");

export type BuildState = {
  status: "idle" | "building" | "ready" | "failed" | "unsupported";
  targetHost: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  error: string | null;
  logTail: string[];
};

const state: BuildState = {
  status: "idle",
  targetHost: null,
  startedAt: null,
  finishedAt: null,
  error: null,
  logTail: [],
};

let currentChild: ChildProcess | null = null;

export function getBuildState(): BuildState {
  return { ...state, logTail: [...state.logTail] };
}

export type ApkMeta = {
  targetUrl?: string;
  host?: string;
  apiBase?: string;
  sizeBytes?: number;
  builtAt?: string;
  versionName?: string;
};

export function readApkMeta(): ApkMeta | null {
  try {
    if (!existsSync(META_PATH)) return null;
    return JSON.parse(readFileSync(META_PATH, "utf8")) as ApkMeta;
  } catch (err) {
    logger.warn({ err }, "Failed to read APK metadata");
    return null;
  }
}

export function getApkPath(): string | null {
  try {
    const s = statSync(APK_PATH);
    return s.isFile() ? APK_PATH : null;
  } catch {
    return null;
  }
}

export function apkMatchesHost(host: string): boolean {
  const meta = readApkMeta();
  if (!meta?.host) return false;
  return meta.host === host;
}

function appendLog(line: string) {
  state.logTail.push(line);
  if (state.logTail.length > 50) state.logTail.shift();
}

function buildSupported(): boolean {
  if (!existsSync(BUILD_SCRIPT)) return false;
  if (!existsSync(path.join(PROJECT_ROOT, "artifacts/anki-generator/android"))) {
    return false;
  }
  const androidHome =
    process.env.ANDROID_HOME ||
    process.env.ANDROID_SDK_ROOT ||
    "/home/runner/android-sdk";
  if (!existsSync(androidHome)) return false;
  return true;
}

export function startRebuild(host: string): BuildState {
  if (state.status === "building") return getBuildState();

  if (!buildSupported()) {
    state.status = "unsupported";
    state.error = "APK build tooling not available in this environment";
    return getBuildState();
  }

  state.status = "building";
  state.targetHost = host;
  state.startedAt = new Date().toISOString();
  state.finishedAt = null;
  state.error = null;
  state.logTail = [];

  const apiBase = `https://${host}/api`;
  appendLog(`Starting APK rebuild for ${apiBase}`);
  logger.info({ host, apiBase }, "Starting APK rebuild");

  const child = spawn("bash", [BUILD_SCRIPT], {
    cwd: PROJECT_ROOT,
    env: {
      ...process.env,
      API_BASE: apiBase,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  currentChild = child;

  const onData = (buf: Buffer) => {
    const text = buf.toString("utf8");
    for (const line of text.split(/\r?\n/)) {
      if (line.trim()) appendLog(line.slice(0, 500));
    }
  };
  child.stdout?.on("data", onData);
  child.stderr?.on("data", onData);

  child.on("error", (err) => {
    state.status = "failed";
    state.error = err.message;
    state.finishedAt = new Date().toISOString();
    appendLog(`Spawn error: ${err.message}`);
    logger.error({ err }, "APK rebuild spawn error");
    currentChild = null;
  });

  child.on("close", (code) => {
    state.finishedAt = new Date().toISOString();
    if (code === 0) {
      state.status = "ready";
      appendLog("Build finished successfully");
      logger.info("APK rebuild succeeded");
    } else {
      state.status = "failed";
      state.error = `Build exited with code ${code}`;
      appendLog(`Build exited with code ${code}`);
      logger.error({ code }, "APK rebuild failed");
    }
    currentChild = null;
  });

  return getBuildState();
}

export function ensureApkForHost(host: string): BuildState {
  if (apkMatchesHost(host)) {
    return getBuildState();
  }
  return startRebuild(host);
}

export function autoConfigureFromEnv(): void {
  const host =
    process.env.REPLIT_DEPLOYMENT_DOMAIN || process.env.REPLIT_DEV_DOMAIN;
  if (!host) {
    logger.info("No REPLIT_*_DOMAIN set; skipping APK auto-configure");
    return;
  }
  if (apkMatchesHost(host)) {
    logger.info({ host }, "APK already matches current host");
    return;
  }
  if (!buildSupported()) {
    logger.warn(
      { host },
      "APK host mismatch but build tooling unavailable; serving stale APK",
    );
    state.status = "unsupported";
    state.targetHost = host;
    state.error = "APK build tooling not available in this environment";
    return;
  }
  startRebuild(host);
}
