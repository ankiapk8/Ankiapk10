import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { getUncachableStripeClient } from "../stripeClient";
import { logger } from "../lib/logger";

const router: IRouter = Router();

async function getActiveSubscription(userId: string) {
  const result = await db.execute(
    sql`
      SELECT s.id, s.status, s.current_period_end, s.cancel_at_period_end
      FROM stripe.subscriptions s
      JOIN public.users u ON u.stripe_subscription_id = s.id
      WHERE u.id = ${userId}
        AND s.status = 'active'
      LIMIT 1
    `
  );
  return result.rows[0] ?? null;
}

router.get("/subscription/status", async (req, res, next): Promise<void> => {
  try {
    if (!req.isAuthenticated()) {
      res.json({ isPro: false, subscription: null, reason: "unauthenticated" });
      return;
    }

    const userId = req.user!.id;
    const sub = await getActiveSubscription(userId);

    res.json({
      isPro: !!sub,
      subscription: sub ? {
        id: sub.id,
        status: sub.status,
        currentPeriodEnd: sub.current_period_end,
        cancelAtPeriodEnd: sub.cancel_at_period_end,
      } : null,
    });
  } catch (err) {
    logger.error({ err }, "Failed to get subscription status");
    res.json({ isPro: false, subscription: null, reason: "error" });
  }
});

router.get("/subscription/products", async (_req, res, next): Promise<void> => {
  try {
    const result = await db.execute(
      sql`
        SELECT
          p.id as product_id,
          p.name as product_name,
          p.description as product_description,
          pr.id as price_id,
          pr.unit_amount,
          pr.currency,
          pr.recurring
        FROM stripe.products p
        JOIN stripe.prices pr ON pr.product = p.id AND pr.active = true
        WHERE p.active = true
          AND p.metadata->>'tier' = 'pro'
        ORDER BY pr.unit_amount ASC
      `
    );

    const products: Record<string, { id: string; name: string; description: string; prices: any[] }> = {};
    for (const row of result.rows as any[]) {
      if (!products[row.product_id]) {
        products[row.product_id] = {
          id: row.product_id,
          name: row.product_name,
          description: row.product_description,
          prices: [],
        };
      }
      products[row.product_id].prices.push({
        id: row.price_id,
        unitAmount: row.unit_amount,
        currency: row.currency,
        recurring: row.recurring,
      });
    }

    res.json({ data: Object.values(products) });
  } catch (err) {
    logger.warn({ err }, "Failed to fetch products from stripe schema — Stripe may not be initialized yet");
    res.json({ data: [] });
  }
});

router.post("/subscription/checkout", async (req, res, next): Promise<void> => {
  try {
    if (!req.isAuthenticated()) {
      res.status(401).json({ error: "Authentication required to subscribe" });
      return;
    }

    const { priceId } = req.body as { priceId?: string };
    if (!priceId) {
      res.status(400).json({ error: "priceId is required" });
      return;
    }

    const userId = req.user!.id;
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const stripe = await getUncachableStripeClient();

    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        name: [user.firstName, user.lastName].filter(Boolean).join(" ") || undefined,
        metadata: { userId },
      });
      await db.update(usersTable)
        .set({ stripeCustomerId: customer.id })
        .where(eq(usersTable.id, userId));
      customerId = customer.id;
    }

    const baseUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`;
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${baseUrl}/pricing?success=1`,
      cancel_url: `${baseUrl}/pricing?canceled=1`,
    });

    res.json({ url: session.url });
  } catch (err) {
    next(err);
  }
});

router.post("/subscription/portal", async (req, res, next): Promise<void> => {
  try {
    if (!req.isAuthenticated()) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const userId = req.user!.id;
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));

    if (!user?.stripeCustomerId) {
      res.status(400).json({ error: "No billing account found" });
      return;
    }

    const stripe = await getUncachableStripeClient();
    const baseUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`;
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${baseUrl}/pricing`,
    });

    res.json({ url: portalSession.url });
  } catch (err) {
    next(err);
  }
});

export default router;
