/**
 * Synchronizes release.json (canonical) into package metadata and runtime manifests.
 *
 * Usage (repo root): npm run release:sync
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const MANIFEST_PATH = path.join(ROOT, "release.json");

function readManifest() {
  const raw = fs.readFileSync(MANIFEST_PATH, "utf8");
  const manifest = JSON.parse(raw);

  if (typeof manifest.version !== "string" || !manifest.version.trim()) {
    throw new Error("release.json: \"version\" must be a non-empty string");
  }

  const build =
    typeof manifest.build === "number" && Number.isFinite(manifest.build)
      ? manifest.build
      : Number.parseInt(String(manifest.build ?? "0"), 10) || 0;

  manifest.build = build;
  manifest.mobile = manifest.mobile ?? {};
  manifest.mobile.androidVersionCode =
    manifest.mobile.androidVersionCode ?? build;
  manifest.mobile.iosBuildNumber =
    String(manifest.mobile.iosBuildNumber ?? build);

  return manifest;
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function updatePackageJson(relativePath, version) {
  const filePath = path.join(ROOT, relativePath);
  const pkg = JSON.parse(fs.readFileSync(filePath, "utf8"));
  pkg.version = version;
  writeJson(filePath, pkg);
  console.log(`[release:sync] ${relativePath} → ${version}`);
}

function copyManifest(manifest, relativePath) {
  const filePath = path.join(ROOT, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  writeJson(filePath, manifest);
  console.log(`[release:sync] wrote ${relativePath}`);
}

function main() {
  const manifest = readManifest();
  const { version } = manifest;

  updatePackageJson("frontend/package.json", version);
  updatePackageJson("backend/package.json", version);
  updatePackageJson("mobile/package.json", version);

  const rootPkgPath = path.join(ROOT, "package.json");
  if (fs.existsSync(rootPkgPath)) {
    const rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, "utf8"));
    rootPkg.version = version;
    writeJson(rootPkgPath, rootPkg);
    console.log(`[release:sync] package.json → ${version}`);
  }

  const appJsonPath = path.join(ROOT, "mobile", "app.json");
  const appJson = JSON.parse(fs.readFileSync(appJsonPath, "utf8"));
  appJson.expo.version = version;
  appJson.expo.ios = appJson.expo.ios ?? {};
  appJson.expo.android = appJson.expo.android ?? {};
  appJson.expo.ios.buildNumber = manifest.mobile.iosBuildNumber;
  appJson.expo.android.versionCode = manifest.mobile.androidVersionCode;
  writeJson(appJsonPath, appJson);
  console.log(
    `[release:sync] mobile/app.json → ${version} (iOS build ${manifest.mobile.iosBuildNumber}, Android code ${manifest.mobile.androidVersionCode})`
  );

  const manifestCopies = [
    "frontend/lib/release.manifest.json",
    "mobile/src/lib/release.manifest.json",
    "backend/src/config/release.manifest.json",
  ];
  for (const dest of manifestCopies) {
    copyManifest(manifest, dest);
  }

  console.log(`[release:sync] Done — canonical version ${version} (build ${manifest.build})`);
}

main();
