import app from "./app";
import { logger } from "./lib/logger";
import { ensureDatabaseSchema } from "@workspace/db";
import { autoConfigureFromEnv } from "./lib/apk-builder";
import { runMigrations } from 'stripe-replit-sync';
import { getStripeSync } from "./stripeClient";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function initStripe(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    logger.warn("DATABASE_URL not set — skipping Stripe initialization");
    return;
  }
  try {
    logger.info("Initializing Stripe schema...");
    await runMigrations({ databaseUrl });
    logger.info("Stripe schema ready");

    const stripeSync = await getStripeSync();
    if (process.env.REPLIT_DOMAINS) {
      const webhookBaseUrl = `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`;
      await stripeSync.findOrCreateManagedWebhook(`${webhookBaseUrl}/api/stripe/webhook`);
      logger.info("Stripe webhook configured");
    } else {
      logger.info("REPLIT_DOMAINS not set — skipping webhook registration (local dev mode)");
    }

    stripeSync.syncBackfill()
      .then(() => logger.info("Stripe data synced"))
      .catch(err => logger.warn({ err }, "Stripe backfill failed (non-fatal)"));
  } catch (err) {
    logger.warn({ err }, "Stripe initialization failed (non-fatal — connect Stripe integration to enable payments)");
  }
}

async function main(): Promise<void> {
  await ensureDatabaseSchema();

  await initStripe();

  app.listen(port, (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }

    logger.info({ port }, "Server listening");
    try {
      autoConfigureFromEnv();
    } catch (err) {
      logger.warn({ err }, "APK auto-configure failed (non-fatal)");
    }
  });
}

main().catch((err) => {
  logger.error({ err }, "Server startup failed");
  process.exit(1);
});
