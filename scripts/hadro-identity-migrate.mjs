/**
 * One-shot HADRO identity content migration (ordered, contextual replacements).
 * Skips: node_modules, .git, dist, .next, coverage, binary assets, lockfiles, historical migrations.
 * Run from repo root: node scripts/hadro-identity-migrate.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const SKIP_DIR = new Set([
  "node_modules",
  ".git",
  "dist",
  ".next",
  "coverage",
  "build",
]);

const SKIP_EXT = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".ico",
  ".woff",
  ".woff2",
  ".ttf",
  ".map",
  ".lock",
]);

/** Historical SQL migrations — leave branding comments as-is */
function isHistoricalMigration(rel) {
  return /[\\/]migrations[\\/]\d+_.+\.sql$/i.test(rel);
}

const TEXT_EXT = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".json",
  ".css",
  ".md",
  ".mdx",
  ".txt",
  ".html",
  ".yml",
  ".yaml",
  ".example",
  ".webmanifest",
]);

/**
 * Ordered replacements (longest / most specific first).
 * Each: [pattern, replacement] — string or RegExp
 */
const REPLACEMENTS = [
  // Legal / company phrases
  ["Cheque-Inn Systems", "HADRO Technologies"],
  ["Cheque-Inn Technologies", "HADRO Technologies"],
  ["Cheque Inn Ltd", "Example Company Ltd"],
  ["Why Cheque-Inn", "Why HADRO"],
  ["WhyChequeInn", "WhyHadro"],
  ["why-cheque-inn", "why-hadro"],
  ["Cheque-Inn Workforce Management", "HADRO — Intelligent Workforce Management"],
  ["Enterprise Workforce Management Platform", "Intelligent Workforce Management"],
  ["Powered by Cheque-Inn", "Powered by HADRO Technologies"],
  ["Cheque-Inn API", "HADRO API"],
  ["Cheque-Inn Mobile", "HADRO"],
  ["Cheque-Inn Design System", "HADRO Design System"],
  ["Cheque-Inn Marketing Foundation", "HADRO Marketing Foundation"],
  ["Cheque-Inn V2", "HADRO V2"],
  ["CHEQUE-INN V2", "HADRO V2"],
  ["Cheque-Inn:", "HADRO:"],
  ["— Cheque-Inn", "— HADRO"],
  ["Cheque-Inn’s", "HADRO’s"],
  ["Cheque-Inn's", "HADRO's"],
  ["log out of Cheque-Inn", "log out of HADRO"],
  ["Sign in to Cheque-Inn", "Sign in to HADRO"],
  ["Welcome to Cheque-Inn", "Welcome to HADRO"],
  ["How Cheque-Inn", "How HADRO"],
  ["What is Cheque-Inn", "What is HADRO"],
  ["Cheque-Inn remains", "HADRO remains"],
  ["never replaces Cheque-Inn", "never replaces HADRO"],
  ["platform branding Cheque-Inn", "platform branding HADRO"],
  ["for Cheque-Inn", "for HADRO"],
  ["of Cheque-Inn", "of HADRO"],
  ["to Cheque-Inn", "to HADRO"],
  ["by Cheque-Inn", "by HADRO"],
  ["in Cheque-Inn", "in HADRO"],
  ["on Cheque-Inn", "on HADRO"],
  ["Cheque-Inn monorepo", "HADRO monorepo"],
  ["Cheque-Inn Web", "HADRO Web"],
  ["Cheque-Inn web", "HADRO web"],
  ["Cheque-Inn website", "HADRO website"],
  ["Cheque-Inn public", "HADRO public"],
  ["Cheque-Inn ·", "HADRO ·"],
  ["· Cheque-Inn", "· HADRO"],
  ["© Cheque-Inn", "© HADRO Technologies"],
  ["Cheque-Inn ©", "HADRO ©"],
  ["Cheque-Inn", "HADRO"],
  ["CHEQUE-INN", "HADRO"],
  ["Cheque Inn", "HADRO"],
  ["ChequeInn", "Hadro"],

  // Domains / packages / IDs / keys
  ["support@chequeinn.com", "support@hadro.africa"],
  ["https://chequeinn.com", "https://hadro.africa"],
  ["http://chequeinn.com", "https://hadro.africa"],
  ["chequeinn.com", "hadro.africa"],
  ["noreply@cheque-inn.local", "noreply@hadro.local"],
  ["cheque-inn.local", "hadro.local"],
  ["com.chequeinn.mobile", "com.hadro.mobile"],
  ["com.chequeinn.app", "com.hadro.mobile"],
  ["cheque-inn-web", "hadro-web"],
  ["cheque-inn-api", "hadro-api"],
  ["cheque-inn-mobile", "hadro-mobile"],
  ['"name": "cheque-inn"', '"name": "hadro"'],
  ["cheque_inn_refresh_token", "hadro_refresh_token"],
  ["cheque_inn_token", "hadro_token"],
  ["cheque_inn_theme_pref", "hadro_theme_pref"],
  ["cheque_inn_session_expiry_handling", "hadro_session_expiry_handling"],
  ["cheque-inn:session-expired", "hadro:session-expired"],
  ["cheque-inn-sidebar-collapsed", "hadro-sidebar-collapsed"],
  ["cheque-inn-nav-groups-expanded", "hadro-nav-groups-expanded"],
  ["cheque_inn_", "hadro_"],
  ["cheque-inn", "hadro"],
  ["chequeinn", "hadro"],

  // Social handle paths already covered by chequeinn → hadro in URLs

  // Old brand-blue hexes (central tokens already updated; catch leftovers)
  ["#2563eb", "#f4a300"],
  ["#2563EB", "#F4A300"],
  ["#1d4ed8", "#d48f00"],
  ["#1D4ED8", "#D48F00"],
  ["#1e40af", "#b87a00"],
  ["#1E40AF", "#B87A00"],
  ["#E6F4FE", "#1C1C1C"],
  ["#e6f4fe", "#1c1c1c"],
];

