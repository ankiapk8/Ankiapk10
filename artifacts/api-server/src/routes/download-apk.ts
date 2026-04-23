import { Router, type IRouter } from "express";
import { createReadStream, statSync } from "node:fs";
import {
  apkMatchesHost,
  ensureApkForHost,
  getApkPath,
  getBuildState,
  readApkMeta,
  startRebuild,
} from "../lib/apk-builder";

const router: IRouter = Router();

function resolveTargetHost(req: Express.Request & { headers?: Record<string, unknown>; query?: Record<string, unknown> }): string | null {
  const queryHost =
    typeof req.query?.host === "string" ? (req.query.host as string) : null;
  const fwd = req.headers?.["x-forwarded-host"];
  const hostHeader = req.headers?.host;
  const raw =
    queryHost ||
    (typeof fwd === "string" ? fwd.split(",")[0].trim() : Array.isArray(fwd) ? fwd[0] : null) ||
    (typeof hostHeader === "string" ? hostHeader : null);
  if (!raw) return null;
  return raw.replace(/:\d+$/, "");
}

router.get("/download-apk/status", (req, res) => {
  const host = resolveTargetHost(req as never);
  res.json({
    build: getBuildState(),
    apk: readApkMeta(),
    requestedHost: host,
    matches: host ? apkMatchesHost(host) : false,
  });
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
