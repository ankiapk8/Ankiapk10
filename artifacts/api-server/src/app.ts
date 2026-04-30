import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "node:path";
import fs from "node:fs";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json({ limit: "200mb" }));
app.use(express.urlencoded({ extended: true, limit: "200mb" }));

app.use("/api", router);

app.get("/__replco/workspace_iframe.html", (req: Request, res: Response) => {
  const raw = typeof req.query.initialPath === "string" ? req.query.initialPath : "/";
  const initialPath = raw.startsWith("/") ? raw : "/";
  const safe = initialPath.replace(/[<>"']/g, "");
  res.setHeader("Cache-Control", "no-cache");
  res.send(`<!doctype html>
<html><head><meta charset="utf-8"><title>Preview</title>
<style>html,body,iframe{margin:0;padding:0;border:0;width:100%;height:100%;}html,body{overflow:hidden;}</style>
</head><body>
<iframe src="${safe}" allow="clipboard-read; clipboard-write; fullscreen; camera; microphone" allowfullscreen></iframe>
</body></html>`);
});

const staticDir =
  process.env.STATIC_DIR ??
  path.resolve(process.cwd(), "public");

if (fs.existsSync(staticDir)) {
  logger.info({ staticDir }, "Serving static frontend");
  app.use(
    express.static(staticDir, {
      index: false,
      maxAge: "1h",
      setHeaders: (res, filePath) => {
        if (filePath.endsWith(".html")) {
          res.setHeader("Cache-Control", "no-cache");
        }
      },
    }),
  );

  app.get(/^(?!\/api\/).*/, (_req: Request, res: Response, next: NextFunction) => {
    const indexPath = path.join(staticDir, "index.html");
    if (!fs.existsSync(indexPath)) {
      next();
      return;
    }
    res.sendFile(indexPath);
  });
}

app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  const message = err instanceof Error ? err.message : "Internal server error";
  logger.error({ err, url: req.url, method: req.method }, "Unhandled error");
  if (!res.headersSent) {
    res.status(500).json({ error: message });
  }
});

export default app;
