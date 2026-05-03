import { Router, type IRouter, type Request, type Response } from "express";
import { eq, sql } from "drizzle-orm";
import { db, userTopicsTable } from "@workspace/db";
import { GetAllTopicsResponse, UpsertTopicsBody, UpsertTopicsResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/topics", async (req: Request, res: Response): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const rows = await db
    .select()
    .from(userTopicsTable)
    .where(eq(userTopicsTable.userId, req.user.id));

  const topics: Record<string, unknown[]> = {};
  for (const row of rows) {
    topics[row.storageKey] = (row.topics as unknown[]) ?? [];
  }

  res.json(GetAllTopicsResponse.parse({ topics }));
});

router.put("/topics/:storageKey", async (req: Request, res: Response): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const parsed = UpsertTopicsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const topicsJson = sql`${JSON.stringify(parsed.data.topics)}::jsonb`;

  await db
    .insert(userTopicsTable)
    .values({
      userId: req.user.id,
      storageKey: String(req.params.storageKey),
      topics: topicsJson,
    })
    .onConflictDoUpdate({
      target: [userTopicsTable.userId, userTopicsTable.storageKey],
      set: {
        topics: topicsJson,
        updatedAt: new Date(),
      },
    });

  res.json(UpsertTopicsResponse.parse({ topics: parsed.data.topics }));
});

export default router;