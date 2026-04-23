import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download,
  Smartphone,
  Apple,
  Loader2,
  ChevronDown,
  Globe,
  Rocket,
  Check,
  AlertTriangle,
} from "lucide-react";
import { apiUrl } from "@/lib/utils";
import { IosInstallModal } from "@/components/ios-install-modal";

const APK_URL = apiUrl("api/download-apk");
const STATUS_URL = apiUrl("api/download-apk/status");
const REBUILD_URL = apiUrl("api/download-apk/rebuild");

type ApkStatus = {
  build: {
    status: "idle" | "building" | "ready" | "failed" | "unsupported";
    targetHost: string | null;
    error: string | null;
  };
  apk: { host: string } | null;
  matches: boolean;
  publishedHost?: string | null;
};

type Target = "dev" | "published";

type TargetState = {
  host: string | null;
  building: boolean;
  matches: boolean;
  unsupported: boolean;
};

const initialTarget: TargetState = {
  host: null,
  building: false,
  matches: true,
  unsupported: false,
};

function isPublicHost(host: string): boolean {
  if (!host) return false;
  if (host === "localhost" || host === "127.0.0.1") return false;
  if (host.startsWith("172.") || host.startsWith("10.") || host.startsWith("192.168.")) return false;
  return host.includes(".");
}

