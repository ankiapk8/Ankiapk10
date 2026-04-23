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

const { default: App } = await import("./App");

createRoot(document.getElementById("root")!).render(<App />);

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    const swUrl = `${import.meta.env.BASE_URL}sw.js`;
    navigator.serviceWorker.register(swUrl).catch(() => {});
  });
}
