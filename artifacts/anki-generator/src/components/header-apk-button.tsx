import { useEffect, useState } from "react";
import { Download, Smartphone } from "lucide-react";

const APK_URL = `${import.meta.env.BASE_URL}anki-cards.apk`;

export function HeaderApkButton() {
  const [mounted, setMounted] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const standalone =
        window.matchMedia?.("(display-mode: standalone)").matches ||
        // @ts-expect-error iOS only
        window.navigator.standalone === true ||
        document.referrer.startsWith("android-app://");
      setIsStandalone(standalone);
    }
  }, []);

  if (!mounted || isStandalone) return null;

  return (
    <a
      href={APK_URL}
      download="anki-cards.apk"
      aria-label="Download Android APK"
      className="group relative inline-flex items-center gap-1.5 sm:gap-2 h-9 px-2.5 sm:px-3.5 rounded-full overflow-hidden text-white text-xs sm:text-sm font-semibold tracking-tight shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:scale-[1.03] active:scale-[0.97] transition-all duration-200"
      style={{
        background:
          "linear-gradient(120deg, hsl(15 100% 50%) 0%, hsl(25 100% 55%) 45%, hsl(15 100% 50%) 100%)",
      }}
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
        <Smartphone className="h-4 w-4 sm:hidden transition-transform group-hover:-rotate-6" />
        <Download className="hidden sm:block h-4 w-4 transition-transform group-hover:translate-y-0.5 group-hover:scale-110" />
      </span>
      <span className="relative hidden sm:inline whitespace-nowrap">Get the App</span>
      <span
        aria-hidden
        className="relative hidden sm:inline-flex items-center gap-1 ml-0.5 px-1.5 py-0.5 rounded-full bg-white/20 text-[9px] font-bold uppercase tracking-wider backdrop-blur-sm"
      >
        APK
      </span>
    </a>
  );
}
