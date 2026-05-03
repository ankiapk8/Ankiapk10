import { useQuery } from "@tanstack/react-query";

export interface SubscriptionStatus {
  isPro: boolean;
  subscription: {
    id: string;
    status: string;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
  } | null;
  reason?: string;
}

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/+$/, "") ?? "";

async function fetchSubscriptionStatus(): Promise<SubscriptionStatus> {
  try {
    const res = await fetch(`${API_BASE}/api/subscription/status`, {
      credentials: "include",
    });
    if (!res.ok) return { isPro: false, subscription: null };
    return res.json();
  } catch {
    return { isPro: false, subscription: null };
  }
}

export function useSubscription() {
  const { data, isLoading, refetch } = useQuery<SubscriptionStatus>({
    queryKey: ["subscription/status"],
    queryFn: fetchSubscriptionStatus,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    retry: 1,
  });

  return {
    isPro: data?.isPro ?? false,
    subscription: data?.subscription ?? null,
    isLoading,
    refetch,
  };
}

export async function fetchProducts() {
  try {
    const res = await fetch(`${API_BASE}/api/subscription/products`);
    if (!res.ok) return [];
    const json = await res.json();
    return json.data ?? [];
  } catch {
    return [];
  }
}

export async function startCheckout(priceId: string): Promise<string | null> {
  const res = await fetch(`${API_BASE}/api/subscription/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ priceId }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as Record<string, unknown>;
    throw new Error(typeof body.error === "string" ? body.error : "Checkout failed");
  }
  const data = await res.json() as Record<string, unknown>;
  return typeof data.url === "string" ? data.url : null;
}

export async function openBillingPortal(): Promise<string | null> {
  const res = await fetch(`${API_BASE}/api/subscription/portal`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as Record<string, unknown>;
    throw new Error(typeof body.error === "string" ? body.error : "Portal access failed");
  }
  const data = await res.json() as Record<string, unknown>;
  return typeof data.url === "string" ? data.url : null;
}
