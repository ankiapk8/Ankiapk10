import { useEffect, useState } from "react";
import { Download, Smartphone, Apple } from "lucide-react";
import { apiUrl } from "@/lib/utils";
import { IosInstallModal } from "@/components/ios-install-modal";

const APK_URL = apiUrl("api/download-apk");

export function HeaderApkButton() {
  const [mounted, setMounted] = useState(false);
  const [isInApk, setIsInApk] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIos, setShowIos] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
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
        (navigator.platform === "MacIntel" && (navigator as Navigator & { maxTouchPoints?: number }).maxTouchPoints! > 1);
      setIsIos(iOS);
    }
  }, []);

  if (!mounted || isInApk) return null;

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (isIos) {
      e.preventDefault();
      setShowIos(true);
    }
  };

  return (
    <>
      <a
        href={isIos ? "#" : APK_URL}
        download={isIos ? undefined : "anki-cards.apk"}
        onClick={handleClick}
        aria-label={isIos ? "Install on iPhone or iPad" : "Download Android APK"}
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
          ) : (
            <>
              <Smartphone className="h-4 w-4 sm:hidden transition-transform group-hover:-rotate-6" />
              <Download className="hidden sm:block h-4 w-4 transition-transform group-hover:translate-y-0.5 group-hover:scale-110" />
            </>
          )}
        </span>
        <span className="relative hidden sm:inline whitespace-nowrap">
          {isIos ? "Install on iPhone" : "Get the App"}
        </span>
        <span
          aria-hidden
          className="relative hidden sm:inline-flex items-center gap-1 ml-0.5 px-1.5 py-0.5 rounded-full bg-white/20 text-[9px] font-bold uppercase tracking-wider backdrop-blur-sm"
        >
          {isIos ? "iOS" : "APK"}
        </span>
      </a>
      <IosInstallModal open={showIos} onClose={() => setShowIos(false)} />
    </>
  );
}
