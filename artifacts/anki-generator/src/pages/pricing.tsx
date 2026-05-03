import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Crown, Check, Sparkles, Zap, Brain, FileText, BarChart3,
  ChevronRight, Star, Loader2, BookOpen, FileStack, Image,
  MessageSquare, Map, Download, CalendarDays, CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { AmbientOrbs } from "@/components/ambient-orbs";
import { useSubscription, fetchProducts, startCheckout, openBillingPortal } from "@/hooks/useSubscription";
import { useToast } from "@/hooks/use-toast";
import { useSearch } from "wouter";

interface Price {
  id: string;
  unitAmount: number;
  currency: string;
  recurring: { interval: string } | null;
}

interface Product {
  id: string;
  name: string;
  description: string;
  prices: Price[];
}

const FREE_FEATURES = [
  { icon: FileText, text: "Generate up to 20 cards per session" },
  { icon: BookOpen, text: "Basic flashcard decks" },
  { icon: BarChart3, text: "Study stats & streak tracking" },
  { icon: CheckCircle2, text: "SRS-based spaced repetition" },
];

const PRO_FEATURES = [
  { icon: Zap, text: "Unlimited card generation" },
  { icon: FileStack, text: "Question Bank (MCQ) generation" },
  { icon: Image, text: "Visual PDF extraction & image cards" },
  { icon: Brain, text: "AI explanations — mnemonics, OSCE, clinical" },
  { icon: Map, text: "AI mind map generation" },
  { icon: Download, text: "Export to Anki (.apkg)" },
  { icon: CalendarDays, text: "Full Study Planner access" },
  { icon: MessageSquare, text: "Priority support" },
];

function formatPrice(unitAmount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(unitAmount / 100);
}

