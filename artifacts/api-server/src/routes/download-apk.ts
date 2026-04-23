import { Router, type IRouter } from "express";
import { createReadStream, statSync } from "node:fs";
import {
  apkMatchesHost,
  ensureApkForHost,
  getApkPath,
  getBuildState,
  getStoredTargetHost,
  readApkMeta,
  setStoredTargetHost,
  startRebuild,
} from "../lib/apk-builder";

const router: IRouter = Router();

function isPublicHost(host: string | null): host is string {
  if (!host) return false;
  if (host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0") return false;
  if (host.startsWith("172.") || host.startsWith("10.") || host.startsWith("192.168.")) return false;
  return host.includes(".");
}

function envHost(): string | null {
  return (
    process.env.REPLIT_DEPLOYMENT_DOMAIN ||
    process.env.REPLIT_DEV_DOMAIN ||
    null
  );
}

function resolveTargetHost(
  req: Express.Request & { headers?: Record<string, unknown>; query?: Record<string, unknown> },
): string | null {
  const queryHost =
    typeof req.query?.host === "string" ? (req.query.host as string) : null;
  const fwd = req.headers?.["x-forwarded-host"];
  const hostHeader = req.headers?.host;
  const candidates = [
    queryHost,
    typeof fwd === "string" ? fwd.split(",")[0].trim() : Array.isArray(fwd) ? (fwd[0] as string) : null,
    typeof hostHeader === "string" ? hostHeader : null,
  ]
    .filter((v): v is string => typeof v === "string" && v.length > 0)
    .map((v) => v.replace(/:\d+$/, ""));

  for (const c of candidates) {
    if (isPublicHost(c)) return c;
  }
  // Fall back to the Replit-provided public domain so internal/loopback
  // callers (curl, health checks) don't poison the bundled APK with
  // "localhost" or a private LAN address.
  return envHost();
}

router.get("/download-apk/status", (req, res) => {
  const host = resolveTargetHost(req as never);
  res.json({
    build: getBuildState(),
    apk: readApkMeta(),
    requestedHost: host,
    matches: host ? apkMatchesHost(host) : false,
    publishedHost: getStoredTargetHost(),
  });
});

router.post("/download-apk/configure", (req, res) => {
  const body = (req.body ?? {}) as { host?: unknown };
  let raw = typeof body.host === "string" ? body.host.trim() : "";
  raw = raw.replace(/^https?:\/\//i, "").replace(/\/.*$/, "").replace(/:\d+$/, "");
  if (!isPublicHost(raw)) {
    res.status(400).json({
      error: "Please provide a public hostname like myapp.replit.app",
    });
    return;
  }
  setStoredTargetHost(raw);
  const build = startRebuild(raw);
  res.status(202).json({ publishedHost: raw, build });
});

router.post("/download-apk/rebuild", (req, res) => {
  const host = resolveTargetHost(req as never);
  if (!host) {
    res.status(400).json({ error: "Could not determine target host" });
    return;
  }
  const state = startRebuild(host);
  res.status(202).json({ build: state });
});

router.get("/download-apk", (req, res) => {
  const host = resolveTargetHost(req as never);

  if (host) {
    ensureApkForHost(host);
  }

  const buildState = getBuildState();
  const apkPath = getApkPath();
  const matches = host ? apkMatchesHost(host) : true;

  if (host && !matches && buildState.status === "building") {
    res.status(202).json({
      status: "building",
      message: "APK is being prepared for this URL. Try again in a minute.",
      build: buildState,
    });
    return;
  }

  if (!apkPath) {
    res.status(404).json({ error: "APK not found" });
    return;
  }

  const stat = statSync(apkPath);
  res.setHeader("Content-Type", "application/vnd.android.package-archive");
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="anki-cards.apk"',
  );
  res.setHeader("Content-Length", String(stat.size));
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (host && !matches) {
    res.setHeader("X-APK-Host-Mismatch", "true");
  }
  createReadStream(apkPath).pipe(res);
});

export default router;
