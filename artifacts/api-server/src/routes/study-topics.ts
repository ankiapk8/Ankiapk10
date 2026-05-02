import { Router, type IRouter, type Request, type Response } from "express";
import { db, userTopicsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

const router: IRouter = Router();

const TopicSchema = z.object({
  id: z.string(),
  name: z.string(),
  subject: z.string().optional().default(""),
  filesAndMedia: z.string().optional().default(""),
  videoLink: z.string().optional().default(""),
  universityLecturer: z.string().optional().default(""),
  amboss: z.string().optional().default(""),
  notes: z.string().optional().default(""),
  status: z.enum(["Not Started", "In Progress", "Done", "Revised"]).default("Not Started"),
  difficultyLevel: z.enum(["Easy", "Medium", "Hard"]).default("Medium"),
  priority: z.enum(["Low", "Medium", "High"]).default("Medium"),
  from: z.string().optional().default(""),
});

const UpsertTopicsBody = z.object({
  topics: z.array(TopicSchema),
});

router.get("/study-topics", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const userId = req.user.id;
  const rows = await db
    .select()
    .from(userTopicsTable)
    .where(eq(userTopicsTable.userId, userId));

  const topics: Record<string, unknown[]> = {};
  for (const row of rows) {
    topics[row.storageKey] = (row.topics as unknown[]) ?? [];
  }

  res.json({ topics });
});

router.put("/study-topics/:storageKey", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { storageKey } = req.params;
  const parsed = UpsertTopicsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body", details: parsed.error });
    return;
  }

  const userId = req.user.id;
  const topics = parsed.data.topics;

  await db
    .insert(userTopicsTable)
    .values({
      userId,
      storageKey,
      topics: topics as unknown as Record<string, unknown>[],
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [userTopicsTable.userId, userTopicsTable.storageKey],
      set: {
        topics: topics as unknown as Record<string, unknown>[],
        updatedAt: new Date(),
      },
    });

  res.json({ topics });
});

export default router;