export function HeaderApkButton() {
  const [mounted, setMounted] = useState(false);
  const [isInApk, setIsInApk] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIos, setShowIos] = useState(false);
  const [open, setOpen] = useState(false);

  const [dev, setDev] = useState<TargetState>(initialTarget);
  const [pub, setPub] = useState<TargetState>(initialTarget);
  const popRef = useRef<HTMLDivElement | null>(null);

  // Platform detection
  useEffect(() => {
    setMounted(true);
    if (typeof window === "undefined") return;
    const w = window as unknown as {
      Capacitor?: { isNativePlatform?: () => boolean; getPlatform?: () => string };
    };
    const inApk =
      !!w.Capacitor?.isNativePlatform?.() ||
      w.Capacitor?.getPlatform?.() === "android" ||
      w.Capacitor?.getPlatform?.() === "ios" ||
      document.referrer.startsWith("android-app://") ||
      window.matchMedia?.("(display-mode: standalone)").matches ||
      window.matchMedia?.("(display-mode: fullscreen)").matches ||
      // @ts-expect-error iOS only
      window.navigator.standalone === true ||
      /\bwv\b|AnkiGen/.test(navigator.userAgent);
    setIsInApk(inApk);
    const ua = navigator.userAgent;
    const iOS =
      /iPad|iPhone|iPod/.test(ua) ||
      (navigator.platform === "MacIntel" &&
        (navigator as Navigator & { maxTouchPoints?: number }).maxTouchPoints! > 1);
    setIsIos(iOS);

    const devHost = window.location.host.replace(/:\d+$/, "");
    if (isPublicHost(devHost)) {
      setDev((s) => ({ ...s, host: devHost }));
    }
  }, []);

  // Click-outside / ESC close
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (popRef.current && !popRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const fetchStatus = async (host: string | null): Promise<ApkStatus | null> => {
    try {
      const url = host ? `${STATUS_URL}?host=${encodeURIComponent(host)}` : STATUS_URL;
      const r = await fetch(url, { cache: "no-store" });
      if (!r.ok) return null;
      return (await r.json()) as ApkStatus;
    } catch {
      return null;
    }
  };

  // Initial load: discover the published host (from server) and fetch status for both.
  useEffect(() => {
    if (!mounted || isInApk) return;
    let cancelled = false;
    (async () => {
      const initial = await fetchStatus(null);
      if (cancelled || !initial) return;
      const publishedHost = initial.publishedHost ?? null;
      if (publishedHost) {
        setPub((s) => ({ ...s, host: publishedHost }));
        const ps = await fetchStatus(publishedHost);
        if (!cancelled && ps) {
          setPub({
            host: publishedHost,
            building: ps.build.status === "building" && ps.build.targetHost === publishedHost,
            matches: ps.matches,
            unsupported: ps.build.status === "unsupported",
          });
        }
      }
      const devHost =
        typeof window !== "undefined" ? window.location.host.replace(/:\d+$/, "") : null;
      if (devHost && isPublicHost(devHost)) {
        const ds = await fetchStatus(devHost);
        if (!cancelled && ds) {
          setDev({
            host: devHost,
            building: ds.build.status === "building" && ds.build.targetHost === devHost,
            matches: ds.matches,
            unsupported: ds.build.status === "unsupported",
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mounted, isInApk]);

  // Poll while either target is building.
  useEffect(() => {
    if (!dev.building && !pub.building) return;
    const id = window.setInterval(async () => {
      if (dev.building && dev.host) {
        const s = await fetchStatus(dev.host);
        if (s) {
          setDev((prev) => ({
            ...prev,
            building: s.build.status === "building" && s.build.targetHost === dev.host,
            matches: s.matches,
            unsupported: s.build.status === "unsupported",
          }));
        }
      }
      if (pub.building && pub.host) {
        const s = await fetchStatus(pub.host);
        if (s) {
          setPub((prev) => ({
            ...prev,
            building: s.build.status === "building" && s.build.targetHost === pub.host,
            matches: s.matches,
            unsupported: s.build.status === "unsupported",
          }));
        }
      }
    }, 4000);
    return () => window.clearInterval(id);
  }, [dev.building, pub.building, dev.host, pub.host]);

  const startDownload = async (target: Target) => {
    const t = target === "dev" ? dev : pub;
    if (!t.host) return;
    if (t.unsupported) return;
    if (!t.matches && !t.building) {
      // Kick off rebuild for that specific host first.
      try {
        await fetch(`${REBUILD_URL}?host=${encodeURIComponent(t.host)}`, { method: "POST" });
      } catch {
        /* ignore */
      }
      const setter = target === "dev" ? setDev : setPub;
      setter((s) => ({ ...s, building: true }));
      return;
    }
    // Trigger native download
    const a = document.createElement("a");
    a.href = `${APK_URL}?host=${encodeURIComponent(t.host)}`;
    a.download = "anki-cards.apk";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setOpen(false);
  };

  if (!mounted || isInApk) return null;

  const handleMainClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (isIos) {
      setShowIos(true);
      return;
    }
    setOpen((v) => !v);
  };

  const anyBuilding = dev.building || pub.building;
  const mainLabel = isIos ? "Install on iPhone" : anyBuilding ? "Preparing APK…" : "Get the App";
  const mainBadge = isIos ? "iOS" : anyBuilding ? "WAIT" : "APK";

  return (
    <>
      <div className="relative" ref={popRef}>
        <button
          type="button"
          onClick={handleMainClick}
          aria-haspopup={!isIos}
          aria-expanded={!isIos && open}
          aria-label={isIos ? "Install on iPhone or iPad" : "Download the Android app"}
          className="group relative inline-flex items-center gap-1.5 sm:gap-2 h-9 px-2.5 sm:px-3.5 rounded-full overflow-hidden text-white text-xs sm:text-sm font-semibold tracking-tight shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:scale-[1.03] active:scale-[0.97] transition-all duration-200"
          style={{
            background:
              "linear-gradient(120deg, hsl(142 71% 38%) 0%, hsl(152 76% 45%) 45%, hsl(142 71% 38%) 100%)",
          }}
          data-testid="header-apk-button"
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-full opacity-70 group-hover:opacity-100 transition-opacity"
            style={{
              background:
                "radial-gradient(60% 80% at 30% 20%, rgba(255,255,255,0.35), transparent 60%)",
            }}
          />
          <span
            aria-hidden
            className="apk-shine pointer-events-none absolute inset-y-0 -inset-x-1/2 w-1/3 skew-x-[-20deg] bg-gradient-to-r from-transparent via-white/55 to-transparent"
          />
          <span
            aria-hidden
            className="apk-pulse pointer-events-none absolute inset-0 rounded-full ring-2 ring-white/40"
          />
          <span className="relative flex items-center justify-center">
            {isIos ? (
              <Apple className="h-4 w-4 transition-transform group-hover:-rotate-6" />
            ) : anyBuilding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Smartphone className="h-4 w-4 sm:hidden transition-transform group-hover:-rotate-6" />
                <Download className="hidden sm:block h-4 w-4 transition-transform group-hover:translate-y-0.5 group-hover:scale-110" />
              </>
            )}
          </span>
          <span className="relative hidden sm:inline whitespace-nowrap">{mainLabel}</span>
          <span
            aria-hidden
            className="relative hidden sm:inline-flex items-center gap-1 ml-0.5 px-1.5 py-0.5 rounded-full bg-white/20 text-[9px] font-bold uppercase tracking-wider backdrop-blur-sm"
          >
            {mainBadge}
          </span>
          {!isIos && (
            <ChevronDown
              className={`relative h-3.5 w-3.5 ml-0.5 transition-transform ${open ? "rotate-180" : ""}`}
            />
          )}
        </button>

        <AnimatePresence>
          {!isIos && open && (
            <motion.div
              key="apk-popover"
              className="absolute right-0 mt-2 w-80 max-w-[92vw] z-50"
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              role="menu"
              data-testid="apk-popover"
            >
              <div className="rounded-2xl bg-white shadow-2xl border border-emerald-100 overflow-hidden">
                <div className="px-4 py-3 bg-gradient-to-r from-emerald-50 to-green-50 border-b border-emerald-100">
                  <div className="text-sm font-bold text-emerald-900">
                    Choose which build to install
                  </div>
                  <div className="text-[11px] text-emerald-700/80">
                    Each APK includes the full app — pick the URL it should talk to.
                  </div>
                </div>
                <div className="p-2 space-y-1.5">
                  <TargetRow
                    icon={<Globe className="w-4 h-4" />}
                    title="Dev preview build"
                    subtitle="Talks to this development URL"
                    state={dev}
                    onClick={() => startDownload("dev")}
                    testid="apk-target-dev"
                  />
                  <TargetRow
                    icon={<Rocket className="w-4 h-4" />}
                    title="Published build"
                    subtitle={
                      pub.host ? "Talks to your live deployment" : "Publish your app to enable this"
                    }
                    state={pub}
                    onClick={() => startDownload("published")}
                    testid="apk-target-published"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <IosInstallModal open={showIos} onClose={() => setShowIos(false)} />
    </>
  );
}

function TargetRow({
  icon,
  title,
  subtitle,
  state,
  onClick,
  testid,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  state: TargetState;
  onClick: () => void;
  testid: string;
}) {
  const disabled = !state.host || state.unsupported;
  const showRebuild = !!state.host && !state.matches && !state.building && !state.unsupported;
  const showBuilding = state.building;
  const showReady = !!state.host && state.matches && !state.building && !state.unsupported;

  let badge: React.ReactNode = null;
  let badgeClass = "";
  if (state.unsupported) {
    badge = (
      <>
        <AlertTriangle className="w-3 h-3" /> Unavailable
      </>
    );
    badgeClass = "bg-amber-100 text-amber-800";
  } else if (showBuilding) {
    badge = (
      <>
        <Loader2 className="w-3 h-3 animate-spin" /> Building
      </>
    );
    badgeClass = "bg-emerald-100 text-emerald-800";
  } else if (showRebuild) {
    badge = "Build now";
    badgeClass = "bg-emerald-600 text-white";
  } else if (showReady) {
    badge = (
      <>
        <Check className="w-3 h-3" /> Ready
      </>
    );
    badgeClass = "bg-emerald-100 text-emerald-800";
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      data-testid={testid}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
    >
      <div className="shrink-0 w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 text-white flex items-center justify-center shadow">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-slate-800 leading-tight">{title}</div>
        <div className="text-[11px] text-slate-500 leading-tight truncate">
          {state.host ?? subtitle}
        </div>
      </div>
      {badge && (
        <span
          className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${badgeClass}`}
        >
          {badge}
        </span>
      )}
    </button>
  );
}