export default function Pricing() {
  const { isPro, subscription, isLoading: subLoading, refetch } = useSubscription();
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const { toast } = useToast();
  const rawSearch = useSearch();

  useEffect(() => {
    const params = new URLSearchParams(rawSearch);
    if (params.get("success") === "1") {
      toast({ title: "Welcome to Pro!", description: "Your subscription is now active. Enjoy full access." });
      refetch();
    } else if (params.get("canceled") === "1") {
      toast({ title: "Checkout canceled", description: "You can upgrade any time from this page.", variant: "destructive" });
    }
  }, [rawSearch]);

  useEffect(() => {
    setLoadingProducts(true);
    fetchProducts()
      .then(setProducts)
      .finally(() => setLoadingProducts(false));
  }, []);

  const monthlyPrice = products
    .flatMap(p => p.prices)
    .find(p => p.recurring?.interval === "month");
  const yearlyPrice = products
    .flatMap(p => p.prices)
    .find(p => p.recurring?.interval === "year");

  async function handleCheckout(priceId: string) {
    setCheckoutLoading(priceId);
    try {
      const url = await startCheckout(priceId);
      if (url) window.location.href = url;
    } catch (err: any) {
      toast({ title: "Checkout failed", description: err.message ?? "Please try again.", variant: "destructive" });
    } finally {
      setCheckoutLoading(null);
    }
  }

  async function handlePortal() {
    setPortalLoading(true);
    try {
      const url = await openBillingPortal();
      if (url) window.location.href = url;
    } catch (err: any) {
      toast({ title: "Could not open billing portal", description: err.message ?? "Please try again.", variant: "destructive" });
    } finally {
      setPortalLoading(false);
    }
  }

  return (
    <div className="relative space-y-10 animate-in fade-in duration-500 pb-16">
      <AmbientOrbs color="hsl(38 95% 58% / 0.10)" className="rounded-3xl" />

      <PageHeader
        icon={Crown}
        iconColor="#f59e0b"
        iconGlow="hsl(38 95% 60% / 0.5)"
        gradient="from-amber-500 via-orange-400 to-yellow-500"
        title="Upgrade to Pro"
        subtitle="Unlock unlimited card generation, QBanks, AI explanations, and more."
      />

      {isPro && subscription && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-emerald-300/50 dark:border-emerald-700/50 bg-emerald-50/80 dark:bg-emerald-950/20 p-4 flex items-center gap-3"
        >
          <div className="h-9 w-9 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
            <Star className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">You're on Pro!</p>
            <p className="text-xs text-emerald-700/70 dark:text-emerald-400/70">
              {subscription.cancelAtPeriodEnd
                ? "Your subscription will end at the current period."
                : subscription.currentPeriodEnd
                  ? `Renews ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
                  : "Active subscription"}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="shrink-0 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300"
            onClick={handlePortal}
            disabled={portalLoading}
          >
            {portalLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Manage"}
          </Button>
        </motion.div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Free tier */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm p-6 flex flex-col gap-5"
        >
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Free</span>
            <div className="mt-1 flex items-end gap-1">
              <span className="text-4xl font-bold">$0</span>
              <span className="text-muted-foreground mb-1">/month</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">Get started with the essentials.</p>
          </div>
          <ul className="flex flex-col gap-2.5 flex-1">
            {FREE_FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-2.5 text-sm">
                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                {text}
              </li>
            ))}
          </ul>
          <Button variant="outline" className="w-full" disabled>
            Current plan
          </Button>
        </motion.div>

        {/* Pro tier */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative rounded-2xl border-2 border-amber-400/60 dark:border-amber-600/50 bg-gradient-to-br from-amber-50/60 via-orange-50/40 to-card dark:from-amber-950/20 dark:via-orange-950/15 dark:to-card p-6 flex flex-col gap-5 shadow-lg shadow-amber-500/10"
        >
          <div className="absolute -top-3 left-4">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm">
              <Sparkles className="h-3 w-3" />
              Most Popular
            </span>
          </div>
          <div>
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-widest">Pro</span>
            <div className="mt-1">
              {loadingProducts ? (
                <div className="flex items-center gap-2 h-10">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span className="text-muted-foreground text-sm">Loading pricing...</span>
                </div>
              ) : monthlyPrice ? (
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-bold">{formatPrice(monthlyPrice.unitAmount, monthlyPrice.currency)}</span>
                  <span className="text-muted-foreground mb-1">/month</span>
                </div>
              ) : (
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-bold">$9.99</span>
                  <span className="text-muted-foreground mb-1">/month</span>
                </div>
              )}
              {yearlyPrice && (
                <p className="mt-0.5 text-xs text-amber-600 dark:text-amber-400 font-medium">
                  Or {formatPrice(yearlyPrice.unitAmount, yearlyPrice.currency)}/year — save 33%
                </p>
              )}
              <p className="mt-1 text-sm text-muted-foreground">Everything, unlimited.</p>
            </div>
          </div>
          <ul className="flex flex-col gap-2.5 flex-1">
            {PRO_FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-2.5 text-sm">
                <div className="h-4 w-4 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
                  <Check className="h-2.5 w-2.5 text-amber-600 dark:text-amber-400" />
                </div>
                {text}
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-2">
            {isPro ? (
              <Button
                className="w-full gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 shadow-sm"
                onClick={handlePortal}
                disabled={portalLoading}
              >
                {portalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crown className="h-4 w-4" />}
                Manage subscription
              </Button>
            ) : monthlyPrice ? (
              <>
                <Button
                  className="w-full gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 shadow-sm"
                  onClick={() => handleCheckout(monthlyPrice.id)}
                  disabled={checkoutLoading !== null || subLoading}
                >
                  {checkoutLoading === monthlyPrice.id
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <Crown className="h-4 w-4" />}
                  Get Pro — {formatPrice(monthlyPrice.unitAmount, monthlyPrice.currency)}/mo
                </Button>
                {yearlyPrice && (
                  <Button
                    variant="outline"
                    className="w-full gap-2 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                    onClick={() => handleCheckout(yearlyPrice.id)}
                    disabled={checkoutLoading !== null || subLoading}
                  >
                    {checkoutLoading === yearlyPrice.id && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Annual — {formatPrice(yearlyPrice.unitAmount, yearlyPrice.currency)}/yr
                    <span className="ml-1 text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-1 py-0.5 rounded">Save 33%</span>
                  </Button>
                )}
              </>
            ) : (
              <Button
                className="w-full gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 shadow-sm"
                disabled
              >
                <Crown className="h-4 w-4" />
                Upgrade to Pro
              </Button>
            )}
          </div>
        </motion.div>
      </div>

      <div className="rounded-xl border border-border/60 bg-card/60 p-5">
        <h3 className="font-semibold mb-3 text-sm">Frequently asked questions</h3>
        <div className="space-y-3">
          {[
            {
              q: "Can I cancel anytime?",
              a: "Yes. Cancel from the billing portal and you keep Pro access until the end of your billing period.",
            },
            {
              q: "What happens to my data if I downgrade?",
              a: "All your decks, cards, and progress are always yours — nothing is deleted. Pro features are just locked.",
            },
            {
              q: "Is my payment secure?",
              a: "Payments are handled entirely by Stripe, a PCI-compliant processor. We never store your card details.",
            },
          ].map(({ q, a }) => (
            <div key={q}>
              <p className="text-sm font-medium">{q}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
