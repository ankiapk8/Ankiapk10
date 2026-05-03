import { type Response } from "express";
import { db, decksTable } from "@workspace/db";
import { sql, eq, isNull, and } from "drizzle-orm";

export const FREE_TIER = {
  MAX_CARDS_PER_DECK: 20,
  MAX_DECKS: 2,
  MAX_APKG_EXPORTS_PER_DAY: 1,
} as const;

export interface LimitError {
  limitReached: true;
  feature: string;
  requiredPlan: "pro";
  message: string;
}

export function sendLimitError(
  res: Response,
  feature: string,
  message: string,
): void {
  const body: LimitError = {
    limitReached: true,
    feature,
    requiredPlan: "pro",
    message,
  };
  res.status(403).json(body);
}

export async function checkIsPro(userId: string): Promise<boolean> {
  try {
    const result = await db.execute(
      sql`
        SELECT 1
        FROM stripe.subscriptions s
        JOIN public.users u ON u.stripe_customer_id = s.customer
        WHERE u.id = ${userId}
          AND s.status = 'active'
        LIMIT 1
      `,
    );
    return result.rows.length > 0;
  } catch {
    return false;
  }
}

export async function countRootDecksByUser(userId: string): Promise<number> {
  const result = await db
    .select({ cnt: sql<number>`cast(count(*) as int)` })
    .from(decksTable)
    .where(and(eq(decksTable.userId, userId), isNull(decksTable.parentId)));
  return result[0]?.cnt ?? 0;
}

const exportLog = new Map<string, { date: string; count: number }>();

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

export function recordAndCheckExportLimit(
  key: string,
  maxPerDay: number,
): boolean {
  const today = todayUtc();
  const entry = exportLog.get(key);
  if (!entry || entry.date !== today) {
    exportLog.set(key, { date: today, count: 1 });
    return true;
  }
  if (entry.count >= maxPerDay) return false;
  entry.count++;
  return true;
}

export function getExportCount(key: string): number {
  const today = todayUtc();
  const entry = exportLog.get(key);
  if (!entry || entry.date !== today) return 0;
  return entry.count;
}
