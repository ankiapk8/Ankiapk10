import { Router, type IRouter } from "express";
import { pool } from "@workspace/db";
import { logger } from "../lib/logger";

const router: IRouter = Router();

type CheckStatus = "ok" | "fail" | "skipped";

interface CheckResult {
  status: CheckStatus;
  message?: string;
  latencyMs?: number;
}

async function checkDatabase(): Promise<CheckResult> {
  if (!process.env["DATABASE_URL"]) {
    return { status: "fail", message: "DATABASE_URL is not set" };
  }
  const start = Date.now();
  try {
    await pool.query("SELECT 1");
    return { status: "ok", latencyMs: Date.now() - start };
  } catch (err) {
    return {
      status: "fail",
      message: err instanceof Error ? err.message : "Database query failed",
      latencyMs: Date.now() - start,
    };
  }
}

function checkOpenAI(): CheckResult {
  const apiKey =
    process.env["OPENAI_API_KEY1"] ||
    process.env["OPENAI_API_KEY"] ||
    process.env["AI_INTEGRATIONS_OPENAI_API_KEY"];
  if (!apiKey) {
    return {
      status: "fail",
      message: "OPENAI_API_KEY1 (or OPENAI_API_KEY) is not set",
    };
  }
  const baseUrl =
    process.env["AI_INTEGRATIONS_OPENAI_BASE_URL"] || "https://api.openai.com/v1";
  try {
    new URL(baseUrl);
  } catch {
    return { status: "fail", message: `Invalid OpenAI base URL: ${baseUrl}` };
  }
  return { status: "ok" };
}

router.get("/healthz", async (_req, res) => {
  const [database, openai] = await Promise.all([
    checkDatabase(),
    Promise.resolve(checkOpenAI()),
  ]);

  const allOk = database.status === "ok" && openai.status === "ok";
  const status: "ok" | "degraded" = allOk ? "ok" : "degraded";

  if (!allOk) {
    logger.warn(
      { database, openai },
      "Health check reported degraded dependencies",
    );
  }

  res.status(allOk ? 200 : 503).json({
    status,
    checks: {
      database,
      openai,
    },
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

export default router;