function walk(dir, out = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const ent of entries) {
    if (SKIP_DIR.has(ent.name)) continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      walk(full, out);
    } else if (ent.isFile()) {
      out.push(full);
    }
  }
  return out;
}

function shouldProcess(filePath) {
  const rel = path.relative(ROOT, filePath);
  if (isHistoricalMigration(rel)) return false;
  // Skip this script and huge binary-adjacent dumps
  if (rel.includes("hadro-identity-migrate")) return false;
  if (/\.(png|jpg|jpeg|webp|ico|woff2?|ttf|map)$/i.test(filePath)) return false;
  if (filePath.endsWith("package-lock.json")) return true; // update package name strings
  const ext = path.extname(filePath).toLowerCase();
  if (!ext && !path.basename(filePath).startsWith(".")) {
    // extensionless text dumps
    return true;
  }
  if (ext === ".example" || path.basename(filePath).includes(".env")) return true;
  return TEXT_EXT.has(ext) || path.basename(filePath) === "site.webmanifest";
}

function transform(content) {
  let next = content;
  for (const [from, to] of REPLACEMENTS) {
    if (from instanceof RegExp) {
      next = next.replace(from, to);
    } else if (next.includes(from)) {
      next = next.split(from).join(to);
    }
  }
  return next;
}

const changed = [];
for (const file of walk(ROOT)) {
  if (!shouldProcess(file)) continue;
  let raw;
  try {
    raw = fs.readFileSync(file, "utf8");
  } catch {
    continue;
  }
  // Skip if no brand-ish content
  if (!/cheque|2563eb|1d4ed8|1e40af/i.test(raw)) continue;
  const next = transform(raw);
  if (next !== raw) {
    fs.writeFileSync(file, next, "utf8");
    changed.push(path.relative(ROOT, file));
  }
}

console.log(`Updated ${changed.length} files:`);
for (const f of changed.sort()) console.log(`  ${f}`);
