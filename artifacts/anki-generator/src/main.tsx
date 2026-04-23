import { createRoot } from "react-dom/client";
import { setBaseUrl } from "@workspace/api-client-react";
import "./index.css";

const apiBase = import.meta.env.VITE_API_BASE as string | undefined;
if (apiBase && apiBase.trim()) {
  setBaseUrl(apiBase.trim().replace(/\/$/, ""));
}

type PromiseWithResolversConstructor = PromiseConstructor & {
  withResolvers?: <T>() => {
    promise: Promise<T>;
    resolve: (value: T | PromiseLike<T>) => void;
    reject: (reason?: unknown) => void;
  };
};

const promiseConstructor = Promise as PromiseWithResolversConstructor;

if (!promiseConstructor.withResolvers) {
  promiseConstructor.withResolvers = function withResolvers<T>() {
    let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });

    return { promise, resolve, reject };
  };
}

// Force a desktop-like viewport ratio inside the installed APK so the layout
// matches the desktop website (scaled to fit the phone's screen).
function applyApkViewport() {
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
  if (!inApk) return;
  const meta = document.querySelector('meta[name="viewport"]');
  if (meta) {
    meta.setAttribute(
      "content",
      "width=1280, initial-scale=" +
        (window.innerWidth / 1280).toFixed(4) +
        ", minimum-scale=" +
        (window.innerWidth / 1280).toFixed(4) +
        ", maximum-scale=1, user-scalable=yes, viewport-fit=cover",
    );
  }
  document.documentElement.dataset.apk = "1";
}
applyApkViewport();

const { default: App } = await import("./App");

createRoot(document.getElementById("root")!).render(<App />);

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    const swUrl = `${import.meta.env.BASE_URL}sw.js`;
    navigator.serviceWorker.register(swUrl).catch(() => {});
  });
}
