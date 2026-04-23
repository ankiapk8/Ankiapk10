import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Smartphone, Download, ShieldCheck, Sparkles, AlertTriangle } from "lucide-react";

const APK_URL = `${import.meta.env.BASE_URL}anki-cards.apk`;
const META_URL = `${import.meta.env.BASE_URL}anki-cards.apk.json`;

type ApkMeta = {
  targetUrl: string;
  host: string;
  additionalHosts?: string[];
  versionName: string;
  versionCode: number;
  sizeBytes: number;
  builtAt: string;
};

function formatSize(bytes: number) {
  if (!bytes) return "—";
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

export function DownloadApkCard() {
  const [downloading, setDownloading] = useState(false);
  const [meta, setMeta] = useState<ApkMeta | null>(null);

  const isAndroid = typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent);
  const currentHost = typeof window !== "undefined" ? window.location.host : "";
  const trustedHosts = meta ? [meta.host, ...(meta.additionalHosts ?? [])] : [];
  const targetMismatch = !!(
    meta && currentHost && !trustedHosts.includes(currentHost)
  );

  useEffect(() => {
    fetch(META_URL)
      .then(r => r.ok ? r.json() : null)
      .then(setMeta)
      .catch(() => setMeta(null));
  }, []);

  return (
    <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background shadow-sm">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-primary/20 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-20 -left-10 h-44 w-44 rounded-full bg-primary/10 blur-3xl"
      />
      <CardContent className="relative p-5 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center gap-5">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
              <Smartphone className="h-7 w-7" />
            </div>
            <div className="md:hidden">
              <h3 className="text-lg font-serif font-bold tracking-tight">Get the Android app</h3>
              <p className="text-sm text-muted-foreground">Install on your phone — study anywhere.</p>
            </div>
          </div>

          <div className="hidden md:block flex-1 min-w-0">
            <h3 className="text-xl font-serif font-bold tracking-tight">Get the Android app</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Native experience — full screen, app icon on your home screen, no browser bar.
            </p>
            <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground flex-wrap">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                Signed APK
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Trusted Web Activity
              </span>
              <span className="text-muted-foreground/70">
                v{meta?.versionName ?? "1.0.0"} · {meta ? formatSize(meta.sizeBytes) : "~3 MB"}
              </span>
            </div>
            {meta && (
              <p className="text-[10px] text-muted-foreground/60 mt-1.5 truncate">
                Targets <span className="font-mono">{meta.host}</span>
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2 md:items-end">
            <Button
              asChild
              size="lg"
              className="gap-2 shadow-md shadow-primary/20"
              onClick={() => setDownloading(true)}
            >
              <a href={APK_URL} download="anki-cards.apk">
                <Download className="h-4 w-4" />
                Download APK
              </a>
            </Button>
            {!isAndroid && !downloading && (
              <p className="text-[11px] text-muted-foreground md:text-right">
                Open this page on Android to install
              </p>
            )}
            {downloading && (
              <p className="text-[11px] text-primary md:text-right">
                Tap the file to install · enable "Unknown sources" if prompted
              </p>
            )}
          </div>
        </div>

        {targetMismatch && (
          <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs">
            <AlertTriangle className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-emerald-700 dark:text-emerald-500">
                APK was built for a different URL
              </p>
              <p className="text-emerald-700/80 dark:text-emerald-500/80 mt-0.5 leading-relaxed">
                This APK opens <span className="font-mono">{meta?.host}</span>, but you're on{" "}
                <span className="font-mono">{currentHost}</span>. After deploying, run{" "}
                <span className="font-mono bg-emerald-500/15 px-1 py-0.5 rounded">
                  APK_TARGET_URL=https://{currentHost} node build-apk/build.mjs
                </span>{" "}
                to rebuild.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
