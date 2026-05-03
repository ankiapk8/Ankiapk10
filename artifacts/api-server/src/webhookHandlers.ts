import { getStripeSync, getUncachableStripeClient } from './stripeClient';
import { db, usersTable } from '@workspace/db';
import { eq } from 'drizzle-orm';
import { logger } from './lib/logger';

async function handleCheckoutSessionCompleted(session: Record<string, unknown>): Promise<void> {
  const customerId = session.customer as string | undefined;
  if (!customerId) return;
  const userId = (session.metadata as Record<string, string> | undefined)?.userId;
  if (!userId) return;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (user && !user.stripeCustomerId) {
    await db.update(usersTable)
      .set({ stripeCustomerId: customerId })
      .where(eq(usersTable.id, userId));
    logger.info({ userId, customerId }, 'Linked Stripe customer ID from webhook');
  }
}

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        'STRIPE WEBHOOK ERROR: Payload must be a Buffer. ' +
        'This usually means express.json() parsed the body before reaching this handler. ' +
        'FIX: Ensure webhook route is registered BEFORE app.use(express.json()).'
      );
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (webhookSecret) {
      try {
        const stripe = await getUncachableStripeClient();
        const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
        logger.info({ type: event.type }, 'Stripe webhook event received');

        switch (event.type) {
          case 'checkout.session.completed':
            await handleCheckoutSessionCompleted(event.data.object as unknown as Record<string, unknown>);
            break;
          case 'customer.subscription.updated':
          case 'customer.subscription.deleted':
            logger.info({ type: event.type }, 'Subscription state changed — stripe-replit-sync will update the stripe schema');
            break;
          default:
            break;
        }
      } catch (err) {
        logger.warn({ err }, 'Direct webhook verification failed — falling back to stripe-replit-sync');
      }
    }

    try {
      const sync = await getStripeSync();
      await sync.processWebhook(payload, signature);
    } catch (err) {
      logger.warn({ err }, 'stripe-replit-sync processWebhook failed (non-fatal)');
    }
  }
}
