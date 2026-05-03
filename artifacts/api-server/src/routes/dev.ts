import { Router, type IRouter } from "express";
import { setDevProOverride, clearDevProOverride, getDevProOverride } from "../lib/dev-overrides";

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
      res.json({ authenticated: false, devIsPro: null });
      return;
    }
    const userId = req.user!.id;
    res.json({ authenticated: true, userId, devIsPro: getDevProOverride(userId) ?? null });
  });
}

export default router;
