import { Router, type IRouter } from "express";
import { createReadStream, statSync } from "node:fs";
import path from "node:path";

const router: IRouter = Router();

const CANDIDATE_PATHS = [
  "artifacts/anki-generator/dist/public/anki-cards.apk",
  "artifacts/anki-generator/public/anki-cards.apk",
  "../anki-generator/dist/public/anki-cards.apk",
  "../anki-generator/public/anki-cards.apk",
  "../../artifacts/anki-generator/dist/public/anki-cards.apk",
  "../../artifacts/anki-generator/public/anki-cards.apk",
];

function resolveApkPath(): string | null {
  for (const rel of CANDIDATE_PATHS) {
    const p = path.resolve(process.cwd(), rel);
    try {
      const s = statSync(p);
      if (s.isFile()) return p;
    } catch {
      // ignore
    }
  }
  return null;
}

router.get("/download-apk", (_req, res) => {
  const filePath = resolveApkPath();
  if (!filePath) {
    res.status(404).json({ error: "APK not found" });
    return;
  }
  const stat = statSync(filePath);
  res.setHeader("Content-Type", "application/vnd.android.package-archive");
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="anki-cards.apk"',
  );
  res.setHeader("Content-Length", String(stat.size));
  res.setHeader("Cache-Control", "public, max-age=300");
  res.setHeader("X-Content-Type-Options", "nosniff");
  createReadStream(filePath).pipe(res);
});

export default router;
