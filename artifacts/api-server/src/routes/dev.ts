import { Router, type IRouter } from "express";
import { setDevProOverride, clearDevProOverride, getDevOverrideEntry } from "../lib/dev-overrides";
import { countAllDecksByUser, FREE_TIER } from "../lib/free-tier-limits";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

const router: IRouter = Router();

if (process.env.NODE_ENV !== "production") {
  router.post("/dev/set-pro", (req, res): void => {
    if (!req.isAuthenticated()) {
      res.status(401).json({ error: "Must be logged in to use dev overrides" });
      return;
    }
    const userId = req.user!.id;
    const { isPro } = req.body as { isPro?: boolean };
    if (typeof isPro !== "boolean") {
      res.status(400).json({ error: "isPro must be a boolean" });
      return;
    }
    setDevProOverride(userId, isPro);
    res.json({ ok: true, userId, devIsPro: isPro });
  });

  router.delete("/dev/set-pro", (req, res): void => {
    if (!req.isAuthenticated()) {
      res.status(401).json({ error: "Must be logged in" });
      return;
    }
    const userId = req.user!.id;
    clearDevProOverride(userId);
    res.json({ ok: true, userId, devIsPro: null });
  });

  router.get("/dev/status", (req, res): void => {
    if (!req.isAuthenticated()) {
      res.json({ authenticated: false, userId: null, devIsPro: null, simulated: false });
      return;
    }
    const userId = req.user!.id;
    const entry = getDevOverrideEntry(userId);
    res.json({
      authenticated: true,
      userId,
      devIsPro: entry?.isPro ?? null,
      simulated: entry?.simulated ?? false,
    });
  });

  router.post("/dev/simulate-subscribe", (req, res): void => {
    if (!req.isAuthenticated()) {
      res.status(401).json({ error: "Must be logged in to simulate subscription" });
      return;
    }
    const userId = req.user!.id;
    setDevProOverride(userId, true, true);
    res.json({ ok: true, isPro: true, userId, simulated: true });
  });

  router.delete("/dev/simulate-subscribe", (req, res): void => {
    if (!req.isAuthenticated()) {
      res.status(401).json({ error: "Must be logged in" });
      return;
    }
    const userId = req.user!.id;
    setDevProOverride(userId, false, false);
    res.json({ ok: true, isPro: false, userId, simulated: false });
  });

  router.get("/dev/usage", async (req, res): Promise<void> => {
    if (!req.isAuthenticated()) {
      res.status(401).json({ error: "Must be logged in" });
      return;
    }
    const userId = req.user!.id;
    const today = new Date().toISOString().slice(0, 10);

    const [deckCount, exportRow] = await Promise.all([
      countAllDecksByUser(userId),
      db.execute(
        sql`SELECT count FROM quota_usage WHERE key = ${userId} AND metric = 'apkg_export' AND period = ${today}`,
      ),
    ]);

    const exportCount = (() => {
      const row = exportRow.rows[0] as { count?: unknown } | undefined;
      if (!row) return 0;
      return typeof row.count === "number" ? row.count : parseInt(String(row.count ?? "0"), 10);
    })();

    res.json({
      decks: { count: deckCount, max: FREE_TIER.MAX_DECKS },
      exportsToday: { count: exportCount, max: FREE_TIER.MAX_APKG_EXPORTS_PER_DAY },
    });
  });

  router.post("/dev/reset-quota", async (req, res): Promise<void> => {
    if (!req.isAuthenticated()) {
      res.status(401).json({ error: "Must be logged in" });
      return;
    }
    const userId = req.user!.id;
    const today = new Date().toISOString().slice(0, 10);

    await db.execute(
      sql`DELETE FROM quota_usage WHERE key = ${userId} AND metric = 'apkg_export' AND period = ${today}`,
    );

    res.json({ ok: true, message: "Daily export quota reset to 0" });
  });
}

export default router;
