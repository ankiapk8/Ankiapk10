import Stripe from 'stripe';
import { StripeSync } from 'stripe-replit-sync';

interface ConnectorSettings {
  secret_key?: unknown;
  webhook_secret?: unknown;
}

interface ConnectorItem {
  settings?: ConnectorSettings;
}

interface ConnectorResponse {
  items?: ConnectorItem[];
}

function isConnectorResponse(value: unknown): value is ConnectorResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    (!('items' in value) || Array.isArray((value as ConnectorResponse).items))
  );
}

async function getStripeCredentials(): Promise<{ secretKey: string; webhookSecret?: string }> {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? "repl " + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
      ? "depl " + process.env.WEB_REPL_RENEWAL
      : null;

  if (!hostname || !xReplitToken) {
    throw new Error(
      'Missing Replit environment variables. ' +
      'Ensure the Stripe integration is connected via the Integrations tab.'
    );
  }

  const resp = await fetch(
    `https://${hostname}/api/v2/connection?include_secrets=true&connector_names=stripe`,
    {
      headers: { Accept: "application/json", X_REPLIT_TOKEN: xReplitToken },
      signal: AbortSignal.timeout(10_000),
    }
  );

  if (!resp.ok) {
    throw new Error(`Failed to fetch Stripe credentials: ${resp.status} ${resp.statusText}`);
  }

  const raw: unknown = await resp.json();

  if (!isConnectorResponse(raw)) {
    throw new Error('Unexpected response format from Replit connector API.');
  }

  const settings = raw.items?.[0]?.settings;
  const secretKey = settings?.secret_key;

  if (typeof secretKey !== 'string' || !secretKey) {
    throw new Error(
      'Stripe integration not connected or missing secret key. ' +
      'Connect Stripe via the Integrations tab first.'
    );
  }

  const webhookSecret = settings?.webhook_secret;

  return {
    secretKey,
    webhookSecret: typeof webhookSecret === 'string' && webhookSecret ? webhookSecret : undefined,
  };
}

export async function getUncachableStripeClient(): Promise<Stripe> {
  const { secretKey } = await getStripeCredentials();
  return new Stripe(secretKey);
}

export async function getStripeSync(): Promise<StripeSync> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  const { secretKey, webhookSecret } = await getStripeCredentials();
  return new StripeSync({
    poolConfig: { connectionString: databaseUrl },
    stripeSecretKey: secretKey,
    stripeWebhookSecret: webhookSecret ?? '',
  });
}
