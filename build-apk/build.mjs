import { TwaManifest } from "/home/runner/workspace/.config/npm/node_global/lib/node_modules/@bubblewrap/cli/node_modules/@bubblewrap/core/dist/lib/TwaManifest.js";
import { TwaGenerator } from "/home/runner/workspace/.config/npm/node_global/lib/node_modules/@bubblewrap/cli/node_modules/@bubblewrap/core/dist/lib/TwaGenerator.js";
import { JdkHelper } from "/home/runner/workspace/.config/npm/node_global/lib/node_modules/@bubblewrap/cli/node_modules/@bubblewrap/core/dist/lib/jdk/JdkHelper.js";
import { AndroidSdkTools } from "/home/runner/workspace/.config/npm/node_global/lib/node_modules/@bubblewrap/cli/node_modules/@bubblewrap/core/dist/lib/androidSdk/AndroidSdkTools.js";
import { GradleWrapper } from "/home/runner/workspace/.config/npm/node_global/lib/node_modules/@bubblewrap/cli/node_modules/@bubblewrap/core/dist/lib/GradleWrapper.js";
import { Config } from "/home/runner/workspace/.config/npm/node_global/lib/node_modules/@bubblewrap/cli/node_modules/@bubblewrap/core/dist/lib/Config.js";
import { ConsoleLog } from "/home/runner/workspace/.config/npm/node_global/lib/node_modules/@bubblewrap/cli/node_modules/@bubblewrap/core/dist/lib/Log.js";
import path from "path";
import fs from "fs";

const log = new ConsoleLog("build");
const TARGET_URL = process.env.APK_TARGET_URL;
const HOST = TARGET_URL
  ? new URL(TARGET_URL).host
  : process.env.REPLIT_DEV_DOMAIN;
if (!HOST) {
  console.error("ERROR: Set APK_TARGET_URL=https://your-domain or REPLIT_DEV_DOMAIN");
  process.exit(1);
}
const ORIGIN = `https://${HOST}`;

// Additional hosts the APK should also trust (so the same APK works on both
// the deployed .replit.app URL and the development preview URL). Provide via
// APK_ADDITIONAL_HOSTS as a comma-separated list. The current dev domain is
// auto-included if it differs from the primary host.
const extraHostsRaw = (process.env.APK_ADDITIONAL_HOSTS ?? "")
  .split(",")
  .map((h) => h.trim())
  .filter(Boolean);
if (process.env.REPLIT_DEV_DOMAIN && process.env.REPLIT_DEV_DOMAIN !== HOST) {
  extraHostsRaw.push(process.env.REPLIT_DEV_DOMAIN);
}
const ADDITIONAL_ORIGINS = Array.from(
  new Set(extraHostsRaw.map((h) => `https://${h.replace(/^https?:\/\//, "")}`)),
);
log.info(`Primary host: ${HOST}`);
if (ADDITIONAL_ORIGINS.length > 0) {
  log.info(`Additional trusted origins: ${ADDITIONAL_ORIGINS.join(", ")}`);
}
const PROJECT_DIR = path.resolve("./twa-project");

const config = new Config(
  "/nix/store/xad649j61kwkh0id5wvyiab5rliprp4d-openjdk-17.0.15+6/lib/openjdk",
  "/home/runner/android-sdk",
);

log.info("Loading manifest from", `${ORIGIN}/manifest.webmanifest`);
const twaManifest = await TwaManifest.fromWebManifest(`${ORIGIN}/manifest.webmanifest`);

twaManifest.packageId = "app.replit.ankicards";
twaManifest.name = "Anki Card Generator";
twaManifest.launcherName = "Anki Cards";
twaManifest.appVersionName = "1.0.0";
twaManifest.appVersionCode = 1;
twaManifest.themeColor = (await import("/home/runner/workspace/.config/npm/node_global/lib/node_modules/@bubblewrap/cli/node_modules/color/index.js")).default("#FF3C00");
twaManifest.navigationColor = (await import("/home/runner/workspace/.config/npm/node_global/lib/node_modules/@bubblewrap/cli/node_modules/color/index.js")).default("#FF3C00");
twaManifest.backgroundColor = (await import("/home/runner/workspace/.config/npm/node_global/lib/node_modules/@bubblewrap/cli/node_modules/color/index.js")).default("#0B0B0F");
twaManifest.host = HOST;
twaManifest.startUrl = "/";
twaManifest.iconUrl = `${ORIGIN}/icons/icon-512.png`;
twaManifest.maskableIconUrl = `${ORIGIN}/icons/icon-maskable-512.png`;
twaManifest.signingKey = {
  path: path.resolve("./android.keystore"),
  alias: "android",
};
twaManifest.fallbackType = "customtabs";
twaManifest.enableNotifications = false;
twaManifest.orientation = "portrait";
twaManifest.display = "standalone";
twaManifest.shortcuts = [];
twaManifest.additionalTrustedOrigins = ADDITIONAL_ORIGINS;

await twaManifest.saveToFile(path.resolve("./twa-manifest.json"));
log.info("Saved twa-manifest.json");

if (fs.existsSync(PROJECT_DIR)) fs.rmSync(PROJECT_DIR, { recursive: true });
fs.mkdirSync(PROJECT_DIR, { recursive: true });

const gen = new TwaGenerator();
log.info("Generating TWA project at", PROJECT_DIR);
await gen.createTwaProject(PROJECT_DIR, twaManifest, log);
log.info("Project generated");

const jdkHelper = new JdkHelper(process, config);
const androidSdk = await AndroidSdkTools.create(process, config, jdkHelper, log);
const gradle = new GradleWrapper(process, androidSdk, PROJECT_DIR);

log.info("Building APK with Gradle (this takes a while)");
await gradle.assembleRelease();
log.info("Gradle build done");

const unsignedApk = path.join(PROJECT_DIR, "app/build/outputs/apk/release/app-release-unsigned.apk");
const finalApk = path.resolve("./anki-cards.apk");

log.info("Zipalign + sign");
await androidSdk.zipalign(unsignedApk, finalApk);
await androidSdk.apkSigner(
  twaManifest.signingKey.path,
  "anki1234",
  twaManifest.signingKey.alias,
  "anki1234",
  finalApk,
);

log.info("APK ready at", finalApk);

const stat = fs.statSync(finalApk);
const meta = {
  targetUrl: ORIGIN,
  host: HOST,
  additionalOrigins: ADDITIONAL_ORIGINS,
  additionalHosts: ADDITIONAL_ORIGINS.map((o) => new URL(o).host),
  packageId: twaManifest.packageId,
  versionName: twaManifest.appVersionName,
  versionCode: twaManifest.appVersionCode,
  sizeBytes: stat.size,
  builtAt: new Date().toISOString(),
};

const publicDir = path.resolve("../artifacts/anki-generator/public");
fs.copyFileSync(finalApk, path.join(publicDir, "anki-cards.apk"));
fs.writeFileSync(
  path.join(publicDir, "anki-cards.apk.json"),
  JSON.stringify(meta, null, 2),
);
log.info("Copied APK + metadata to", publicDir);
log.info(JSON.stringify(meta, null, 2));
