import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Smartphone, Download, ShieldCheck, Sparkles } from "lucide-react";

const APK_URL = `${import.meta.env.BASE_URL}anki-cards.apk`;

export function DownloadApkCard() {
  const [downloading, setDownloading] = useState(false);

  const isAndroid = typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent);

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

          <div className="hidden md:block flex-1">
            <h3 className="text-xl font-serif font-bold tracking-tight">Get the Android app</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Native experience — full screen, app icon on your home screen, no browser bar.
            </p>
            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                Signed APK
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Trusted Web Activity
              </span>
              <span className="text-muted-foreground/70">v1.0.0 · ~3 MB</span>
            </div>
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
            {!isAndroid && (
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
      </CardContent>
    </Card>
  );
}
